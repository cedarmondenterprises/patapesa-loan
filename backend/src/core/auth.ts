import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from './config';
import { query } from './db';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; authVersion: number };
}
interface AccessTokenPayload {
  sub: string;
  email: string;
  ver: number;
  type: 'access';
  jti: string;
}

export function createToken(
  user: { id: string; email: string; authVersion: number },
  sessionId: string,
): string {
  return jwt.sign({ email: user.email, ver: user.authVersion, type: 'access' }, config.jwtSecret, {
    jwtid: sessionId,
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    subject: user.id,
  } as SignOptions);
}

export async function createSession(user: {
  id: string;
  email: string;
  authVersion: number;
}): Promise<string> {
  const sessionId = randomUUID();
  const token = createToken(user, sessionId);
  const payload = jwt.decode(token) as jwt.JwtPayload;
  if (typeof payload.exp !== 'number') throw new Error('Session expiration is required');
  await query('INSERT INTO auth_sessions(id,user_id,expires_at) VALUES($1,$2,$3)', [
    sessionId,
    user.id,
    new Date(Math.min(payload.exp * 1000, Date.now() + config.sessionMaxAgeMs)),
  ]);
  return token;
}

export async function revokeSession(req: Request): Promise<void> {
  const token = cookieToken(req) || req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return;
  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }) as unknown as AccessTokenPayload;
  } catch {
    return;
  }
  if (payload.type !== 'access' || !validSessionId(payload.jti)) return;
  await query('DELETE FROM auth_sessions WHERE id=$1 AND user_id=$2', [payload.jti, payload.sub]);
}

function validSessionId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

function cookieToken(req: Request): string | undefined {
  const cookies = req.headers.cookie?.split(';') || [];
  const match = cookies
    .map((value) => value.trim().split('='))
    .find(([name]) => name === config.authCookieName);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match.slice(1).join('='));
  } catch {
    return undefined;
  }
}

export function setAuthCookie(res: Response, token: string, remember: boolean): void {
  res.cookie(config.authCookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
    ...(remember ? { maxAge: config.sessionMaxAgeMs } : {}),
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(config.authCookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const bearer = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = cookieToken(req) || bearer;
  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }) as unknown as AccessTokenPayload;
    if (
      !payload.sub ||
      payload.type !== 'access' ||
      !Number.isInteger(payload.ver) ||
      !validSessionId(payload.jti)
    )
      throw new Error('Invalid token payload');
    // Database failures are service failures, not evidence of an expired session.
    let account: { id: string; email: string; auth_version: number } | undefined;
    try {
      account = (
        await query<{ id: string; email: string; auth_version: number }>(
          `SELECT u.id,u.email,u.auth_version FROM users u
         JOIN auth_sessions s ON s.user_id=u.id
         WHERE u.id=$1 AND u.email=$2 AND u.status='ACTIVE' AND u.deleted_at IS NULL
           AND s.id=$3 AND s.expires_at>NOW()`,
          [payload.sub, payload.email, payload.jti],
        )
      )[0];
    } catch {
      res
        .status(503)
        .json({ success: false, message: 'Unable to check your session. Please try again.' });
      return;
    }
    if (!account || account.auth_version !== payload.ver) throw new Error('Session revoked');
    req.user = { id: account.id, email: account.email, authVersion: account.auth_version };
    next();
  } catch {
    clearAuthCookie(res);
    res.status(401).json({ success: false, message: 'Your session is invalid or expired' });
  }
}
