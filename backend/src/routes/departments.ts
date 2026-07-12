import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// ─── Validation Schemas ─────────────────────────────
const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: 'Department name is required.' })
    .min(1, 'Department name cannot be empty.')
    .max(100, 'Department name must be at most 100 characters.'),
  code: z
    .string({ required_error: 'Department code is required.' })
    .min(1, 'Department code cannot be empty.')
    .max(20, 'Department code must be at most 20 characters.')
    .regex(/^[A-Z0-9_]+$/, 'Department code must contain only uppercase letters, numbers, and underscores.'),
  parentId: z
    .string()
    .uuid('Parent department ID must be a valid UUID.')
    .optional()
    .nullable(),
});

const updateDepartmentSchema = z.object({
  name: z
    .string()
    .min(1, 'Department name cannot be empty.')
    .max(100, 'Department name must be at most 100 characters.')
    .optional(),
  code: z
    .string()
    .min(1, 'Department code cannot be empty.')
    .max(20, 'Department code must be at most 20 characters.')
    .regex(/^[A-Z0-9_]+$/, 'Department code must contain only uppercase letters, numbers, and underscores.')
    .optional(),
  parentId: z
    .string()
    .uuid('Parent department ID must be a valid UUID.')
    .optional()
    .nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Status must be either ACTIVE or INACTIVE.' }),
  }).optional(),
});

const assignHeadSchema = z.object({
  employeeId: z
    .string({ required_error: 'Employee ID is required.' })
    .uuid('Employee ID must be a valid UUID.'),
});

// ─── GET / — List all departments ───────────────────
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ departments });
  } catch (err) {
    console.error('List departments error:', err);
    res.status(500).json({ error: 'Internal server error while listing departments.' });
  }
});

// ─── GET /:id — Get single department ───────────────
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true,
            employeeCount: true,
            status: true,
          },
        },
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!department) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    res.json({ department });
  } catch (err) {
    console.error('Get department error:', err);
    res.status(500).json({ error: 'Internal server error while fetching department.' });
  }
});

// ─── POST / — Create department (ADMIN only) ────────
router.post('/', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const parsed = createDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed.', details: errors });
      return;
    }

    const { name, code, parentId } = parsed.data;

    // Check code uniqueness
    const existingCode = await prisma.department.findUnique({ where: { code } });
    if (existingCode) {
      res.status(409).json({
        error: 'Validation failed.',
        details: [{ field: 'code', message: 'A department with this code already exists.' }],
      });
      return;
    }

    // If parentId is provided, verify the parent department exists
    if (parentId) {
      const parentDept = await prisma.department.findUnique({ where: { id: parentId } });
      if (!parentDept) {
        res.status(400).json({
          error: 'Validation failed.',
          details: [{ field: 'parentId', message: 'Parent department does not exist.' }],
        });
        return;
      }
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        parentId: parentId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    res.status(201).json({ department });
  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ error: 'Internal server error while creating department.' });
  }
});

// ─── PUT /:id — Update department (ADMIN only) ──────
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check department exists
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    const parsed = updateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed.', details: errors });
      return;
    }

    const { name, code, parentId, status } = parsed.data;

    // If code is being changed, ensure the new code doesn't conflict
    if (code && code !== existing.code) {
      const codeConflict = await prisma.department.findUnique({ where: { code } });
      if (codeConflict) {
        res.status(409).json({
          error: 'Validation failed.',
          details: [{ field: 'code', message: 'A department with this code already exists.' }],
        });
        return;
      }
    }

    // Prevent self-referencing parent (a department can't be its own parent)
    if (parentId === id) {
      res.status(400).json({
        error: 'Validation failed.',
        details: [{ field: 'parentId', message: 'A department cannot be its own parent.' }],
      });
      return;
    }

    // If parentId is provided, verify the parent department exists
    if (parentId) {
      const parentDept = await prisma.department.findUnique({ where: { id: parentId } });
      if (!parentDept) {
        res.status(400).json({
          error: 'Validation failed.',
          details: [{ field: 'parentId', message: 'Parent department does not exist.' }],
        });
        return;
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(status !== undefined && { status }),
      },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    res.json({ department });
  } catch (err) {
    console.error('Update department error:', err);
    res.status(500).json({ error: 'Internal server error while updating department.' });
  }
});

// ─── PATCH /:id/head — Assign department head (ADMIN only) ──
router.patch('/:id/head', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify department exists
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    const parsed = assignHeadSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed.', details: errors });
      return;
    }

    const { employeeId } = parsed.data;

    // Verify the employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      res.status(404).json({
        error: 'Validation failed.',
        details: [{ field: 'employeeId', message: 'Employee not found.' }],
      });
      return;
    }

    // The employee must belong to the department they're being assigned to head
    if (employee.departmentId !== id) {
      res.status(400).json({
        error: 'Validation failed.',
        details: [{
          field: 'employeeId',
          message: 'Employee must belong to this department to be assigned as its head.',
        }],
      });
      return;
    }

    // Check if this employee is already head of another department
    const existingHeadship = await prisma.department.findFirst({
      where: { headId: employeeId, id: { not: id } },
    });
    if (existingHeadship) {
      res.status(400).json({
        error: 'Validation failed.',
        details: [{
          field: 'employeeId',
          message: `Employee is already the head of department "${existingHeadship.name}".`,
        }],
      });
      return;
    }

    // Update the department head and the employee's role to DEPT_HEAD
    const [updatedDepartment] = await prisma.$transaction([
      prisma.department.update({
        where: { id },
        data: { headId: employeeId },
        include: {
          head: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      // Promote the employee to DEPT_HEAD role
      prisma.employee.update({
        where: { id: employeeId },
        data: { role: 'DEPT_HEAD' },
      }),
    ]);

    res.json({ department: updatedDepartment });
  } catch (err) {
    console.error('Assign department head error:', err);
    res.status(500).json({ error: 'Internal server error while assigning department head.' });
  }
});

export default router;
