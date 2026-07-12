import prisma from '../lib/prisma';

/**
 * checkAndAwardBadges — Evaluates all badge unlock rules against the employee's
 * current stats and awards any badges they have earned but not yet received.
 *
 * This function is called after events that could unlock badges:
 * - CSR activity approval
 * - Challenge completion
 * - XP changes
 *
 * @param employeeId - The UUID of the employee to check badges for.
 */
export async function checkAndAwardBadges(employeeId: string): Promise<void> {
  // First, check if badge auto-awarding is enabled in the global ESG config.
  // If disabled, skip all badge processing to respect the admin's configuration.
  const config = await prisma.eSGConfig.findFirst();
  if (!config || !config.badgeAutoAwardEnabled) {
    return;
  }

  // Fetch the employee's current stats needed for badge rule evaluation
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      xp: true,
    },
  });

  if (!employee) {
    return;
  }

  // Count the employee's approved CSR participations
  const csrApprovedCount = await prisma.employeeParticipation.count({
    where: {
      employeeId,
      approvalStatus: 'APPROVED',
    },
  });

  // Count the employee's approved challenge participations
  const challengeApprovedCount = await prisma.challengeParticipation.count({
    where: {
      employeeId,
      approvalStatus: 'APPROVED',
    },
  });

  // Fetch all defined badges
  const allBadges = await prisma.badge.findMany();

  // Fetch IDs of badges already awarded to this employee to avoid duplicates
  const existingBadges = await prisma.employeeBadge.findMany({
    where: { employeeId },
    select: { badgeId: true },
  });
  const awardedBadgeIds = new Set(existingBadges.map((eb) => eb.badgeId));

  // Evaluate each badge's unlock rule against the employee's stats
  for (const badge of allBadges) {
    // Skip if already awarded — each badge can only be earned once per employee
    if (awardedBadgeIds.has(badge.id)) {
      continue;
    }

    let isUnlocked = false;

    switch (badge.unlockRuleType) {
      case 'XP_THRESHOLD':
        // Badge unlocks when employee's XP reaches or exceeds the threshold
        isUnlocked = employee.xp >= badge.unlockRuleValue;
        break;

      case 'CSR_COUNT':
        // Badge unlocks when employee has enough approved CSR participations
        isUnlocked = csrApprovedCount >= badge.unlockRuleValue;
        break;

      case 'CHALLENGE_COUNT':
        // Badge unlocks when employee has enough approved challenge participations
        isUnlocked = challengeApprovedCount >= badge.unlockRuleValue;
        break;

      default:
        // Unknown rule type — skip to avoid awarding badges incorrectly
        break;
    }

    if (isUnlocked) {
      // Award the badge and notify the employee in a single transaction
      // to ensure data consistency — either both writes succeed or neither does
      await prisma.$transaction([
        prisma.employeeBadge.create({
          data: {
            employeeId,
            badgeId: badge.id,
          },
        }),
        prisma.notification.create({
          data: {
            employeeId,
            type: 'BADGE_AWARDED',
            message: `Congratulations! You've earned the "${badge.name}" badge: ${badge.description}`,
          },
        }),
      ]);
    }
  }
}
