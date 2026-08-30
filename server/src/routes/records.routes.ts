import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { MedicalRecordType } from '@prisma/client';
import { encryptHealthData, decryptHealthData } from '../utils/securityCrypto';
import { recordSecurityAudit } from '../utils/securityAudit';

const router = Router();
router.use(authenticate);

// Setup Multer storage for health records
const recordsDir = path.resolve(__dirname, '../../../uploads/records');
if (!fs.existsSync(recordsDir)) {
  fs.mkdirSync(recordsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, recordsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `record-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

/**
 * GET /api/v1/patients/me/records
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const { type } = req.query as { type?: string };

    const where: any = { patientId: patient.id };
    if (type && type !== 'ALL') {
      where.type = type as MedicalRecordType;
    }

    const rawRecords = await prisma.medicalRecord.findMany({
      where,
      orderBy: { recordDate: 'desc' },
    });

    // Decrypt notes at rest
    const records = rawRecords.map((rec) => ({
      ...rec,
      notes: rec.notes ? decryptHealthData(rec.notes) : null,
    }));

    recordSecurityAudit('DATA_ACCESS_HEALTH_RECORD', {
      userId: req.user!.id,
      userRole: req.user!.role,
      resource: `patient:${patient.id}:records`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'SUCCESS',
      metadata: { count: records.length },
    });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/patients/me/records
 */
router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user!.id },
      });

      if (!patient) {
        throw new NotFoundError('Patient profile');
      }

      if (!req.file) {
        return res.status(400).json({ error: { message: 'File is required' } });
      }

      const { type = 'OTHER', category, notes, recordDate } = req.body;
      const fileUrl = `/uploads/records/${req.file.filename}`;

      // Encrypt sensitive clinical notes with AES-256-GCM before saving to database
      const encryptedNotes = notes ? encryptHealthData(notes) : null;

      const record = await prisma.medicalRecord.create({
        data: {
          patientId: patient.id,
          type: type as MedicalRecordType,
          fileUrl,
          fileName: req.file.originalname,
          category: category || null,
          notes: encryptedNotes,
          uploadedBy: req.user!.id,
          recordDate: recordDate ? new Date(recordDate) : new Date(),
        },
      });

      recordSecurityAudit('DATA_MUTATION', {
        userId: req.user!.id,
        userRole: req.user!.role,
        resource: `record:${record.id}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
      });

      res.status(201).json({
        success: true,
        message: 'Medical document uploaded',
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/patients/me/records/:id
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!record) {
      throw new NotFoundError('Medical record');
    }

    if (record.patient.userId !== req.user!.id) {
      throw new AuthorizationError('Not authorized to delete this document');
    }

    await prisma.medicalRecord.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Medical record deleted',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
