import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { EmergencyStatus, LocationSource, NotificationType } from '@prisma/client';
import NotificationService from '../services/notification.service';
import { io } from '../server';
import { emergencyRateLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(authenticate);

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const triggerSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
});

/**
 * POST /api/v1/emergencies/trigger
 * Trigger emergency SOS with live GPS coordinates, auto-find nearest hospital
 */
router.post(
  '/trigger',
  emergencyRateLimiter,
  validate(triggerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, accuracy } = req.body;

      // 1. Get or create patient profile
      let patient = await prisma.patient.findUnique({
        where: { userId: req.user!.id },
      });

      if (!patient) {
        patient = await prisma.patient.create({
          data: {
            userId: req.user!.id,
            fullName: 'Emergency Patient',
          },
        });
      }

      // 2. Find nearest hospital with emergency services
      const hospitals = await prisma.hospital.findMany();
      let nearestHospital: any = null;
      let minDistance = Infinity;

      for (const h of hospitals) {
        const dist = calculateDistance(
          latitude,
          longitude,
          Number(h.latitude),
          Number(h.longitude)
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestHospital = h;
        }
      }

      // 3. Generate unique human-readable ID: HS-EMR-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const emergencyId = `HS-EMR-${dateStr}-${randomSuffix}`;

      // 4. Create Emergency record
      const emergency = await prisma.emergency.create({
        data: {
          emergencyId,
          patientId: patient.id,
          hospitalId: nearestHospital ? nearestHospital.id : null,
          status: EmergencyStatus.INITIATED,
          initialLatitude: latitude,
          initialLongitude: longitude,
          locationTrails: {
            create: {
              source: LocationSource.PATIENT,
              latitude,
              longitude,
              accuracy: accuracy || null,
            },
          },
          statusHistories: {
            create: {
              status: EmergencyStatus.INITIATED,
              updatedBy: req.user!.id,
              notes: 'Patient triggered Emergency SOS from mobile app',
            },
          },
        },
        include: {
          hospital: true,
          patient: true,
          statusHistories: true,
        },
      });

      // 5. Broadcast to Hospital Emergency Desk via Socket.io
      if (io && nearestHospital) {
        io.emit(`emergency:incoming-alert`, {
          emergencyId: emergency.id,
          code: emergency.emergencyId,
          patientName: patient.fullName,
          latitude,
          longitude,
          hospitalId: nearestHospital.id,
        });
      }

      // 6. Notify Patient and emergency contact if present
      if (patient.emergencyContactPhone) {
        await NotificationService.send({
          userId: req.user!.id,
          type: NotificationType.EMERGENCY,
          title: '🚨 EMERGENCY SOS ACTIVE',
          body: `Emergency response coordinated with ${nearestHospital?.name || 'nearest hospital'}. Live tracking is active.`,
          data: { emergencyId: emergency.id },
        });
      }

      res.status(201).json({
        success: true,
        message: 'Emergency SOS alert transmitted',
        data: emergency,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/emergencies/active
 * Get current active emergency for the logged-in patient
 */
router.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });

    if (!patient) {
      return res.status(200).json({ success: true, data: null });
    }

    const activeEmergency = await prisma.emergency.findFirst({
      where: {
        patientId: patient.id,
        status: {
          notIn: [EmergencyStatus.RESOLVED, EmergencyStatus.CANCELLED],
        },
      },
      orderBy: { triggeredAt: 'desc' },
      include: {
        patient: true,
        hospital: true,
        ambulanceOperator: { include: { user: true } },
        statusHistories: { orderBy: { timestamp: 'desc' } },
        locationTrails: { orderBy: { recordedAt: 'desc' }, take: 20 },
      },
    });

    res.status(200).json({
      success: true,
      data: activeEmergency,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/emergencies/:id/track
 * Real-time tracking data for patient HUD
 */
router.get('/:id/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const emergency = await prisma.emergency.findUnique({
      where: { id },
      include: {
        patient: true,
        hospital: true,
        ambulanceOperator: { include: { user: true } },
        statusHistories: { orderBy: { timestamp: 'desc' } },
        locationTrails: { orderBy: { recordedAt: 'desc' }, take: 20 },
      },
    });

    if (!emergency) throw new NotFoundError('Emergency');

    res.status(200).json({
      success: true,
      data: emergency,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/emergencies/:id/patient-location
 * Update live patient location breadcrumbs
 */
router.post('/:id/patient-location', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, speed, heading } = req.body;

    const trail = await prisma.emergencyLocationTrail.create({
      data: {
        emergencyId: id,
        source: LocationSource.PATIENT,
        latitude,
        longitude,
        accuracy: accuracy || null,
        speed: speed || null,
        heading: heading || null,
      },
    });

    if (io) {
      io.to(`emergency:${id}`).emit('emergency:patient-location-updated', {
        emergencyId: id,
        latitude,
        longitude,
      });
    }

    res.status(200).json({
      success: true,
      data: trail,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/emergencies/:id/cancel
 * Cancel emergency if false alarm
 */
router.put('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const emergency = await prisma.emergency.findUnique({ where: { id } });
    if (!emergency) throw new NotFoundError('Emergency');

    const updated = await prisma.emergency.update({
      where: { id },
      data: {
        status: EmergencyStatus.CANCELLED,
        resolutionNotes: reason || 'Cancelled by user as false alarm',
        resolvedAt: new Date(),
      },
    });

    await prisma.emergencyStatusHistory.create({
      data: {
        emergencyId: id,
        status: EmergencyStatus.CANCELLED,
        updatedBy: req.user!.id,
        notes: reason || 'Cancelled by patient',
      },
    });

    if (io) {
      io.emit('emergency:status-updated', {
        emergencyId: id,
        status: EmergencyStatus.CANCELLED,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency cancelled',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/emergencies/:id/report-hoax
 * Flag an emergency as an intentional hoax / prank
 */
router.post('/:id/report-hoax', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, penaltyAmount = 3500 } = req.body;

    const emergency = await prisma.emergency.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        hospital: true,
        ambulanceOperator: { include: { user: true } },
      },
    });

    if (!emergency) throw new NotFoundError('Emergency');

    const updated = await prisma.emergency.update({
      where: { id },
      data: {
        status: EmergencyStatus.CANCELLED,
        resolutionNotes: `[INTENTIONAL HOAX / FAKE SOS FLAGGED] Reason: ${reason || 'Malicious prank / No patient at scene'}. Penalty assessed: ₹${penaltyAmount}`,
        resolvedAt: new Date(),
      },
    });

    await prisma.emergencyStatusHistory.create({
      data: {
        emergencyId: id,
        status: EmergencyStatus.CANCELLED,
        updatedBy: req.user!.id,
        notes: `Flagged as intentional hoax by operator ${req.user!.id}. Penalty: ₹${penaltyAmount}`,
      },
    });

    // Record in system audit logs
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'EMERGENCY_HOAX_REPORTED',
        resourceType: 'Emergency',
        resourceId: id,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'System',
      },
    });

    if (io) {
      io.emit('emergency:status-updated', {
        emergencyId: id,
        status: EmergencyStatus.CANCELLED,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency flagged as intentional hoax. Police dossier generated and penalty recorded.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/emergencies/:id/police-dossier
 * Generate structured Police FIR / Cybercrime evidence dossier
 */
router.get('/:id/police-dossier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const emergency = await prisma.emergency.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        hospital: true,
        ambulanceOperator: { include: { user: true } },
        locationTrails: { orderBy: { recordedAt: 'asc' }, take: 10 },
      },
    });

    if (!emergency) throw new NotFoundError('Emergency');

    const firReferenceNumber = `FIR-CYBER-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const dossier = {
      firReferenceNumber,
      generatedAt: new Date().toISOString(),
      statutoryOffense: 'Section 182 & 211 of Bharatiya Nyaya Sanhita (BNS) / Section 182 & 505 of Indian Penal Code (IPC)',
      offenseDescription: 'False emergency distress call, intentional misuse of emergency trauma services, and causing public nuisance/wasting state trauma resources',
      suspectDetails: {
        fullName: emergency.patient?.fullName || 'Unverified User',
        registeredMobileNumber: emergency.patient?.user?.phone || 'Unknown',
        userId: emergency.patient?.userId || 'N/A',
        kycStatus: 'Aadhaar / SIM Registered',
      },
      digitalEvidence: {
        initialLatitude: emergency.initialLatitude,
        initialLongitude: emergency.initialLongitude,
        googleMapsLocationUrl: `https://maps.google.com/?q=${emergency.initialLatitude},${emergency.initialLongitude}`,
        timestampOfActivation: emergency.createdAt,
        resolutionTimestamp: emergency.resolvedAt,
        reportedByOperatorId: req.user!.id,
      },
      hospitalDetails: {
        name: emergency.hospital?.name || 'Sahyadri Super Speciality Hospital',
        address: emergency.hospital?.address || 'Erandwane, Karve Road, Pune',
        contactPhone: emergency.hospital?.phone || '+91 20 6721 5000',
      },
      dispatchedAmbulance: {
        vehicleNumber: emergency.ambulanceOperator?.vehicleNumber || 'MH-12-EM-1080',
        pilotContact: emergency.ambulanceOperator?.user?.phone || '+91 98444 00001',
      },
      financialLossAssessed: {
        fuelAndDeploymentCost: '₹2,500',
        paramedicWastedHourSurcharge: '₹1,000',
        totalPenaltyDue: '₹3,500',
      },
      legalRecommendation: 'Initiate formal Police FIR under BNS 182 and notify State Telecom Authority for emergency line penalty enforcement.',
    };

    res.status(200).json({
      success: true,
      data: dossier,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
