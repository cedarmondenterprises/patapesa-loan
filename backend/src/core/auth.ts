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
}

export function createToken(user: { id: string; email: string; authVersion: number }): string {
  return jwt.sign({ email: user.email, ver: user.authVersion, type: 'access' }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    subject: user.id,
  } as SignOptions);
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
    if (!payload.sub || payload.type !== 'access' || !Number.isInteger(payload.ver))
      throw new Error('Invalid token payload');
    const account = (
      await query<{ id: string; email: string; auth_version: number }>(
        "SELECT id,email,auth_version FROM users WHERE id=$1 AND email=$2 AND status='ACTIVE' AND deleted_at IS NULL",
        [payload.sub, payload.email],
      )
    )[0];
    if (!account || account.auth_version !== payload.ver) throw new Error('Session revoked');
    req.user = { id: account.id, email: account.email, authVersion: account.auth_version };
    next();
  } catch {
    clearAuthCookie(res);
    res.status(401).json({ success: false, message: 'Your session is invalid or expired' });
  }
}
