import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

export async function recalculateScores(period: string) {
  // Get active config
  const config = await prisma.eSGConfig.findFirst();
  if (!config) throw new Error('ESGConfig not found');

  const envWeight = Number(config.envWeight);
  const socialWeight = Number(config.socialWeight);
  const govWeight = Number(config.govWeight);

  // Get active departments
  const departments = await prisma.department.findMany({
    where: { status: 'ACTIVE' },
    include: {
      employees: {
        where: { status: 'ACTIVE' }
      }
    }
  });

  const activePoliciesCount = await prisma.eSGPolicy.count({
    where: { status: 'ACTIVE' }
  });

  for (const dept of departments) {
    const activeEmployees = dept.employees;
    const activeEmpCount = activeEmployees.length;

    // --- Environmental Score ---
    // if department has >=1 active EnvironmentalGoal in period:
    //   envScore = AVG( clamp(currentValue / targetValue * 100, 0, 100) )
    // else: envScore = 50
    let envScore = 50;
    
    // For simplicity, we just look at ACTIVE goals regardless of period start/end in this demo,
    // or we could filter by period if it was an exact match.
    const envGoals = await prisma.environmentalGoal.findMany({
      where: { departmentId: dept.id, status: 'ACTIVE' }
    });

    if (envGoals.length > 0) {
      let totalGoalScore = 0;
      for (const goal of envGoals) {
        const current = Number(goal.currentValue);
        const target = Number(goal.targetValue);
        let pct = target > 0 ? (current / target) * 100 : 0;
        if (pct > 100) pct = 100;
        if (pct < 0) pct = 0;
        totalGoalScore += pct;
      }
      envScore = totalGoalScore / envGoals.length;
    }

    // --- Social Score ---
    let socialScore = 0;
    if (activeEmpCount > 0) {
      // CSR Rate: # employees in dept with >=1 APPROVED CsrActivity participation
      const csrParticipants = await prisma.employeeParticipation.groupBy({
        by: ['employeeId'],
        where: {
          employee: { departmentId: dept.id, status: 'ACTIVE' },
          approvalStatus: 'APPROVED'
        }
      });
      const csrRate = (csrParticipants.length / activeEmpCount) * 100;

      // Challenge Rate: # employees in dept with >=1 APPROVED ChallengeParticipation
      const challengeParticipants = await prisma.challengeParticipation.groupBy({
        by: ['employeeId'],
        where: {
          employee: { departmentId: dept.id, status: 'ACTIVE' },
          approvalStatus: 'APPROVED'
        }
      });
      const challengeRate = (challengeParticipants.length / activeEmpCount) * 100;

      socialScore = (0.6 * csrRate) + (0.4 * challengeRate);
    }

    // --- Governance Score ---
    let govScore = 0;
    if (activeEmpCount > 0) {
      // Acknowledgment Rate: # employees who acknowledged ALL currently-active policies
      let fullyAckedCount = 0;
      if (activePoliciesCount > 0) {
        const acks = await prisma.policyAcknowledgement.groupBy({
          by: ['employeeId'],
          where: {
            employee: { departmentId: dept.id, status: 'ACTIVE' },
            policy: { status: 'ACTIVE' }
          },
          _count: { policyId: true }
        });
        fullyAckedCount = acks.filter(a => a._count.policyId >= activePoliciesCount).length;
      } else {
        fullyAckedCount = activeEmpCount; // if no policies, everyone is compliant
      }
      const ackRate = (fullyAckedCount / activeEmpCount) * 100;

      // Open Penalty
      const openIssues = await prisma.complianceIssue.findMany({
        where: {
          owner: { departmentId: dept.id },
          status: 'OPEN'
        }
      });

      const severityWeight: Record<string, number> = { LOW: 5, MEDIUM: 10, HIGH: 20, CRITICAL: 40 };
      let openPenalty = 0;
      for (const issue of openIssues) {
        openPenalty += severityWeight[issue.severity] || 0;
      }
      if (openPenalty > 100) openPenalty = 100;
      if (openPenalty < 0) openPenalty = 0;

      let rawGov = (0.5 * ackRate) + (0.5 * (100 - openPenalty));
      if (rawGov > 100) rawGov = 100;
      if (rawGov < 0) rawGov = 0;
      govScore = rawGov;
    } else {
      govScore = 50; // default if no employees
    }

    // --- Department Total ---
    const totalScore = (envWeight * envScore) + (socialWeight * socialScore) + (govWeight * govScore);

    // Write to DB
    await prisma.departmentScore.upsert({
      where: {
        departmentId_period: {
          departmentId: dept.id,
          period: period
        }
      },
      update: {
        envScore,
        socialScore,
        govScore,
        totalScore,
        calculatedAt: new Date()
      },
      create: {
        departmentId: dept.id,
        period,
        envScore,
        socialScore,
        govScore,
        totalScore
      }
    });
  }

  // Calculate Organization Overall ESG Score
  const allScores = await prisma.departmentScore.findMany({
    where: { period }
  });

  const overallScore = allScores.length > 0 
    ? allScores.reduce((acc, curr) => acc + Number(curr.totalScore), 0) / allScores.length
    : 0;

  return {
    period,
    departmentsScored: departments.length,
    overallScore
  };
}
