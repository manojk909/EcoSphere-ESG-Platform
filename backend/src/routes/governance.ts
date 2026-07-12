import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation Schemas
const policySchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

const auditSchema = z.object({
  scope: z.string().min(1, "Scope is required"),
  department: z.string().min(1, "Department is required"),
  date: z.string().datetime({ message: "Invalid date format" }),
  auditor: z.string().min(1, "Auditor is required"),
});

const issueSchema = z.object({
  auditId: z.number({ required_error: "Audit ID is required" }),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  owner: z.string().min(1, "Owner is required"),
  dueDate: z.string().datetime({ message: "Invalid due date format" }),
});

// --- ESG Policies CRUD ---

router.post('/policies', async (req, res) => {
  try {
    const data = policySchema.parse(req.body);
    const policy = await prisma.policy.create({
      data: {
        ...data,
        version: 1,
      }
    });
    res.status(201).json(policy);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/policies', async (req, res) => {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

router.put('/policies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = policySchema.parse(req.body);
    
    const existing = await prisma.policy.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Policy not found' });

    const policy = await prisma.policy.update({
      where: { id: parseInt(id) },
      data: {
        ...data,
        version: existing.version + 1 // bump version on edit
      }
    });
    res.json(policy);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Policy Acknowledgement (Employee Action)
router.post('/policies/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body; 
    
    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const ack = await prisma.policyAcknowledgement.create({
      data: {
        policyId: parseInt(id),
        employeeId: employeeId
      }
    });
    res.status(201).json(ack);
  } catch (error) {
    res.status(500).json({ error: 'Failed to acknowledge policy' });
  }
});


// --- Audit CRUD ---

router.post('/audits', async (req, res) => {
  try {
    const data = auditSchema.parse(req.body);
    const audit = await prisma.audit.create({
      data: {
        ...data,
        date: new Date(data.date)
      }
    });
    res.status(201).json(audit);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/audits', async (req, res) => {
  try {
    const audits = await prisma.audit.findMany({
      include: { complianceIssues: true },
      orderBy: { date: 'desc' }
    });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});


// --- Compliance Issues CRUD ---

router.post('/issues', async (req, res) => {
  try {
    const data = issueSchema.parse(req.body);
    const issue = await prisma.complianceIssue.create({
      data: {
        ...data,
        dueDate: new Date(data.dueDate)
      }
    });
    res.status(201).json(issue);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read Issues and compute overdue flag
router.get('/issues', async (req, res) => {
  try {
    const issues = await prisma.complianceIssue.findMany({
      orderBy: { dueDate: 'asc' }
    });
    
    const now = new Date();
    const issuesWithOverdue = issues.map(issue => ({
      ...issue,
      isOverdue: issue.dueDate < now && issue.status !== 'RESOLVED'
    }));
    
    res.json(issuesWithOverdue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance issues' });
  }
});

export default router;
