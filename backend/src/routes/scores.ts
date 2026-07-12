import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { recalculateScores } from '../utils/scoring';
import prisma from '../lib/prisma';

const router = Router();
router.use(requireAuth);

// Recalculate scores for a specific period
router.post('/recalculate', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = req.body;
    if (!period) {
      res.status(400).json({ error: 'period is required (e.g., "2026-Q3")' });
      return;
    }
    
    const result = await recalculateScores(period);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get scores for a period
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = req.query;
    if (!period) {
      res.status(400).json({ error: 'period query parameter is required' });
      return;
    }

    const scores = await prisma.departmentScore.findMany({
      where: { period: String(period) },
      include: { department: { select: { name: true, code: true } } }
    });
    
    res.json(scores);
  } catch (error) {
    next(error);
  }
});

export default router;
