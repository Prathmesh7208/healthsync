import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { NotFoundError, ConflictError } from '../utils/errors';
import { UserRole, DayOfWeek } from '@prisma/client';
import { io } from '../server';
import SlotService from '../services/slot.service';

const router = Router();
router.use(authenticate, authorize(UserRole.DOCTOR));

// Validation schemas
const scheduleSchema = z.object({
  hospitalId: z.string().uuid(),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string(), // "HH:mm"
  endTime: z.string(), // "HH:mm"
  slotDurationMinutes: z.number().min(5).max(120).default(15),
});

const breakSchema = z.object({
  hospitalId: z.string().uuid(),
  dayOfWeek: z.nativeEnum(DayOfWeek).optional().nullable(),
  specificDate: z.string().optional().nullable(), // "YYYY-MM-DD"
  startTime: z.string(),
  endTime: z.string(),
});

const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().max(2000).optional(),
  experienceYears: z.number().min(0).optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

/**
 * GET /api/v1/doctors/me/profile
 */
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
      include: {
        affiliations: {
          include: { hospital: true },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundError('Doctor profile');
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/doctors/me/profile
 */
router.put(
  '/profile',
  validate(profileUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user!.id },
      });

      if (!doctor) {
        throw new NotFoundError('Doctor profile');
      }

      const updated = await prisma.doctor.update({
        where: { id: doctor.id },
        data: req.body,
      });

      res.status(200).json({
        success: true,
        message: 'Doctor profile updated',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/doctors/me/availability
 */
router.put('/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isAvailable } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!doctor) {
      throw new NotFoundError('Doctor profile');
    }

    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data: { isAvailable: !!isAvailable },
    });

    // Broadcast doctor availability update
    if (io) {
      io.emit('doctor:availability-changed', {
        doctorId: doctor.id,
        isAvailable: updated.isAvailable,
      });
    }

    res.status(200).json({
      success: true,
      data: { isAvailable: updated.isAvailable },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/doctors/me/schedules
 */
router.get('/schedules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!doctor) {
      throw new NotFoundError('Doctor profile');
    }

    const [schedules, breaks] = await Promise.all([
      prisma.doctorSchedule.findMany({
        where: { doctorId: doctor.id },
        include: { hospital: true },
        orderBy: { dayOfWeek: 'asc' },
      }),
      prisma.doctorBreak.findMany({
        where: { doctorId: doctor.id },
        include: { hospital: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: { schedules, breaks },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/doctors/me/schedules
 */
router.post(
  '/schedules',
  validate(scheduleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user!.id },
      });

      if (!doctor) {
        throw new NotFoundError('Doctor profile');
      }

      const { hospitalId, dayOfWeek, startTime, endTime, slotDurationMinutes } = req.body;

      // Validate time order
      const startMins = SlotService.timeToMinutes(startTime);
      const endMins = SlotService.timeToMinutes(endTime);

      if (startMins >= endMins) {
        throw new ConflictError('End time must be after start time', 'INVALID_TIME_RANGE');
      }

      // Check overlap for same day across all locations
      const existing = await prisma.doctorSchedule.findMany({
        where: {
          doctorId: doctor.id,
          dayOfWeek,
          isActive: true,
        },
      });

      const hasOverlap = existing.some((sched) => {
        const sMins = SlotService.timeToMinutes(sched.startTime);
        const eMins = SlotService.timeToMinutes(sched.endTime);
        return startMins < eMins && endMins > sMins;
      });

      if (hasOverlap) {
        throw new ConflictError(
          'Working hours overlap with an existing schedule for this day',
          'SCHEDULE_OVERLAP'
        );
      }

      const schedule = await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,
          hospitalId,
          dayOfWeek,
          startTime,
          endTime,
          slotDurationMinutes,
        },
        include: { hospital: true },
      });

      res.status(201).json({
        success: true,
        message: 'Schedule created',
        data: schedule,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/doctors/me/schedules/:id
 */
router.delete('/schedules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });

    if (!doctor) throw new NotFoundError('Doctor');

    const schedule = await prisma.doctorSchedule.findUnique({ where: { id } });
    if (!schedule || schedule.doctorId !== doctor.id) {
      throw new NotFoundError('Schedule');
    }

    await prisma.doctorSchedule.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Schedule deleted',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/doctors/me/breaks
 */
router.post(
  '/breaks',
  validate(breakSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
      if (!doctor) throw new NotFoundError('Doctor');

      const { hospitalId, dayOfWeek, specificDate, startTime, endTime } = req.body;

      const breakPeriod = await prisma.doctorBreak.create({
        data: {
          doctorId: doctor.id,
          hospitalId,
          dayOfWeek: dayOfWeek || null,
          specificDate: specificDate ? new Date(specificDate) : null,
          startTime,
          endTime,
        },
        include: { hospital: true },
      });

      res.status(201).json({
        success: true,
        message: 'Break period added',
        data: breakPeriod,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/doctors/me/breaks/:id
 */
router.delete('/breaks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) throw new NotFoundError('Doctor');

    const breakItem = await prisma.doctorBreak.findUnique({ where: { id } });
    if (!breakItem || breakItem.doctorId !== doctor.id) {
      throw new NotFoundError('Break period');
    }

    await prisma.doctorBreak.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Break period deleted',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
