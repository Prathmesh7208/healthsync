import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { UserRole, Gender, BloodGroup } from '@prisma/client';

const router = Router();

// Setup Multer Storage for file uploads (local uploads directory)
const uploadsDir = path.resolve(__dirname, '../../../uploads/photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are supported'));
    }
  },
});

// Update Profile Validation Schema
const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  bloodGroup: z.nativeEnum(BloodGroup).optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pinCode: z.string().optional().nullable(),
  knownAllergies: z.string().optional().nullable(),
  existingConditions: z.array(z.string()).optional().nullable(),
});

// All patient routes require authentication and PATIENT role
router.use(authenticate, authorize(UserRole.PATIENT));

/**
 * GET /api/v1/patients/me
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            phone: true,
            languagePreference: true,
            createdAt: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/patients/me
 */
router.put(
  '/me',
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      const updated = await prisma.patient.update({
        where: { userId: req.user!.id },
        data: {
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender,
          bloodGroup: data.bloodGroup || BloodGroup.UNKNOWN,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pinCode: data.pinCode,
          knownAllergies: data.knownAllergies,
          existingConditions: data.existingConditions || [],
        },
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/patients/me/photo
 */
router.post(
  '/me/photo',
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: { message: 'No photo provided' } });
      }

      const photoUrl = `/uploads/photos/${req.file.filename}`;

      const updated = await prisma.patient.update({
        where: { userId: req.user!.id },
        data: { profilePhotoUrl: photoUrl },
      });

      res.status(200).json({
        success: true,
        message: 'Profile photo uploaded',
        data: { profilePhotoUrl: updated.profilePhotoUrl },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
