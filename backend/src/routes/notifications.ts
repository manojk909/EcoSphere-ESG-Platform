import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
router.use(requireAuth);

// Get my notifications
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { employeeId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Mark as read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Ensure it belongs to the user
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.employeeId !== req.user!.id) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/mark-all-read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { employeeId: req.user!.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
