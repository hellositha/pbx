import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../utils/crypto';

const prisma = new PrismaClient();

// ----------------- Users -----------------

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        department: { select: { id: true, name: true, code: true } },
        extension: { select: { id: true, extensionNumber: true, displayName: true } },
      },
      orderBy: { username: 'asc' },
    });
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve users', details: err.message });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { username, email, password, firstName, lastName, role, departmentId } = req.body;

  if (!username || !email || !password || !firstName || !lastName) {
    res.status(400).json({ error: 'Username, email, password, first name and last name are required' });
    return;
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    res.status(400).json({ error: 'Username or email already in use' });
    return;
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || Role.STANDARD_USER,
        departmentId: departmentId || null,
      },
      include: { department: true },
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { email, firstName, lastName, role, departmentId, isActive, password } = req.body;

  try {
    const data: any = {
      email,
      firstName,
      lastName,
      role,
      departmentId: departmentId !== undefined ? departmentId : undefined,
      isActive: isActive !== undefined ? !!isActive : undefined,
    };

    if (password && password.length >= 8) {
      data.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { department: true },
    });

    res.json({
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        isActive: updated.isActive,
        department: updated.department,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    // Prevent self-deletion
    if (req.user && req.user.id === id) {
      res.status(400).json({ error: 'Cannot delete your own user account' });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
}

// ----------------- Departments -----------------

export async function getDepartments(req: Request, res: Response): Promise<void> {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true, extensions: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ departments });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve departments', details: err.message });
  }
}

export async function createDepartment(req: Request, res: Response): Promise<void> {
  const { name, code, description } = req.body;

  if (!name || !code) {
    res.status(400).json({ error: 'Department name and code are required' });
    return;
  }

  try {
    const dept = await prisma.department.create({
      data: { name, code: code.toUpperCase(), description },
    });
    res.status(201).json({ department: dept });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create department', details: err.message });
  }
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete department', details: err.message });
  }
}
