import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { ConflictError, NotFoundError, AuthorizationError } from '../utils/errors';
import { AppointmentStatus, SlotStatus, NotificationType } from '@prisma/client';
import NotificationService from '../services/notification.service';
import SlotService from '../services/slot.service';
import { io } from '../server';

const router = Router();
router.use(authenticate);

const createAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  startTime: z.string(), // HH:mm
  endTime: z.string(), // HH:mm
  reasonForVisit: z.string().max(500).optional(),
});

const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().optional(),
});

/**
 * POST /api/v1/appointments
 * Atomically reserve a slot and create appointment
 */
router.post(
  '/',
  validate(createAppointmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { doctorId, hospitalId, date, startTime, endTime, reasonForVisit } = req.body;
      const targetDate = new Date(date);
      const dateOnly = new Date(targetDate.toISOString().split('T')[0]);

      // Get patient record for this user
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user!.id },
      });

      if (!patient) {
        throw new NotFoundError('Patient profile');
      }

      // Check doctor and hospital
      const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });

      if (!doctor || !hospital) {
        throw new NotFoundError('Doctor or Hospital');
      }

      // Server-side slot availability verification
      const existingBooked = await prisma.appointment.findFirst({
        where: {
          doctorId,
          hospitalId,
          date: dateOnly,
          startTime,
          status: { in: ['BOOKED', 'CONFIRMED', 'IN_PROGRESS'] },
        },
      });

      if (existingBooked) {
        throw new ConflictError(
          'This consultation slot has just been reserved by another patient. Please select another slot.',
          'SLOT_UNAVAILABLE'
        );
      }

      // Upsert slot record to track optimistic version
      const slot = await prisma.slot.upsert({
        where: {
          doctorId_hospitalId_date_startTime: {
            doctorId,
            hospitalId,
            date: dateOnly,
            startTime,
          },
        },
        update: {
          status: SlotStatus.BOOKED,
          version: { increment: 1 },
        },
        create: {
          doctorId,
          hospitalId,
          date: dateOnly,
          startTime,
          endTime,
          status: SlotStatus.BOOKED,
          version: 1,
        },
      });

      // Generate human-readable appointment ID: HS-APT-YYYYMMDD-XXXX
      const dateStr = date.replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const humanReadableId = `HS-APT-${dateStr}-${randomSuffix}`;

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          appointmentId: humanReadableId,
          patientId: patient.id,
          doctorId,
          hospitalId,
          slotId: slot.id,
          date: dateOnly,
          startTime,
          endTime,
          status: AppointmentStatus.BOOKED,
          reasonForVisit,
        },
        include: {
          doctor: true,
          hospital: true,
          patient: true,
        },
      });

      // Broadcast slot booking via Socket.io so other viewing clients update immediately
      if (io) {
        io.emit(`slot:booked`, {
          doctorId,
          hospitalId,
          date,
          startTime,
        });
      }

      // Dispatch notifications
      await NotificationService.send({
        userId: req.user!.id,
        type: NotificationType.APPOINTMENT,
        title: 'Appointment Booked',
        body: `Your consultation with Dr. ${doctor.fullName} on ${date} at ${startTime} is confirmed.`,
        data: { appointmentId: appointment.id },
      });

      await NotificationService.send({
        userId: doctor.userId,
        type: NotificationType.APPOINTMENT,
        title: 'New Appointment Scheduled',
        body: `New appointment with ${patient.fullName || 'Patient'} on ${date} at ${startTime}.`,
        data: { appointmentId: appointment.id },
      });

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: appointment,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/patients/me/appointments
 */
router.get('/my', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const { type = 'upcoming' } = req.query as { type?: 'upcoming' | 'past' | 'all' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      patientId: patient.id,
    };

    if (type === 'upcoming') {
      where.date = { gte: today };
      where.status = { in: ['BOOKED', 'CONFIRMED', 'IN_PROGRESS'] };
    } else if (type === 'past') {
      where.OR = [
        { date: { lt: today } },
        { status: { in: ['COMPLETED', 'NO_SHOW', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR'] } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: true,
        hospital: true,
        consultation: {
          include: {
            prescriptions: {
              include: {
                items: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: type === 'past' ? 'desc' : 'asc',
      },
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
 * GET /api/v1/appointments/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: true,
        hospital: true,
        patient: true,
        consultation: {
          include: {
            prescriptions: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment');
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/appointments/:id/cancel
 */
router.put(
  '/:id/cancel',
  validate(cancelAppointmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { doctor: true, patient: true },
      });

      if (!appointment) {
        throw new NotFoundError('Appointment');
      }

      // Verify ownership
      if (appointment.patient.userId !== req.user!.id && appointment.doctor.userId !== req.user!.id) {
        throw new AuthorizationError('Not authorized to cancel this appointment');
      }

      const isPatient = appointment.patient.userId === req.user!.id;

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: isPatient
            ? AppointmentStatus.CANCELLED_BY_PATIENT
            : AppointmentStatus.CANCELLED_BY_DOCTOR,
          cancellationReason: cancellationReason || 'Cancelled by user',
        },
      });

      // Release slot
      await prisma.slot.update({
        where: { id: appointment.slotId },
        data: { status: SlotStatus.AVAILABLE },
      });

      // Broadcast slot release
      if (io) {
        io.emit('slot:released', {
          doctorId: appointment.doctorId,
          hospitalId: appointment.hospitalId,
          date: appointment.date.toISOString().split('T')[0],
          startTime: appointment.startTime,
        });
      }

      // Notify opposite party
      const targetUserId = isPatient ? appointment.doctor.userId : appointment.patient.userId;
      await NotificationService.send({
        userId: targetUserId,
        type: NotificationType.APPOINTMENT,
        title: 'Appointment Cancelled',
        body: `Appointment on ${appointment.date.toISOString().split('T')[0]} at ${appointment.startTime} has been cancelled.`,
        data: { appointmentId: appointment.id },
      });

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
