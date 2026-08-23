import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { NotFoundError, ConflictError } from '../utils/errors';
import { UserRole, AppointmentStatus, NotificationType } from '@prisma/client';
import NotificationService from '../services/notification.service';

const router = Router();
router.use(authenticate, authorize(UserRole.DOCTOR));

const consultationSchema = z.object({
  appointmentId: z.string().uuid(),
  symptoms: z.array(z.string()).default([]),
  diagnosis: z.string().optional(),
  observations: z.string().optional(),
  advice: z.string().optional(),
  followUpRecommended: z.boolean().default(false),
  followUpDate: z.string().optional().nullable(),
});

/**
 * POST /api/v1/consultations
 * Create or auto-save consultation record
 */
router.post(
  '/',
  validate(consultationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
      if (!doctor) throw new NotFoundError('Doctor');

      const {
        appointmentId,
        symptoms,
        diagnosis,
        observations,
        advice,
        followUpRecommended,
        followUpDate,
      } = req.body;

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment || appointment.doctorId !== doctor.id) {
        throw new NotFoundError('Appointment');
      }

      const consultation = await prisma.consultation.upsert({
        where: { appointmentId },
        update: {
          symptoms,
          diagnosis,
          observations,
          advice,
          followUpRecommended,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        },
        create: {
          appointmentId,
          doctorId: doctor.id,
          patientId: appointment.patientId,
          symptoms,
          diagnosis,
          observations,
          advice,
          followUpRecommended,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        },
        include: {
          prescriptions: {
            include: { items: true },
          },
        },
      });

      // Move appointment to IN_PROGRESS if currently BOOKED/CONFIRMED
      if (appointment.status === AppointmentStatus.BOOKED || appointment.status === AppointmentStatus.CONFIRMED) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: AppointmentStatus.IN_PROGRESS },
        });
      }

      res.status(200).json({
        success: true,
        message: 'Consultation saved',
        data: consultation,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/consultations/:id/finalize
 * Finalize consultation and mark appointment as COMPLETED
 */
router.put('/:id/finalize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) throw new NotFoundError('Doctor');

    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: { appointment: true, patient: true },
    });

    if (!consultation || consultation.doctorId !== doctor.id) {
      throw new NotFoundError('Consultation');
    }

    const updated = await prisma.consultation.update({
      where: { id },
      data: { isFinalized: true },
    });

    await prisma.appointment.update({
      where: { id: consultation.appointmentId },
      data: { status: AppointmentStatus.COMPLETED },
    });

    await NotificationService.send({
      userId: consultation.patient.userId,
      type: NotificationType.APPOINTMENT,
      title: 'Consultation Summary Ready',
      body: `Dr. ${doctor.fullName} has finalized your consultation notes and prescription.`,
      data: { consultationId: id },
    });

    res.status(200).json({
      success: true,
      message: 'Consultation completed and finalized',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
