import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { UserRole, AmbulanceStatus, EmergencyStatus, LocationSource, NotificationType } from '@prisma/client';
import NotificationService from '../services/notification.service';
import { io } from '../server';

const router = Router();
router.use(authenticate, authorize(UserRole.AMBULANCE_OPERATOR));

// Schemas
const statusUpdateSchema = z.object({
  status: z.nativeEnum(AmbulanceStatus),
});

const emergencyStatusSchema = z.object({
  status: z.nativeEnum(EmergencyStatus),
  notes: z.string().optional(),
});

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional().nullable(),
  heading: z.number().optional().nullable(),
  emergencyId: z.string().uuid().optional().nullable(),
});

/**
 * GET /api/v1/ambulance/me
 * Profile, vehicle info, current status, active emergency
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let operator = await prisma.ambulanceOperator.findUnique({
      where: { userId: req.user!.id },
      include: { user: true },
    });

    if (!operator) {
      operator = await prisma.ambulanceOperator.create({
        data: {
          userId: req.user!.id,
          vehicleNumber: 'MH-12-AM-9999',
          currentStatus: AmbulanceStatus.AVAILABLE,
          latitude: 18.5204,
          longitude: 73.8567,
        },
        include: { user: true },
      });
    }

    // Check if there is an active emergency assigned to this operator
    const activeEmergency = await prisma.emergency.findFirst({
      where: {
        ambulanceOperatorId: operator.id,
        status: {
          in: [
            EmergencyStatus.AMBULANCE_ASSIGNED,
            EmergencyStatus.AMBULANCE_EN_ROUTE,
            EmergencyStatus.ARRIVED_AT_PATIENT,
            EmergencyStatus.PATIENT_PICKED_UP,
            EmergencyStatus.EN_ROUTE_TO_HOSPITAL,
            EmergencyStatus.ARRIVED_AT_HOSPITAL,
          ],
        },
      },
      include: {
        patient: true,
        hospital: true,
        statusHistories: { orderBy: { timestamp: 'desc' } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        operator,
        activeEmergency,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/ambulance/me/status
 * Toggle Duty Status (AVAILABLE vs UNAVAILABLE)
 */
router.put(
  '/me/status',
  validate(statusUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const operator = await prisma.ambulanceOperator.findUnique({
        where: { userId: req.user!.id },
      });

      if (!operator) throw new NotFoundError('Ambulance operator');

      const updated = await prisma.ambulanceOperator.update({
        where: { id: operator.id },
        data: { currentStatus: status },
      });

      if (io) {
        io.emit('ambulance:status-changed', {
          operatorId: operator.id,
          vehicleNumber: operator.vehicleNumber,
          status: updated.currentStatus,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Duty status updated',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/ambulance/me/location
 * Broadcast live GPS coordinates to hospital and patient rooms
 */
router.post(
  '/me/location',
  validate(locationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, speed, heading, emergencyId } = req.body;

      const operator = await prisma.ambulanceOperator.findUnique({
        where: { userId: req.user!.id },
      });

      if (!operator) throw new NotFoundError('Ambulance operator');

      // Update operator location
      await prisma.ambulanceOperator.update({
        where: { id: operator.id },
        data: {
          latitude,
          longitude,
        },
      });

      // If active emergency, record location trail
      if (emergencyId) {
        await prisma.emergencyLocationTrail.create({
          data: {
            emergencyId,
            source: LocationSource.AMBULANCE,
            latitude,
            longitude,
            speed: speed || null,
            heading: heading || null,
          },
        });

        // Broadcast to emergency room
        if (io) {
          io.to(`emergency:${emergencyId}`).emit('emergency:location-updated', {
            emergencyId,
            latitude,
            longitude,
            speed,
            heading,
            vehicleNumber: operator.vehicleNumber,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Location recorded and broadcast',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/ambulance/emergencies/:id
 * Full emergency details for active navigation view
 */
router.get('/emergencies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const emergency = await prisma.emergency.findUnique({
      where: { id },
      include: {
        patient: true,
        hospital: true,
        ambulanceOperator: { include: { user: true } },
        statusHistories: { orderBy: { timestamp: 'desc' } },
        locationTrails: { orderBy: { recordedAt: 'desc' }, take: 10 },
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
 * PUT /api/v1/ambulance/emergencies/:id/status
 * Advance emergency lifecycle
 */
router.put(
  '/emergencies/:id/status',
  validate(emergencyStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const operator = await prisma.ambulanceOperator.findUnique({
        where: { userId: req.user!.id },
      });
      if (!operator) throw new NotFoundError('Ambulance operator');

      const emergency = await prisma.emergency.findUnique({
        where: { id },
        include: { patient: true, hospital: true },
      });

      if (!emergency) throw new NotFoundError('Emergency');

      const updated = await prisma.emergency.update({
        where: { id },
        data: {
          status,
          resolvedAt: status === EmergencyStatus.RESOLVED ? new Date() : undefined,
        },
      });

      // Record history
      await prisma.emergencyStatusHistory.create({
        data: {
          emergencyId: id,
          status,
          updatedBy: req.user!.id,
          notes: notes || `Ambulance status progressed to ${status}`,
        },
      });

      // When resolved, set ambulance back to AVAILABLE
      if (status === EmergencyStatus.RESOLVED) {
        await prisma.ambulanceOperator.update({
          where: { id: operator.id },
          data: { currentStatus: AmbulanceStatus.AVAILABLE },
        });
      }

      // Notify Patient
      await NotificationService.send({
        userId: emergency.patient.userId,
        type: NotificationType.EMERGENCY,
        title: 'Ambulance Status Update',
        body: `Emergency status: ${status.replace(/_/g, ' ')}.`,
        data: { emergencyId: id, status },
      });

      // Broadcast via socket to hospital & patient
      if (io) {
        io.emit('emergency:status-updated', {
          emergencyId: id,
          status,
          vehicleNumber: operator.vehicleNumber,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Emergency status progressed',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/ambulance/me/history
 * List completed emergency runs
 */
router.get('/me/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const operator = await prisma.ambulanceOperator.findUnique({
      where: { userId: req.user!.id },
    });

    if (!operator) throw new NotFoundError('Ambulance operator');

    const history = await prisma.emergency.findMany({
      where: {
        ambulanceOperatorId: operator.id,
        status: { in: [EmergencyStatus.RESOLVED, EmergencyStatus.CANCELLED] },
      },
      include: {
        patient: true,
        hospital: true,
      },
      orderBy: { triggeredAt: 'desc' },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
