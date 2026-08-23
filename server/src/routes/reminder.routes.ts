import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { NotFoundError, AuthorizationError } from '../utils/errors';

const router = Router();
router.use(authenticate);

const reminderSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().default('Daily'),
  times: z.array(z.string()).min(1, 'At least one scheduled time required'), // ["09:00", "21:00"]
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
});

/**
 * GET /api/v1/patients/me/reminders
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const reminders = await prisma.medicineReminder.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: reminders,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/patients/me/reminders
 */
router.post(
  '/',
  validate(reminderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user!.id },
      });

      if (!patient) {
        throw new NotFoundError('Patient profile');
      }

      const { medicineName, dosage, frequency, times, startDate, endDate, instructions } =
        req.body;

      const reminder = await prisma.medicineReminder.create({
        data: {
          patientId: patient.id,
          medicineName,
          dosage,
          frequency,
          times,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          instructions,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Medicine reminder added',
        data: reminder,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/patients/me/reminders/:id
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const reminder = await prisma.medicineReminder.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!reminder) {
      throw new NotFoundError('Reminder');
    }

    if (reminder.patient.userId !== req.user!.id) {
      throw new AuthorizationError('Not authorized');
    }

    const updated = await prisma.medicineReminder.update({
      where: { id },
      data: { isActive: typeof isActive === 'boolean' ? isActive : reminder.isActive },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/patients/me/reminders/:id
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.medicineReminder.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!reminder) {
      throw new NotFoundError('Reminder');
    }

    if (reminder.patient.userId !== req.user!.id) {
      throw new AuthorizationError('Not authorized');
    }

    await prisma.medicineReminder.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Reminder deleted',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
