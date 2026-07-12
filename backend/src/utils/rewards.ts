import prisma from '../lib/prisma';

/**
 * redeemReward — Atomically processes a reward redemption with pessimistic row-level
 * locking to prevent race conditions in concurrent environments.
 *
 * WHY row locking? Multiple employees (or the same employee in multiple tabs) could
 * attempt to redeem the last unit of stock simultaneously. Without locking, both
 * transactions could read stock=1, both pass the check, and both decrement — resulting
 * in negative stock. The FOR UPDATE lock prevents this by serializing concurrent access
 * to the same reward and employee rows.
 *
 * @param employeeId - The UUID of the employee redeeming the reward.
 * @param rewardId   - The UUID of the reward being redeemed.
 * @returns The created RewardRedemption record.
 * @throws Error with descriptive message if validation fails.
 */
export async function redeemReward(employeeId: string, rewardId: string) {
  return prisma.$transaction(async (tx) => {
    // ─── Step 1: Lock the reward row with FOR UPDATE ──────────────
    // This acquires an exclusive row-level lock on the reward, preventing any
    // other transaction from reading or modifying this row until we commit.
    // WHY: Without this lock, two concurrent redemptions could both read
    // stock=1 and both succeed, leaving stock at -1.
    const [reward] = await tx.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        pointsRequired: number;
        stock: number;
        status: string;
      }>
    >(
      `SELECT id, name, "pointsRequired", stock, status FROM "Reward" WHERE id = $1 FOR UPDATE`,
      rewardId
    );

    if (!reward) {
      throw new Error('Reward not found.');
    }

    if (reward.status !== 'ACTIVE') {
      throw new Error('This reward is no longer available.');
    }

    // Check that there is stock remaining. The FOR UPDATE lock ensures
    // no other transaction can decrement stock between this read and our write.
    if (reward.stock <= 0) {
      throw new Error('This reward is out of stock.');
    }

    // ─── Step 2: Lock the employee row with FOR UPDATE ────────────
    // WHY: We also lock the employee row to prevent concurrent point deductions.
    // If an employee redeems two rewards simultaneously, both could read the same
    // pointsBalance and both pass the check, spending more points than available.
    const [employee] = await tx.$queryRawUnsafe<
      Array<{
        id: string;
        pointsBalance: number;
      }>
    >(
      `SELECT id, "pointsBalance" FROM "Employee" WHERE id = $1 FOR UPDATE`,
      employeeId
    );

    if (!employee) {
      throw new Error('Employee not found.');
    }

    // Verify the employee has enough points to cover the redemption cost.
    // The row lock guarantees this balance hasn't changed since we read it.
    if (employee.pointsBalance < reward.pointsRequired) {
      throw new Error(
        `Insufficient points. You have ${employee.pointsBalance} points but need ${reward.pointsRequired}.`
      );
    }

    // ─── Step 3: Execute all three writes atomically ──────────────
    // WHY all three in one transaction? If the stock decrement succeeds but
    // the points deduction fails, we'd have "phantom" stock reduction.
    // The transaction ensures all three writes succeed together or not at all.

    // Decrement reward stock by 1
    await tx.reward.update({
      where: { id: rewardId },
      data: { stock: { decrement: 1 } },
    });

    // Deduct points from the employee's balance
    await tx.employee.update({
      where: { id: employeeId },
      data: { pointsBalance: { decrement: reward.pointsRequired } },
    });

    // Create the redemption record as an audit trail
    const redemption = await tx.rewardRedemption.create({
      data: {
        employeeId,
        rewardId,
        pointsSpent: reward.pointsRequired,
      },
      include: {
        reward: {
          select: {
            id: true,
            name: true,
            description: true,
            pointsRequired: true,
          },
        },
      },
    });

    // Create a notification so the employee sees confirmation
    await tx.notification.create({
      data: {
        employeeId,
        type: 'REWARD_REDEEMED',
        message: `You successfully redeemed "${reward.name}" for ${reward.pointsRequired} points.`,
      },
    });

    return redemption;
  });
}
