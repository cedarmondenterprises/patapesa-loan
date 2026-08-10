import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { query } from '../config/database';

export interface AuditRequest extends Request {
  ip?: string;
  userAgent?: string;
}

export const auditMiddleware = (req: AuditRequest, res: Response, next: NextFunction) => {
  req.ip = req.ip || req.socket.remoteAddress || '';
  req.userAgent = req.get('User-Agent') || '';

  // Log after response
  const originalJson = res.json;
  res.json = function (body: any) {
    res.json = originalJson;
    return originalJson.call(this, body);
  };

  next();
};

export const logAction = async (
  userId: string | undefined,
  action: string,
  resourceType: string,
  resourceId: string,
  oldValues?: any,
  newValues?: any,
  status: string = 'SUCCESS',
  errorMessage?: string,
) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, status, error_message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [userId, action, resourceType, resourceId, JSON.stringify(oldValues), JSON.stringify(newValues), status, errorMessage],
    );
  } catch (error) {
    logger.error('Failed to log audit action:', error);
  }
};
