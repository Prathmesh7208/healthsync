import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import SlotService from '../services/slot.service';

const router = Router();

// Public / Authenticated discovery routes
router.use(authenticate);

/**
 * GET /api/v1/doctors
 * Search, filter, and sort doctors
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      q,
      specialization,
      language,
      feeMax,
      availability,
      sortBy = 'rating',
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const take = Math.min(parseInt(limit, 10) || 20, 50);
    const skip = (pageNum - 1) * take;

    const whereClause: any = {
      isAvailable: availability === 'today' ? true : undefined,
    };

    if (q) {
      whereClause.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      include: {
        affiliations: {
          include: {
            hospital: true,
          },
        },
      },
      skip,
      take,
    });

    // In-memory filter for JSON fields (specializations, languages, fee)
    let filtered = doctors;

    if (specialization) {
      filtered = filtered.filter((doc) => {
        const specs = Array.isArray(doc.specializations) ? (doc.specializations as string[]) : [];
        return specs.some((s) => s.toLowerCase().includes(specialization.toLowerCase()));
      });
    }

    if (language) {
      filtered = filtered.filter((doc) => {
        const langs = Array.isArray(doc.languages) ? (doc.languages as string[]) : [];
        return langs.some((l) => l.toLowerCase().includes(language.toLowerCase()));
      });
    }

    if (feeMax) {
      const max = parseFloat(feeMax);
      filtered = filtered.filter((doc) =>
        doc.affiliations.some((aff) => Number(aff.consultationFee) <= max)
      );
    }

    // Sorting
    if (sortBy === 'experience') {
      filtered.sort((a, b) => b.experienceYears - a.experienceYears);
    } else if (sortBy === 'fee_asc') {
      filtered.sort((a, b) => {
        const feeA = Math.min(...a.affiliations.map((af) => Number(af.consultationFee)), 9999);
        const feeB = Math.min(...b.affiliations.map((af) => Number(af.consultationFee)), 9999);
        return feeA - feeB;
      });
    }

    const total = filtered.length;

    res.status(200).json({
      success: true,
      data: {
        doctors: filtered,
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/doctors/:id
 * Get detailed doctor profile
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        affiliations: {
          include: {
            hospital: true,
          },
        },
        schedules: {
          include: {
            hospital: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundError('Doctor');
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
 * GET /api/v1/doctors/:id/slots
 * Date-wise slot availability
 */
router.get('/:id/slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: doctorId } = req.params;
    const { date, hospitalId } = req.query as { date?: string; hospitalId?: string };

    if (!date) {
      return res.status(400).json({ error: { message: 'Query parameter "date" (YYYY-MM-DD) is required.' } });
    }

    // Default to first affiliation if hospitalId not provided
    let targetHospitalId = hospitalId;
    if (!targetHospitalId) {
      const aff = await prisma.doctorHospitalAffiliation.findFirst({
        where: { doctorId },
      });
      if (!aff) {
        throw new NotFoundError('Doctor affiliations');
      }
      targetHospitalId = aff.hospitalId;
    }

    const targetDate = new Date(date);
    const slots = await SlotService.getSlotsForDate(doctorId, targetHospitalId, targetDate);

    res.status(200).json({
      success: true,
      data: {
        doctorId,
        hospitalId: targetHospitalId,
        date,
        slots,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
