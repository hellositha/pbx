import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  lastAttempt: number;
}

const loginAttempts = new Map<string, AttemptRecord>();

export function loginRateLimiter(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const key = `login_${ip}`;
    const now = Date.now();

    const record = loginAttempts.get(key);

    if (record) {
      if (now - record.lastAttempt > windowMs) {
        // Window expired, reset
        loginAttempts.set(key, { count: 1, lastAttempt: now });
        return next();
      }

      if (record.count >= maxAttempts) {
        res.status(429).json({
          error: 'Too many failed authentication attempts. Please try again later in 15 minutes.',
          retryAfterMs: windowMs - (now - record.lastAttempt),
        });
        return;
      }

      record.count += 1;
      record.lastAttempt = now;
    } else {
      loginAttempts.set(key, { count: 1, lastAttempt: now });
    }

    next();
  };
}

export function resetLoginAttempts(ip: string): void {
  loginAttempts.delete(`login_${ip}`);
}
