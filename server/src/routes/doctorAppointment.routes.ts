import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { UserRole, AppointmentStatus, NotificationType } from '@prisma/client';
import NotificationService from '../services/notification.service';

const router = Router();
router.use(authenticate, authorize(UserRole.DOCTOR));

const updateStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  cancellationReason: z.string().optional(),
});

/**
 * GET /api/v1/doctors/me/appointments
 */
router.get('/appointments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!doctor) throw new NotFoundError('Doctor');

    const { date, status } = req.query as { date?: string; status?: string };

    const where: any = { doctorId: doctor.id };
    if (date) {
      where.date = new Date(date);
    }
    if (status && status !== 'ALL') {
      where.status = status as AppointmentStatus;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        hospital: true,
        consultation: {
          include: {
            prescriptions: {
              include: { items: true },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/doctors/me/appointments/:id/patient
 * Fetch patient context, allergies, and past visits with THIS doctor
 */
router.get('/appointments/:id/patient', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) throw new NotFoundError('Doctor');

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!appointment || appointment.doctorId !== doctor.id) {
      throw new NotFoundError('Appointment');
    }

    // Past visits with THIS doctor for privacy
    const pastVisits = await prisma.appointment.findMany({
      where: {
        patientId: appointment.patientId,
        doctorId: doctor.id,
        id: { not: appointment.id },
      },
      include: {
        consultation: {
          include: {
            prescriptions: { include: { items: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    res.status(200).json({
      success: true,
      data: {
        patient: appointment.patient,
        pastVisits,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/doctors/me/appointments/:id/status
 */
router.put(
  '/appointments/:id/status',
  validate(updateStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, cancellationReason } = req.body;

      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
      if (!doctor) throw new NotFoundError('Doctor');

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { patient: true },
      });

      if (!appointment || appointment.doctorId !== doctor.id) {
        throw new NotFoundError('Appointment');
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status,
          cancellationReason: cancellationReason || appointment.cancellationReason,
        },
      });

      // Send status update notification to patient
      await NotificationService.send({
        userId: appointment.patient.userId,
        type: NotificationType.APPOINTMENT,
        title: 'Appointment Status Update',
        body: `Your appointment with Dr. ${doctor.fullName} is now marked as ${status}.`,
        data: { appointmentId: appointment.id, status },
      });

      res.status(200).json({
        success: true,
        message: 'Status updated',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
