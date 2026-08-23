import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { NotFoundError, ConflictError } from '../utils/errors';
import {
  UserRole,
  AppointmentStatus,
  SlotStatus,
  EmergencyStatus,
  NotificationType,
  AmbulanceStatus,
} from '@prisma/client';
import NotificationService from '../services/notification.service';
import { io } from '../server';

const router = Router();
router.use(authenticate, authorize(UserRole.RECEPTIONIST));

// Validation schemas
const walkInSchema = z.object({
  fullName: z.string().min(2, 'Patient full name required'),
  phone: z.string().min(8, 'Phone number required'),
  doctorId: z.string().uuid('Doctor ID required'),
  reasonForVisit: z.string().optional(),
});

const assignAmbulanceSchema = z.object({
  ambulanceOperatorId: z.string().uuid('Ambulance operator ID required'),
});

/**
 * GET /api/v1/receptionist/me
 * Returns the receptionist's assigned hospital & user record
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receptionist = await prisma.receptionist.findUnique({
      where: { userId: req.user!.id },
      include: { hospital: true, user: true },
    });

    if (!receptionist) {
      // If none assigned in dev, find the first available hospital
      const defaultHospital = await prisma.hospital.findFirst();
      if (!defaultHospital) {
        throw new NotFoundError('Hospital affiliation');
      }
      return res.status(200).json({
        success: true,
        data: {
          id: 'temp-rec-id',
          userId: req.user!.id,
          hospitalId: defaultHospital.id,
          hospital: defaultHospital,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: receptionist,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/receptionist/hospitals/:hospitalId/appointments
 */
router.get(
  '/hospitals/:hospitalId/appointments',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hospitalId } = req.params;
      const { date, doctorId, status, search } = req.query as Record<string, string>;

      const where: any = { hospitalId };

      if (date) {
        where.date = new Date(date);
      }
      if (doctorId) {
        where.doctorId = doctorId;
      }
      if (status && status !== 'ALL') {
        where.status = status as AppointmentStatus;
      }
      if (search) {
        where.OR = [
          { appointmentId: { contains: search, mode: 'insensitive' } },
          { patient: { fullName: { contains: search, mode: 'insensitive' } } },
          { patient: { user: { phone: { contains: search } } } },
        ];
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          patient: { include: { user: true } },
          doctor: true,
          hospital: true,
        },
        orderBy: [{ startTime: 'asc' }],
      });

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/receptionist/appointments/:id/check-in
 * Check in patient, update timestamp, broadcast to doctor queue
 */
router.put('/appointments/:id/check-in', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment');
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        checkedInAt: new Date(),
        status:
          appointment.status === AppointmentStatus.BOOKED
            ? AppointmentStatus.CONFIRMED
            : appointment.status,
      },
      include: { patient: true, doctor: true },
    });

    // Broadcast patient check-in to doctor queue
    if (io) {
      io.emit(`queue:patient-checked-in`, {
        doctorId: appointment.doctorId,
        appointmentId: appointment.id,
        patientName: appointment.patient.fullName,
      });
    }

    // Notify doctor
    await NotificationService.send({
      userId: appointment.doctor.userId,
      type: NotificationType.APPOINTMENT,
      title: 'Patient Checked In',
      body: `${appointment.patient.fullName} has checked in at the hospital reception for their ${appointment.startTime} consultation.`,
      data: { appointmentId: appointment.id },
    });

    res.status(200).json({
      success: true,
      message: 'Patient checked in successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/receptionist/hospitals/:hospitalId/walk-in
 * Register a walk-in patient and add directly to doctor's queue
 */
router.post(
  '/hospitals/:hospitalId/walk-in',
  validate(walkInSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hospitalId } = req.params;
      const { fullName, phone, doctorId, reasonForVisit } = req.body;

      // 1. Find or create user & patient record
      let user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            role: UserRole.PATIENT,
            patient: { create: { fullName } },
          },
        });
      }

      let patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (!patient) {
        patient = await prisma.patient.create({
          data: { userId: user.id, fullName },
        });
      } else if (!patient.fullName) {
        patient = await prisma.patient.update({
          where: { id: patient.id },
          data: { fullName },
        });
      }

      // 2. Prepare slot & time for now
      const now = new Date();
      const dateOnly = new Date(now.toISOString().split('T')[0]);
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMins = now.getMinutes().toString().padStart(2, '0');
      const startTime = `${currentHours}:${currentMins}`;
      const endTime = `${(now.getHours() + 1).toString().padStart(2, '0')}:${currentMins}`;

      const slot = await prisma.slot.create({
        data: {
          doctorId,
          hospitalId,
          date: dateOnly,
          startTime,
          endTime,
          status: SlotStatus.BOOKED,
        },
      });

      // 3. Generate human readable ID
      const dateStr = dateOnly.toISOString().split('T')[0].replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const appointmentId = `HS-WLK-${dateStr}-${randomSuffix}`;

      // 4. Create appointment with immediate check-in
      const appointment = await prisma.appointment.create({
        data: {
          appointmentId,
          patientId: patient.id,
          doctorId,
          hospitalId,
          slotId: slot.id,
          date: dateOnly,
          startTime,
          endTime,
          status: AppointmentStatus.CONFIRMED,
          checkedInAt: now,
          reasonForVisit: reasonForVisit ? `[Walk-in] ${reasonForVisit}` : '[Walk-in Patient]',
        },
        include: {
          patient: true,
          doctor: true,
          hospital: true,
        },
      });

      // Broadcast to doctor queue
      if (io) {
        io.emit(`queue:patient-checked-in`, {
          doctorId,
          appointmentId: appointment.id,
          patientName: patient.fullName,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Walk-in patient registered and added to queue',
        data: appointment,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/receptionist/hospitals/:hospitalId/doctors
 * Hospital Doctor Availability Board
 */
router.get(
  '/hospitals/:hospitalId/doctors',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hospitalId } = req.params;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const affiliations = await prisma.doctorHospitalAffiliation.findMany({
        where: { hospitalId, isActive: true },
        include: {
          doctor: {
            include: {
              appointments: {
                where: {
                  hospitalId,
                  date: today,
                  status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
                },
                include: { patient: true },
              },
            },
          },
        },
      });

      const doctorBoard = affiliations.map((aff) => {
        const doc = aff.doctor;
        const currentConsultation = doc.appointments.find(
          (a) => a.status === AppointmentStatus.IN_PROGRESS
        );
        const waitingCount = doc.appointments.filter(
          (a) => a.status === AppointmentStatus.CONFIRMED
        ).length;

        let liveStatus = 'OFF_DUTY';
        if (doc.isAvailable) {
          if (currentConsultation) {
            liveStatus = 'IN_CONSULTATION';
          } else {
            liveStatus = 'AVAILABLE';
          }
        }

        return {
          id: doc.id,
          fullName: doc.fullName,
          profilePhotoUrl: doc.profilePhotoUrl,
          specializations: doc.specializations,
          consultationFee: Number(aff.consultationFee),
          isAvailable: doc.isAvailable,
          liveStatus, // AVAILABLE | IN_CONSULTATION | ON_BREAK | OFF_DUTY
          waitingCount,
          currentPatient: currentConsultation ? currentConsultation.patient.fullName : null,
        };
      });

      res.status(200).json({
        success: true,
        data: doctorBoard,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/receptionist/hospitals/:hospitalId/queue/:doctorId
 * Per-Doctor Live Queue Breakdown (Waiting, In Consultation, Completed)
 */
router.get(
  '/hospitals/:hospitalId/queue/:doctorId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hospitalId, doctorId } = req.params;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const appointments = await prisma.appointment.findMany({
        where: {
          hospitalId,
          doctorId,
          date: today,
        },
        include: { patient: true },
        orderBy: [{ startTime: 'asc' }],
      });

      const waiting = appointments.filter(
        (a) => a.checkedInAt && a.status === AppointmentStatus.CONFIRMED
      );
      const inConsultation = appointments.filter(
        (a) => a.status === AppointmentStatus.IN_PROGRESS
      );
      const completed = appointments.filter(
        (a) => a.status === AppointmentStatus.COMPLETED
      );
      const upcomingUnchecked = appointments.filter(
        (a) => !a.checkedInAt && a.status === AppointmentStatus.BOOKED
      );

      res.status(200).json({
        success: true,
        data: {
          doctorId,
          waiting,
          inConsultation,
          completed,
          upcomingUnchecked,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/receptionist/hospitals/:hospitalId/emergencies
 * List Active Emergencies
 */
router.get(
  '/hospitals/:hospitalId/emergencies',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hospitalId } = req.params;

      const emergencies = await prisma.emergency.findMany({
        where: {
          hospitalId,
          status: { notIn: [EmergencyStatus.RESOLVED, EmergencyStatus.CANCELLED, EmergencyStatus.FALSE_ALARM] },
        },
        include: {
          patient: true,
          ambulanceOperator: { include: { user: true } },
          locationTrails: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { triggeredAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: emergencies,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/receptionist/hospitals/:hospitalId/ambulances
 * List Ambulances
 */
router.get(
  '/hospitals/:hospitalId/ambulances',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const ambulances = await prisma.ambulanceOperator.findMany({
        include: { user: true },
      });

      res.status(200).json({
        success: true,
        data: ambulances,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/receptionist/emergencies/:id/acknowledge
 */
router.put('/emergencies/:id/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const updated = await prisma.emergency.update({
      where: { id },
      data: { status: EmergencyStatus.ACKNOWLEDGED },
      include: { patient: true },
    });

    await prisma.emergencyStatusHistory.create({
      data: {
        emergencyId: id,
        status: EmergencyStatus.ACKNOWLEDGED,
        updatedBy: req.user!.id,
        notes: 'Hospital emergency desk acknowledged alert',
      },
    });

    // Notify patient
    await NotificationService.send({
      userId: updated.patient.userId,
      type: NotificationType.EMERGENCY,
      title: 'Emergency Acknowledged',
      body: 'Hospital emergency response desk has received your SOS and is coordinating ambulance dispatch.',
      data: { emergencyId: id },
    });

    if (io) {
      io.emit(`emergency:status-updated`, { emergencyId: id, status: EmergencyStatus.ACKNOWLEDGED });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency acknowledged',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/receptionist/emergencies/:id/assign-ambulance
 */
router.put(
  '/emergencies/:id/assign-ambulance',
  validate(assignAmbulanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { ambulanceOperatorId } = req.body;

      const [updatedEmergency, ambulance] = await Promise.all([
        prisma.emergency.update({
          where: { id },
          data: {
            ambulanceOperatorId,
            status: EmergencyStatus.AMBULANCE_ASSIGNED,
          },
          include: { patient: true },
        }),
        prisma.ambulanceOperator.update({
          where: { id: ambulanceOperatorId },
          data: { currentStatus: AmbulanceStatus.ON_ASSIGNMENT },
          include: { user: true },
        }),
      ]);

      await prisma.emergencyStatusHistory.create({
        data: {
          emergencyId: id,
          status: EmergencyStatus.AMBULANCE_ASSIGNED,
          updatedBy: req.user!.id,
          notes: `Assigned ambulance vehicle ${ambulance.vehicleNumber}`,
        },
      });

      // Notify Ambulance Operator
      await NotificationService.send({
        userId: ambulance.userId,
        type: NotificationType.EMERGENCY,
        title: '🚨 EMERGENCY DISPATCH ASSIGNMENT',
        body: `Urgent emergency response assigned. Vehicle ${ambulance.vehicleNumber}. Tap to view route and coordinates.`,
        data: { emergencyId: id },
      });

      // Notify Patient
      await NotificationService.send({
        userId: updatedEmergency.patient.userId,
        type: NotificationType.EMERGENCY,
        title: 'Ambulance Assigned',
        body: `Ambulance vehicle ${ambulance.vehicleNumber} has been dispatched to your location.`,
        data: { emergencyId: id, vehicleNumber: ambulance.vehicleNumber },
      });

      if (io) {
        io.emit(`emergency:ambulance-assigned`, {
          emergencyId: id,
          vehicleNumber: ambulance.vehicleNumber,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Ambulance assigned successfully',
        data: { emergency: updatedEmergency, ambulance },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
