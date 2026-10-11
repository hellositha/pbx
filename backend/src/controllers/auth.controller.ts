import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/environment';
import { comparePassword, hashPassword } from '../utils/crypto';
import { resetLoginAttempts } from '../middleware/rate-limit.middleware';

const prisma = new PrismaClient();

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body || {};

  try {
    let user;

    if (!username && !password) {
      // Direct login without credentials (auto-authenticate as primary Super Admin)
      user = await prisma.user.findFirst({
        where: {
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        include: {
          department: true,
          extension: true,
        },
      });

      if (!user) {
        user = await prisma.user.findFirst({
          where: { isActive: true },
          include: {
            department: true,
            extension: true,
          },
        });
      }

      if (!user) {
        res.status(404).json({ error: 'No active administrator account found' });
        return;
      }
    } else {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ username: username }, { email: username }],
        },
        include: {
          department: true,
          extension: true,
        },
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ error: 'Account has been deactivated. Please contact an administrator.' });
        return;
      }

      // Check account lockout
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        res.status(403).json({
          error: `Account is locked due to repeated failed logins. Please retry in ${waitMinutes} minute(s).`,
        });
        return;
      }

      const passwordMatches = await comparePassword(password, user.passwordHash);

      if (!passwordMatches) {
        // Increment failed attempts and apply lockout if >= 5
        const newFailedCount = user.failedLoginAttempts + 1;
        let lockedUntil: Date | null = null;

        if (newFailedCount >= 5) {
          lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedCount,
            lockedUntil,
          },
        });

        res.status(401).json({
          error: 'Invalid username or password',
          remainingAttempts: Math.max(0, 5 - newFailedCount),
        });
        return;
      }
    }

    // Authentication successful: reset failed attempts & update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    resetLoginAttempts(ip);

    // Record login audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        username: user.username,
        action: 'USER_LOGIN',
        resource: 'Auth',
        resourceId: user.id,
        ipAddress: ip,
        details: { role: user.role },
      },
    });

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentId: user.departmentId,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department ? { id: user.department.id, name: user.department.name } : null,
        extension: user.extension
          ? {
              id: user.extension.id,
              extensionNumber: user.extension.extensionNumber,
              displayName: user.extension.displayName,
            }
          : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication service error', details: err.message });
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: {
          select: { id: true, name: true, code: true },
        },
        extension: {
          select: {
            id: true,
            extensionNumber: true,
            displayName: true,
            outboundClass: true,
            dnd: true,
            callWaiting: true,
          },
        },
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user profile', details: err.message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        username: req.user.username,
        action: 'USER_LOGOUT',
        resource: 'Auth',
        resourceId: req.user.id,
        ipAddress: ip,
      },
    });
  }
  res.json({ message: 'Logged out successfully' });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const matches = await comparePassword(currentPassword, user.passwordHash);
    if (!matches) {
      res.status(400).json({ error: 'Current password does not match' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password', details: err.message });
  }
}
