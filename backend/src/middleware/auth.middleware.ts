import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { config } from '../config/environment';

const prisma = new PrismaClient();

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  departmentId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) ||
    ((req.query.token as string) || null);

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
        lockedUntil: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(403).json({ error: 'User account is inactive or disabled' });
      return;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(403).json({ error: 'Account is temporarily locked due to failed login attempts' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}
