import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// ==========================================
// Config
// ==========================================

router.get('/config', requireAuth, async (req, res) => {
  try {
    const config = await prisma.eSGConfig.findFirst();
    res.json(config || { autoEmissionCalcEnabled: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Zod Schemas
const EmissionFactorSchema = z.object({
  activityType: z.string().min(1, 'Activity type is required'),
  unit: z.string().min(1, 'Unit is required'),
  co2PerUnit: z.number().min(0, 'CO2 per unit must be non-negative'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const EnvironmentalGoalSchema = z.object({
  departmentId: z.string().uuid('Invalid department ID'),
  metricName: z.string().min(1, 'Metric name is required'),
  targetValue: z.number().min(0, 'Target value must be positive'),
  periodStart: z.string().datetime('Invalid start date'),
  periodEnd: z.string().datetime('Invalid end date'),
});

const CarbonTransactionSchema = z.object({
  sourceType: z.enum(['PURCHASE', 'MANUFACTURING', 'EXPENSE', 'FLEET']),
  sourceRefId: z.string().min(1, 'Source Reference ID is required'),
  emissionFactorId: z.string().uuid('Invalid Emission Factor ID'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  co2Calculated: z.number().min(0, 'Manual CO2 must be non-negative').optional(),
  date: z.string().datetime('Invalid date').optional(),
});

// ==========================================
// Emission Factors
// ==========================================

router.get('/emission-factors', requireAuth, async (req, res) => {
  try {
    const factors = await prisma.emissionFactor.findMany({
      orderBy: { activityType: 'asc' },
    });
    res.json(factors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emission factors' });
  }
});

router.post('/emission-factors', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = EmissionFactorSchema.parse(req.body);
    const factor = await prisma.emissionFactor.create({
      data: {
        ...data,
      },
    });
    res.status(201).json(factor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to create emission factor' });
  }
});

router.put('/emission-factors/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = EmissionFactorSchema.partial().parse(req.body);
    const factor = await prisma.emissionFactor.update({
      where: { id: req.params.id },
      data,
    });
    res.json(factor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to update emission factor' });
  }
});

router.delete('/emission-factors/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.emissionFactor.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete emission factor' });
  }
});

// ==========================================
// Carbon Transactions
// ==========================================

router.get('/carbon-transactions', requireAuth, async (req, res) => {
  try {
    // If DEPT_HEAD, show only their department's transactions, unless ADMIN
    let whereClause = {};
    if (req.user?.role === 'DEPT_HEAD') {
      whereClause = { departmentId: req.user.departmentId };
    } else if (req.user?.role === 'EMPLOYEE') {
      whereClause = { departmentId: req.user.departmentId };
    }

    const transactions = await prisma.carbonTransaction.findMany({
      where: whereClause,
      include: {
        emissionFactor: true,
        department: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch carbon transactions' });
  }
});

router.post('/carbon-transactions', requireAuth, async (req, res) => {
  try {
    const data = CarbonTransactionSchema.parse(req.body);

    const emissionFactor = await prisma.emissionFactor.findUnique({
      where: { id: data.emissionFactorId },
    });

    if (!emissionFactor) {
      return res.status(404).json({ error: 'Emission factor not found' });
    }

    const config = await prisma.eSGConfig.findFirst();
    const autoCalc = config?.autoEmissionCalcEnabled ?? false;

    let co2Calculated = 0;
    if (autoCalc) {
      co2Calculated = Number(emissionFactor.co2PerUnit) * data.quantity;
    } else {
      if (data.co2Calculated === undefined) {
        return res.status(400).json({ error: 'Manual CO2 calculation is required when auto-calculate is disabled' });
      }
      co2Calculated = data.co2Calculated;
    }

    const date = data.date ? new Date(data.date) : new Date();

    const transaction = await prisma.carbonTransaction.create({
      data: {
        sourceType: data.sourceType,
        sourceRefId: data.sourceRefId,
        emissionFactorId: data.emissionFactorId,
        quantity: data.quantity,
        co2Calculated,
        departmentId: req.user!.departmentId,
        date,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to create carbon transaction' });
  }
});

// ==========================================
// Environmental Goals
// ==========================================

router.get('/goals', requireAuth, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user?.role !== 'ADMIN') {
      whereClause = { departmentId: req.user?.departmentId };
    }

    const goals = await prisma.environmentalGoal.findMany({
      where: whereClause,
      include: { department: { select: { name: true } } },
      orderBy: { periodStart: 'desc' },
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/goals', requireAuth, requireRole('ADMIN', 'DEPT_HEAD'), async (req, res) => {
  try {
    const data = EnvironmentalGoalSchema.parse(req.body);
    
    // DEPT_HEAD can only create goals for their own department
    if (req.user?.role === 'DEPT_HEAD' && data.departmentId !== req.user.departmentId) {
      return res.status(403).json({ error: 'You can only create goals for your own department' });
    }

    const goal = await prisma.environmentalGoal.create({
      data: {
        ...data,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
      },
    });
    res.status(201).json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.put('/goals/:id', requireAuth, requireRole('ADMIN', 'DEPT_HEAD'), async (req, res) => {
  try {
    const data = EnvironmentalGoalSchema.partial().parse(req.body);
    
    const existing = await prisma.environmentalGoal.findUnique({ where: { id: req.params.id }});
    if (!existing) return res.status(404).json({ error: 'Goal not found' });
    
    if (req.user?.role === 'DEPT_HEAD' && existing.departmentId !== req.user.departmentId) {
      return res.status(403).json({ error: 'You can only update your own department goals' });
    }

    const goal = await prisma.environmentalGoal.update({
      where: { id: req.params.id },
      data: {
        ...data,
        periodStart: data.periodStart ? new Date(data.periodStart) : undefined,
        periodEnd: data.periodEnd ? new Date(data.periodEnd) : undefined,
      },
    });
    res.json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/goals/:id', requireAuth, requireRole('ADMIN', 'DEPT_HEAD'), async (req, res) => {
  try {
    const existing = await prisma.environmentalGoal.findUnique({ where: { id: req.params.id }});
    if (!existing) return res.status(404).json({ error: 'Goal not found' });
    
    if (req.user?.role === 'DEPT_HEAD' && existing.departmentId !== req.user.departmentId) {
      return res.status(403).json({ error: 'You can only delete your own department goals' });
    }

    await prisma.environmentalGoal.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// ==========================================
// Dashboard Stats
// ==========================================

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const deptFilter = req.user?.role === 'ADMIN' ? {} : { departmentId: req.user?.departmentId };
    
    const transactions = await prisma.carbonTransaction.findMany({
      where: deptFilter,
    });
    
    const totalCO2 = transactions.reduce((acc, t) => acc + Number(t.co2Calculated), 0);
    
    const bySource = transactions.reduce((acc, t) => {
      acc[t.sourceType] = (acc[t.sourceType] || 0) + Number(t.co2Calculated);
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalCO2,
      bySource,
      transactionCount: transactions.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
