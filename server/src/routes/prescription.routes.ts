import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import validate from '../middleware/validate';
import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { UserRole, MedicineForm, MedicineTiming, MedicalRecordType } from '@prisma/client';

const router = Router();
router.use(authenticate, authorize(UserRole.DOCTOR));

const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name required'),
  dosage: z.string().min(1, 'Dosage required'),
  form: z.nativeEnum(MedicineForm).default(MedicineForm.TABLET),
  frequency: z.string().default('Twice daily'),
  timing: z.nativeEnum(MedicineTiming).default(MedicineTiming.AFTER_FOOD),
  duration: z.string().default('5 days'),
  specialInstructions: z.string().optional().nullable(),
});

const createPrescriptionSchema = z.object({
  consultationId: z.string().uuid(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medication is required'),
});

/**
 * POST /api/v1/prescriptions
 */
router.post(
  '/',
  validate(createPrescriptionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
      if (!doctor) throw new NotFoundError('Doctor');

      const { consultationId, items } = req.body;

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: { patient: true },
      });

      if (!consultation || consultation.doctorId !== doctor.id) {
        throw new NotFoundError('Consultation');
      }

      // Create prescription with items
      const prescription = await prisma.prescription.create({
        data: {
          consultationId,
          doctorId: doctor.id,
          patientId: consultation.patientId,
          items: {
            create: items.map((item: any) => ({
              medicineName: item.medicineName,
              dosage: item.dosage,
              form: item.form,
              frequency: item.frequency,
              timing: item.timing,
              duration: item.duration,
              specialInstructions: item.specialInstructions || null,
            })),
          },
        },
        include: { items: true },
      });

      // Auto-create an entry in patient's Medical Records
      await prisma.medicalRecord.create({
        data: {
          patientId: consultation.patientId,
          type: MedicalRecordType.PRESCRIPTION,
          fileUrl: '', // Generated or viewable via API
          fileName: `Prescription - Dr. ${doctor.fullName}`,
          category: 'Doctor Prescription',
          notes: `Prescribed ${items.length} medications on ${new Date().toLocaleDateString()}`,
          uploadedBy: doctor.id,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Prescription generated successfully',
        data: prescription,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
