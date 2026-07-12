import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ─── Validation Schemas ─────────────────────────────
const signupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .min(1, 'Name cannot be empty.')
    .max(100, 'Name must be at most 100 characters.'),
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please provide a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password must be at most 128 characters long.'),
  departmentId: z
    .string({ required_error: 'Department ID is required.' })
    .uuid('Department ID must be a valid UUID.'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please provide a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password cannot be empty.'),
});

// ─── Helper: Generate JWT ───────────────────────────
function generateToken(user: { id: string; email: string; role: string; departmentId: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    },
    secret,
    { expiresIn: '24h' }
  );
}

// ─── POST /signup ───────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
  try {
    // Validate request body with Zod — returns specific field-level errors
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed.', details: errors });
      return;
    }

    const { name, email, password, departmentId } = parsed.data;

    // Check that the referenced department actually exists
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      res.status(400).json({
        error: 'Validation failed.',
        details: [{ field: 'departmentId', message: 'Department does not exist.' }],
      });
      return;
    }

    // Check email uniqueness before hashing the password (fail fast)
    const existingEmployee = await prisma.employee.findUnique({ where: { email } });
    if (existingEmployee) {
      res.status(409).json({
        error: 'Validation failed.',
        details: [{ field: 'email', message: 'An account with this email already exists.' }],
      });
      return;
    }

    // Hash password with bcrypt (10 salt rounds — good balance of security and speed)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the employee with default role EMPLOYEE
    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        passwordHash,
        departmentId,
        // role defaults to EMPLOYEE via Prisma schema
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        xp: true,
        pointsBalance: true,
        status: true,
        createdAt: true,
      },
    });

    // Increment the department's employee count
    await prisma.department.update({
      where: { id: departmentId },
      data: { employeeCount: { increment: 1 } },
    });

    const token = generateToken({
      id: employee.id,
      email: employee.email,
      role: employee.role,
      departmentId: employee.departmentId,
    });

    res.status(201).json({ token, user: employee });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during signup.' });
  }
});

// ─── POST /login ────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed.', details: errors });
      return;
    }

    const { email, password } = parsed.data;

    // Look up the employee by email
    const employee = await prisma.employee.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        departmentId: true,
        xp: true,
        pointsBalance: true,
        status: true,
        createdAt: true,
      },
    });

    if (!employee) {
      // Intentionally vague to prevent email enumeration
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Compare submitted password against stored bcrypt hash
    const passwordValid = await bcrypt.compare(password, employee.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Check if the account is active
    if (employee.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Your account is inactive. Please contact an administrator.' });
      return;
    }

    const token = generateToken({
      id: employee.id,
      email: employee.email,
      role: employee.role,
      departmentId: employee.departmentId,
    });

    // Strip passwordHash from the response
    const { passwordHash: _, ...userWithoutPassword } = employee;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// ─── GET /me ────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        xp: true,
        pointsBalance: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      res.status(404).json({ error: 'User not found. Account may have been deleted.' });
      return;
    }

    res.json({ user: employee });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Internal server error while fetching user profile.' });
  }
});

export default router;
