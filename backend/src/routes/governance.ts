import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

// ─── ESG Policies ───────────────────────────────────────

// GET /api/governance/policies
router.get('/policies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policies = await prisma.eSGPolicy.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        acknowledgements: {
          where: { employeeId: req.user!.id }
        },
        _count: { select: { acknowledgements: true } }
      }
    });
    res.json(policies);
  } catch (error) {
    next(error);
  }
});

// POST /api/governance/policies (Admin only)
router.post('/policies', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      res.status(400).json({ error: 'title and body are required' });
      return;
    }
    const policy = await prisma.eSGPolicy.create({
      data: { title, body }
    });
    res.status(201).json(policy);
  } catch (error) {
    next(error);
  }
});

// PUT /api/governance/policies/:id (Admin only)
router.put('/policies/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body } = req.body;
    const existing = await prisma.eSGPolicy.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Policy not found' }); return; }

    const policy = await prisma.eSGPolicy.update({
      where: { id: req.params.id },
      data: {
        title: title || existing.title,
        body: body || existing.body,
        version: existing.version + 1
      }
    });
    res.json(policy);
  } catch (error) {
    next(error);
  }
});

// POST /api/governance/policies/:id/acknowledge
router.post('/policies/:id/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policyId = req.params.id;
    const employeeId = req.user!.id;

    // Check if already acknowledged
    const existing = await prisma.policyAcknowledgement.findUnique({
      where: { policyId_employeeId: { policyId, employeeId } }
    });
    if (existing) {
      res.status(400).json({ error: 'Already acknowledged this policy' });
      return;
    }

    const ack = await prisma.policyAcknowledgement.create({
      data: { policyId, employeeId }
    });
    res.status(201).json(ack);
  } catch (error) {
    next(error);
  }
});

// ─── Audits ─────────────────────────────────────────────

// GET /api/governance/audits
router.get('/audits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const audits = await prisma.audit.findMany({
      orderBy: { date: 'desc' },
      include: {
        department: { select: { name: true } },
        auditor: { select: { name: true, email: true } },
        _count: { select: { issues: true } }
      }
    });
    res.json(audits);
  } catch (error) {
    next(error);
  }
});

// POST /api/governance/audits (Admin, DeptHead)
router.post('/audits', requireRole('ADMIN', 'DEPT_HEAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scope, departmentId, date, auditorId } = req.body;
    if (!scope || !departmentId || !date || !auditorId) {
      res.status(400).json({ error: 'scope, departmentId, date, and auditorId are required' });
      return;
    }
    const audit = await prisma.audit.create({
      data: {
        scope,
        departmentId,
        date: new Date(date),
        auditorId
      },
      include: {
        department: { select: { name: true } },
        auditor: { select: { name: true } }
      }
    });
    res.status(201).json(audit);
  } catch (error) {
    next(error);
  }
});

// PUT /api/governance/audits/:id/status
router.put('/audits/:id/status', requireRole('ADMIN', 'DEPT_HEAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const audit = await prisma.audit.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(audit);
  } catch (error) {
    next(error);
  }
});

// ─── Compliance Issues ──────────────────────────────────

// GET /api/governance/issues
router.get('/issues', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issues = await prisma.complianceIssue.findMany({
      orderBy: { dueDate: 'asc' },
      include: {
        owner: { select: { name: true, email: true } },
        audit: { select: { scope: true, department: { select: { name: true } } } }
      }
    });
    
    const now = new Date();
    const issuesWithOverdue = issues.map(issue => ({
      ...issue,
      isOverdue: issue.dueDate < now && issue.status !== 'RESOLVED'
    }));
    
    res.json(issuesWithOverdue);
  } catch (error) {
    next(error);
  }
});

// POST /api/governance/issues (Admin, DeptHead)
router.post('/issues', requireRole('ADMIN', 'DEPT_HEAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auditId, severity, description, ownerId, dueDate } = req.body;
    if (!auditId || !severity || !description || !ownerId || !dueDate) {
      res.status(400).json({ error: 'auditId, severity, description, ownerId, and dueDate are required' });
      return;
    }
    const issue = await prisma.complianceIssue.create({
      data: {
        auditId,
        severity,
        description,
        ownerId,
        dueDate: new Date(dueDate)
      },
      include: {
        owner: { select: { name: true } }
      }
    });
    res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
});

// PUT /api/governance/issues/:id/status
router.put('/issues/:id/status', requireRole('ADMIN', 'DEPT_HEAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    const issue = await prisma.complianceIssue.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

export default router;
