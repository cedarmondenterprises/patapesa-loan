import { NextFunction, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from './config';

export interface AuthRequest extends Request { user?: { id: string; email: string }; }
export const createToken = (user: { id: string; email: string }): string => jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as SignOptions);
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
  try { req.user = jwt.verify(token, config.jwtSecret) as { id: string; email: string }; next(); }
  catch { res.status(401).json({ success: false, message: 'Your session is invalid or expired' }); }
}
