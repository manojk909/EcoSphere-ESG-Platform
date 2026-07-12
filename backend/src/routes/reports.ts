import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
router.use(requireAuth);

// Dashboard data endpoint
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get latest period scores
    const latestScore = await prisma.departmentScore.findFirst({
      orderBy: { calculatedAt: 'desc' }
    });
    
    let scores = [];
    let overallESG = 0;
    
    if (latestScore) {
      scores = await prisma.departmentScore.findMany({
        where: { period: latestScore.period },
        include: { department: { select: { name: true } } }
      });
      overallESG = scores.length > 0 
        ? scores.reduce((sum, s) => sum + Number(s.totalScore), 0) / scores.length 
        : 0;
    }

    // Other metrics
    const activeChallenges = await prisma.challenge.count({ where: { status: 'ACTIVE' } });
    const openIssues = await prisma.complianceIssue.count({ where: { status: 'OPEN' } });
    
    const pendingCsr = await prisma.employeeParticipation.count({ where: { approvalStatus: 'PENDING' } });
    const pendingChallenge = await prisma.challengeParticipation.count({ where: { approvalStatus: 'PENDING' } });
    const pendingApprovals = pendingCsr + pendingChallenge;

    res.json({
      overallESG,
      scores,
      metrics: {
        activeChallenges,
        openIssues,
        pendingApprovals
      }
    });
  } catch (error) {
    next(error);
  }
});

// Custom Report Builder Endpoint
router.post('/custom', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, startDate, endDate, module } = req.body;
    let data: any = {};

    // In a real app, this would dynamically build queries based on the module requested.
    // For the hackathon, we'll return a simplified JSON structure that the frontend can convert to CSV.
    if (module === 'Environmental' || !module) {
      data.environmental = await prisma.carbonTransaction.findMany({
        where: {
          ...(departmentId ? { departmentId } : {}),
          ...(startDate && endDate ? { date: { gte: new Date(startDate), lte: new Date(endDate) } } : {})
        },
        include: { department: { select: { name: true } }, emissionFactor: { select: { activityType: true } } }
      });
    }
    
    if (module === 'Social' || !module) {
      data.social = await prisma.csrActivity.findMany({
        where: {
          ...(departmentId ? { departmentId } : {}),
          ...(startDate && endDate ? { date: { gte: new Date(startDate), lte: new Date(endDate) } } : {})
        },
        include: { department: { select: { name: true } } }
      });
    }

    if (module === 'Governance' || !module) {
      data.governance = await prisma.complianceIssue.findMany({
        where: {
          ...(startDate && endDate ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } } : {})
        },
        include: { owner: { select: { department: { select: { name: true } } } } }
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
