import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { checkAndAwardBadges } from '../utils/badges';

const router = Router();

// ─── CSR Activities CRUD ────────────────────────────────

// GET /api/social/activities
router.get('/activities', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const activities = await prisma.csrActivity.findMany({
      include: {
        category: true,
        department: true,
      },
      orderBy: { date: 'desc' }
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CSR activities' });
  }
});

// POST /api/social/activities (Admin, DeptHead)
router.post('/activities', requireAuth, requireRole('ADMIN', 'DEPT_HEAD'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, categoryId, description, date, departmentId } = req.body;
    if (!title || !categoryId || !description || !date || !departmentId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const activity = await prisma.csrActivity.create({
      data: {
        title,
        categoryId,
        description,
        date: new Date(date),
        departmentId
      }
    });
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create CSR activity' });
  }
});

// PUT /api/social/activities/:id
router.put('/activities/:id', requireAuth, requireRole('ADMIN', 'DEPT_HEAD'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, categoryId, description, date, departmentId } = req.body;
    const activity = await prisma.csrActivity.update({
      where: { id: req.params.id },
      data: {
        title,
        categoryId,
        description,
        ...(date && { date: new Date(date) }),
        departmentId
      }
    });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update CSR activity' });
  }
});

// DELETE /api/social/activities/:id
router.delete('/activities/:id', requireAuth, requireRole('ADMIN', 'DEPT_HEAD'), async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.csrActivity.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete CSR activity' });
  }
});

// ─── Employee Participation Flow ────────────────────────

// GET /api/social/activities/:id/participations
router.get('/activities/:id/participations', requireAuth, requireRole('ADMIN', 'DEPT_HEAD'), async (req: Request, res: Response): Promise<void> => {
  try {
    const participations = await prisma.employeeParticipation.findMany({
      where: { activityId: req.params.id },
      include: {
        employee: {
          select: { id: true, name: true, email: true, department: true }
        }
      }
    });
    res.json(participations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch participations' });
  }
});

// POST /api/social/activities/:id/participate
router.post('/activities/:id/participate', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { proofUrl } = req.body;
    const config = await prisma.eSGConfig.findFirst();
    
    // Check evidence enforcement
    if (config?.evidenceRequiredEnabled && !proofUrl) {
      res.status(400).json({ error: 'Proof URL is required' });
      return;
    }

    // Check if user already participated
    const existing = await prisma.employeeParticipation.findFirst({
      where: {
        employeeId: req.user!.id,
        activityId: req.params.id
      }
    });

    if (existing) {
      res.status(400).json({ error: 'Already applied for this activity' });
      return;
    }

    const participation = await prisma.employeeParticipation.create({
      data: {
        employeeId: req.user!.id,
        activityId: req.params.id,
        proofUrl,
        approvalStatus: 'PENDING'
      }
    });

    res.status(201).json(participation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply for participation' });
  }
});

// PUT /api/social/participations/:id/approve
router.put('/participations/:id/approve', requireAuth, requireRole('ADMIN', 'DEPT_HEAD'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, pointsEarned } = req.body; // 'APPROVED' or 'REJECTED'
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED.' });
      return;
    }

    const participation = await prisma.employeeParticipation.findUnique({
      where: { id: req.params.id }
    });

    if (!participation) {
      res.status(404).json({ error: 'Participation not found' });
      return;
    }

    if (participation.approvalStatus !== 'PENDING') {
      res.status(400).json({ error: 'Participation is already processed' });
      return;
    }

    const finalPoints = status === 'APPROVED' ? (pointsEarned || 10) : 0;

    const updated = await prisma.employeeParticipation.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: status,
        pointsEarned: finalPoints,
        completionDate: status === 'APPROVED' ? new Date() : null
      }
    });

    if (status === 'APPROVED') {
      // Award points & XP
      await prisma.employee.update({
        where: { id: participation.employeeId },
        data: {
          pointsBalance: { increment: finalPoints },
          xp: { increment: finalPoints }
        }
      });
      // Trigger badge auto-award evaluation
      await checkAndAwardBadges(participation.employeeId);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process participation approval' });
  }
});

// ─── Diversity Metrics ──────────────────────────────────

// GET /api/social/diversity
router.get('/diversity', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        employees: true
      }
    });

    const data = departments.map(dept => {
      const counts: Record<string, number> = { total: 0 };
      dept.employees.forEach(emp => {
        counts[emp.role] = (counts[emp.role] || 0) + 1;
        counts.total += 1;
      });
      return {
        department: dept.name,
        ...counts
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diversity metrics' });
  }
});

export default router;
