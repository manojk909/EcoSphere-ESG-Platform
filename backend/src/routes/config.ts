import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// ─── Validation Schemas ─────────────────────────────
const updateConfigSchema = z.object({
  envWeight: z
    .number({ invalid_type_error: 'Environmental weight must be a number.' })
    .min(0, 'Environmental weight must be at least 0.')
    .max(1, 'Environmental weight must be at most 1.')
    .optional(),
  socialWeight: z
    .number({ invalid_type_error: 'Social weight must be a number.' })
    .min(0, 'Social weight must be at least 0.')
    .max(1, 'Social weight must be at most 1.')
    .optional(),
  govWeight: z
    .number({ invalid_type_error: 'Governance weight must be a number.' })
    .min(0, 'Governance weight must be at least 0.')
    .max(1, 'Governance weight must be at most 1.')
    .optional(),
  autoEmissionCalcEnabled: z
    .boolean({ invalid_type_error: 'autoEmissionCalcEnabled must be a boolean.' })
    .optional(),
  evidenceRequiredEnabled: z
    .boolean({ invalid_type_error: 'evidenceRequiredEnabled must be a boolean.' })
    .optional(),
  badgeAutoAwardEnabled: z
    .boolean({ invalid_type_error: 'badgeAutoAwardEnabled must be a boolean.' })
    .optional(),
});

// ─── GET / — Get current ESG config ─────────────────
// If no config exists yet, create a default one automatically.
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    let config = await prisma.eSGConfig.findFirst();

    if (!config) {
      // No config row exists yet — create the default configuration.
      // This ensures the app always has a valid config without requiring manual setup.
      config = await prisma.eSGConfig.create({
        data: {
          envWeight: 0.4,
          socialWeight: 0.3,
          govWeight: 0.3,
          autoEmissionCalcEnabled: false,
          evidenceRequiredEnabled: true,
          badgeAutoAwardEnabled: true,
        },
      });
    }

    res.json({ config });
  } catch (err) {
    console.error('Get config error:', err);
    res.status(500).json({ error: 'Internal server error while fetching configuration.' });
  }
});

// ─── PUT / — Update ESG config (ADMIN only) ─────────
router.put('/', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const parsed = updateConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed.', details: errors });
      return;
    }

    const data = parsed.data;

    // Validate that weights sum to 1.0 if all three are provided
    // or if a subset is provided, combine with existing values to check
    let config = await prisma.eSGConfig.findFirst();
    if (!config) {
      // Create default first if none exists
      config = await prisma.eSGConfig.create({
        data: {
          envWeight: 0.4,
          socialWeight: 0.3,
          govWeight: 0.3,
          autoEmissionCalcEnabled: false,
          evidenceRequiredEnabled: true,
          badgeAutoAwardEnabled: true,
        },
      });
    }

    // Calculate resulting weights after the update
    const envW = data.envWeight !== undefined ? data.envWeight : Number(config.envWeight);
    const socW = data.socialWeight !== undefined ? data.socialWeight : Number(config.socialWeight);
    const govW = data.govWeight !== undefined ? data.govWeight : Number(config.govWeight);
    const weightSum = envW + socW + govW;

    // Allow a small floating-point tolerance (0.001)
    if (Math.abs(weightSum - 1.0) > 0.001) {
      res.status(400).json({
        error: 'Validation failed.',
        details: [{
          field: 'weights',
          message: `ESG weights must sum to 1.0. Current sum: ${weightSum.toFixed(3)}.`,
        }],
      });
      return;
    }

    const updated = await prisma.eSGConfig.update({
      where: { id: config.id },
      data: {
        ...(data.envWeight !== undefined && { envWeight: data.envWeight }),
        ...(data.socialWeight !== undefined && { socialWeight: data.socialWeight }),
        ...(data.govWeight !== undefined && { govWeight: data.govWeight }),
        ...(data.autoEmissionCalcEnabled !== undefined && { autoEmissionCalcEnabled: data.autoEmissionCalcEnabled }),
        ...(data.evidenceRequiredEnabled !== undefined && { evidenceRequiredEnabled: data.evidenceRequiredEnabled }),
        ...(data.badgeAutoAwardEnabled !== undefined && { badgeAutoAwardEnabled: data.badgeAutoAwardEnabled }),
      },
    });

    res.json({ config: updated });
  } catch (err) {
    console.error('Update config error:', err);
    res.status(500).json({ error: 'Internal server error while updating configuration.' });
  }
});

export default router;
