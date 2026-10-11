import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function auditLog(resourceName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Intercept response finish
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      // Record audit if mutation succeeded (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
        const action = `${req.method}_${resourceName.toUpperCase()}`;
        const resourceId = req.params.id || body?.id || body?.extensionNumber || null;

        // Sanitize sensitive body fields before logging
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = '***';
        if (sanitizedBody.sipPassword) sanitizedBody.sipPassword = '***';
        if (sanitizedBody.authPassword) sanitizedBody.authPassword = '***';

        prisma.auditLog
          .create({
            data: {
              userId: req.user?.id || null,
              username: req.user?.username || 'SYSTEM',
              action,
              resource: resourceName,
              resourceId: resourceId ? String(resourceId) : null,
              details: {
                path: req.originalUrl,
                params: req.params,
                payload: sanitizedBody,
              },
              ipAddress: ip,
            },
          })
          .catch(() => {
            // non-fatal
          });
      }
      return originalJson(body);
    };

    next();
  };
}
