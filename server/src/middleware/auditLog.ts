import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

export interface AuditLogOptions {
  action: string;
  resourceType?: string;
  getResourceId?: (req: Request) => string | undefined;
}

export const logAuditEvent = async (
  userId: string | null | undefined,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        resourceType,
        resourceId,
        details: details ? (details as any) : undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err: any) {
    logger.error(`Failed to record audit log for action: ${action}`, { error: err.message });
  }
};

export const auditMiddleware = (options: AuditLogOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      // Only log on success responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const resourceId = options.getResourceId ? options.getResourceId(req) : undefined;
        const clientIp = req.ip || req.socket.remoteAddress || undefined;
        const userAgent = req.get('user-agent') || undefined;

        logAuditEvent(
          userId,
          options.action,
          options.resourceType,
          resourceId,
          { method: req.method, path: req.originalUrl, statusCode: res.statusCode },
          clientIp,
          userAgent
        );
      }
    });
    next();
  };
};

export default auditMiddleware;
