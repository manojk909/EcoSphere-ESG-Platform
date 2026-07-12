import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// ─── Validation Schemas ─────────────────────────────
const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'DEPT_HEAD', 'EMPLOYEE'], {
    errorMap: () => ({ message: 'Role must be one of: ADMIN, DEPT_HEAD, or EMPLOYEE.' }),
  }),
});

// ─── GET / — List all employees ─────────────────────
// Supports filtering by departmentId, role, and status via query params.
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { departmentId, role, status } = req.query;

    // Build a dynamic filter object based on provided query parameters
    const where: Record<string, unknown> = {};

    if (departmentId && typeof departmentId === 'string') {
      where.departmentId = departmentId;
    }

    if (role && typeof role === 'string') {
      // Validate that the provided role is a valid enum value
      const validRoles = ['ADMIN', 'DEPT_HEAD', 'EMPLOYEE'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          error: 'Invalid role filter. Must be one of: ADMIN, DEPT_HEAD, EMPLOYEE.',
        });
        return;
      }
      where.role = role;
    }

    if (status && typeof status === 'string') {
      const validStatuses = ['ACTIVE', 'INACTIVE'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          error: 'Invalid status filter. Must be one of: ACTIVE, INACTIVE.',
        });
        return;
      }
      where.status = status;
    }

    const employees = await prisma.employee.findMany({
      where,
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
      },
      orderBy: { name: 'asc' },
    });

    res.json({ employees });
  } catch (err) {
    console.error('List employees error:', err);
    res.status(500).json({ error: 'Internal server error while listing employees.' });
  }
});

// ─── GET /:id — Get single employee ─────────────────
// Returns employee details including department, badges, and XP.
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
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
        badges: {
          select: {
            id: true,
            badge: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true,
                unlockRuleType: true,
                unlockRuleValue: true,
              },
            },
            awardedAt: true,
          },
          orderBy: { awardedAt: 'desc' },
        },
        headOf: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    res.json({ employee });
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ error: 'Internal server error while fetching employee.' });
  }
});

// ─── PUT /:id/role — Update employee role (ADMIN only) ──
router.put('/:id/role', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate request body
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed.', details: errors });
      return;
    }

    const { role } = parsed.data;

    // Check that the employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        headOf: true,
      },
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    // Prevent admin from demoting themselves
    if (employee.id === req.user!.id && role !== 'ADMIN') {
      res.status(400).json({
        error: 'You cannot change your own role. Another admin must do this.',
      });
      return;
    }

    // If demoting from DEPT_HEAD, remove them as department head first
    if (employee.role === 'DEPT_HEAD' && role !== 'DEPT_HEAD' && employee.headOf) {
      await prisma.department.update({
        where: { id: employee.headOf.id },
        data: { headId: null },
      });
    }

    // If promoting to DEPT_HEAD, validate they aren't already heading another department
    if (role === 'DEPT_HEAD' && employee.role !== 'DEPT_HEAD') {
      const existingHeadship = await prisma.department.findFirst({
        where: { headId: employee.id },
      });
      if (existingHeadship) {
        res.status(400).json({
          error: `Employee is already the head of department "${existingHeadship.name}".`,
        });
        return;
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { role },
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
      },
    });

    res.json({ employee: updated });
  } catch (err) {
    console.error('Update employee role error:', err);
    res.status(500).json({ error: 'Internal server error while updating employee role.' });
  }
});

export default router;
