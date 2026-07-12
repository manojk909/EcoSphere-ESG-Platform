import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { ChallengeStatus, ApprovalStatus, Role } from '@prisma/client';

const router = Router();

// ==========================================
// BADGE AWARD LOGIC (Internal)
// ==========================================
async function checkAndAwardBadges(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      _count: {
        select: {
          challengeParticipations: { where: { approvalStatus: 'APPROVED' } },
          participations: { where: { approvalStatus: 'APPROVED' } }
        }
      }
    }
  });
  if (!employee) return;

  const badges = await prisma.badge.findMany();
  const existing = await prisma.employeeBadge.findMany({
    where: { employeeId },
    select: { badgeId: true }
  });
  const existingSet = new Set(existing.map((e) => e.badgeId));

  for (const badge of badges) {
    if (existingSet.has(badge.id)) continue;

    let earned = false;
    if (badge.unlockRuleType === 'XP_THRESHOLD' && employee.xp >= badge.unlockRuleValue) {
      earned = true;
    } else if (badge.unlockRuleType === 'CSR_COUNT' && employee._count.participations >= badge.unlockRuleValue) {
      earned = true;
    } else if (badge.unlockRuleType === 'CHALLENGE_COUNT' && employee._count.challengeParticipations >= badge.unlockRuleValue) {
      earned = true;
    }

    if (earned) {
      await prisma.employeeBadge.create({
        data: { employeeId, badgeId: badge.id }
      });
      await prisma.notification.create({
        data: {
          employeeId,
          type: 'BADGE_EARNED',
          message: `Congratulations! You've earned the "${badge.name}" badge.`
        }
      });
    }
  }
}

// ==========================================
// CHALLENGES CRUD
// ==========================================

router.get('/challenges', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter = status ? { status: status as ChallengeStatus } : {};
    const challenges = await prisma.challenge.findMany({
      where: filter,
      include: {
        category: true,
        participations: {
          where: { employeeId: req.user!.id } // Only fetch user's own participation
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

router.post('/challenges', requireAuth, requireRole(Role.ADMIN, Role.DEPT_HEAD), async (req: Request, res: Response) => {
  try {
    const { title, categoryId, description, xp, difficulty, evidenceRequired, deadline, status } = req.body;
    const challenge = await prisma.challenge.create({
      data: {
        title, categoryId, description, xp, difficulty, evidenceRequired, deadline, status: status || ChallengeStatus.DRAFT
      }
    });
    res.status(201).json(challenge);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create challenge' });
  }
});

router.put('/challenges/:id', requireAuth, requireRole(Role.ADMIN, Role.DEPT_HEAD), async (req: Request, res: Response) => {
  try {
    const challenge = await prisma.challenge.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(challenge);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update challenge' });
  }
});

router.delete('/challenges/:id', requireAuth, requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.challenge.delete({ where: { id: req.params.id } });
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete challenge' });
  }
});

// ==========================================
// CHALLENGE PARTICIPATION
// ==========================================

router.post('/challenges/:id/participate', requireAuth, async (req: Request, res: Response) => {
  try {
    const challengeId = req.params.id;
    const employeeId = req.user!.id;
    
    // Check if challenge is active
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.status !== ChallengeStatus.ACTIVE) {
      return res.status(400).json({ error: 'Can only participate in ACTIVE challenges' });
    }

    const existing = await prisma.challengeParticipation.findFirst({
      where: { challengeId, employeeId }
    });
    if (existing) return res.status(400).json({ error: 'Already participating' });

    const participation = await prisma.challengeParticipation.create({
      data: { challengeId, employeeId, approvalStatus: ApprovalStatus.PENDING }
    });
    res.status(201).json(participation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join challenge' });
  }
});

router.post('/challenges/:id/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const challengeId = req.params.id;
    const employeeId = req.user!.id;
    const { proofUrl } = req.body;

    const participation = await prisma.challengeParticipation.findFirst({
      where: { challengeId, employeeId }
    });
    if (!participation) return res.status(404).json({ error: 'Participation not found' });

    const updated = await prisma.challengeParticipation.update({
      where: { id: participation.id },
      data: { proofUrl, approvalStatus: ApprovalStatus.PENDING, progress: 100 }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit proof' });
  }
});

router.post('/challenges/participations/:id/approve', requireAuth, requireRole(Role.ADMIN, Role.DEPT_HEAD), async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // 'APPROVED' | 'REJECTED'
    if (status !== ApprovalStatus.APPROVED && status !== ApprovalStatus.REJECTED) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const participation = await prisma.challengeParticipation.findUnique({
      where: { id: req.params.id },
      include: { challenge: true }
    });
    if (!participation) return res.status(404).json({ error: 'Participation not found' });

    if (participation.approvalStatus === ApprovalStatus.APPROVED) {
      return res.status(400).json({ error: 'Already approved' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.challengeParticipation.update({
        where: { id: req.params.id },
        data: { 
          approvalStatus: status,
          xpAwarded: status === ApprovalStatus.APPROVED ? participation.challenge.xp : 0
        }
      });

      if (status === ApprovalStatus.APPROVED) {
        await tx.employee.update({
          where: { id: participation.employeeId },
          data: { 
            xp: { increment: participation.challenge.xp },
            pointsBalance: { increment: participation.challenge.xp } // let's give points = xp for rewards
          }
        });
      }
      return updated;
    });

    if (status === ApprovalStatus.APPROVED) {
      await checkAndAwardBadges(participation.employeeId);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve participation' });
  }
});

// ==========================================
// REWARDS CATALOG CRUD
// ==========================================

router.get('/rewards', requireAuth, async (req: Request, res: Response) => {
  try {
    const rewards = await prisma.reward.findMany({
      orderBy: { pointsRequired: 'asc' }
    });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

router.post('/rewards', requireAuth, requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const reward = await prisma.reward.create({
      data: req.body
    });
    res.status(201).json(reward);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create reward' });
  }
});

router.put('/rewards/:id', requireAuth, requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const reward = await prisma.reward.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(reward);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update reward' });
  }
});

router.delete('/rewards/:id', requireAuth, requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.reward.delete({ where: { id: req.params.id } });
    res.json({ message: 'Reward deleted' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete reward' });
  }
});

// ==========================================
// REWARD REDEMPTION API (Row-locking)
// ==========================================
router.post('/rewards/:id/redeem', requireAuth, async (req: Request, res: Response) => {
  try {
    const rewardId = req.params.id;
    const employeeId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the reward row
      const rewards = await tx.$queryRaw<any[]>`SELECT * FROM "Reward" WHERE id = ${rewardId} FOR UPDATE`;
      if (!rewards || rewards.length === 0) {
        throw new Error('Reward not found');
      }
      const reward = rewards[0];

      if (reward.status !== 'ACTIVE') throw new Error('Reward is not active');
      if (reward.stock <= 0) throw new Error('Reward is out of stock');

      // 2. Fetch user
      const user = await tx.employee.findUnique({ where: { id: employeeId } });
      if (!user) throw new Error('User not found');
      if (user.pointsBalance < reward.pointsRequired) throw new Error('Insufficient points');

      // 3. Update stock
      const updatedReward = await tx.reward.update({
        where: { id: rewardId },
        data: { stock: { decrement: 1 } }
      });

      // 4. Update user points
      await tx.employee.update({
        where: { id: employeeId },
        data: { pointsBalance: { decrement: reward.pointsRequired } }
      });

      // 5. Record redemption
      const redemption = await tx.rewardRedemption.create({
        data: {
          employeeId,
          rewardId,
          pointsSpent: reward.pointsRequired
        }
      });

      return { redemption, updatedReward };
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// LEADERBOARD API
// ==========================================
router.get('/leaderboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.query;
    const filter = departmentId ? { departmentId: String(departmentId) } : {};

    const users = await prisma.employee.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        xp: true,
        pointsBalance: true,
        department: { select: { id: true, name: true } },
        badges: {
          include: { badge: true }
        }
      },
      orderBy: { xp: 'desc' },
      take: 100
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ==========================================
// USER BADGES API
// ==========================================
router.get('/badges', requireAuth, async (req: Request, res: Response) => {
  try {
    const badges = await prisma.employeeBadge.findMany({
      where: { employeeId: req.user!.id },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' }
    });
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

export default router;
