import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth';
import { query } from './db';

export function requirePermission(permission: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    try {
      const allowed = await query(
        `SELECT 1 FROM user_roles ur JOIN admin_roles ar ON ar.id=ur.role_id
         WHERE ur.user_id=$1 AND ar.status='ACTIVE' AND ar.permissions @> $2::jsonb LIMIT 1`,
        [req.user.id, JSON.stringify([permission])],
      );
      if (!allowed.length) {
        res
          .status(403)
          .json({ success: false, message: 'You do not have permission for this action' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
