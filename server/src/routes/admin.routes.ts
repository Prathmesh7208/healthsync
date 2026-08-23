import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { UserRole, EmergencyStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import authenticate from '../middleware/auth';
import authorize from '../middleware/rbac';
import { AppError } from '../utils/errors';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize(UserRole.ADMIN));

/**
 * GET /api/v1/admin/stats
 * Platform KPI Summary
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalDoctors,
      totalPatients,
      totalHospitals,
      totalAppointments,
      activeEmergencies,
      totalUsers,
    ] = await Promise.all([
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.hospital.count(),
      prisma.appointment.count(),
      prisma.emergency.count({
        where: {
          status: {
            in: [
              EmergencyStatus.INITIATED,
              EmergencyStatus.ACKNOWLEDGED,
              EmergencyStatus.AMBULANCE_ASSIGNED,
              EmergencyStatus.AMBULANCE_EN_ROUTE,
              EmergencyStatus.ARRIVED_AT_PATIENT,
              EmergencyStatus.PATIENT_PICKED_UP,
              EmergencyStatus.EN_ROUTE_TO_HOSPITAL,
              EmergencyStatus.ARRIVED_AT_HOSPITAL,
            ],
          },
        },
      }),
      prisma.user.count(),
    ]);

    const recentAppointments = await prisma.appointment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { fullName: true } },
        doctor: { select: { fullName: true, specializations: true } },
        hospital: { select: { name: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalDoctors,
          totalPatients,
          totalHospitals,
          totalAppointments,
          activeEmergencies,
          totalUsers,
        },
        recentAppointments,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/doctors
 * List all doctors with their hospital affiliations & active status
 */
router.get('/doctors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';

    const doctors = await prisma.doctor.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { registrationNumber: { contains: search, mode: 'insensitive' } },
              { user: { phone: { contains: search } } },
            ],
          }
        : undefined,
      include: {
        user: { select: { id: true, phone: true, isActive: true, createdAt: true } },
        affiliations: {
          include: {
            hospital: { select: { id: true, name: true, city: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/doctors
 * Manual Doctor Registration from Admin Panel
 */
router.post('/doctors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      phone,
      password,
      fullName,
      registrationNumber,
      specializations,
      experienceYears = 1,
      bio,
      languages = ['English', 'Hindi'],
      consultationFee = 500,
      hospitalId,
    } = req.body;

    if (!phone || !fullName || !registrationNumber) {
      throw new AppError('Phone, Full Name, and Medical Registration Number are required', 400);
    }

    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const passwordHash = await bcrypt.hash(password || 'HealthSync@123', 10);

    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        password: passwordHash,
        role: UserRole.DOCTOR,
        isActive: true,
        doctor: {
          create: {
            fullName,
            registrationNumber,
            specializations: Array.isArray(specializations) ? specializations : [specializations || 'General Medicine'],
            experienceYears: Number(experienceYears),
            bio: bio || `Dr. ${fullName} is an experienced medical specialist.`,
            languages: Array.isArray(languages) ? languages : ['English', 'Hindi'],
            isAvailable: true,
            affiliations: hospitalId
              ? {
                  create: {
                    hospitalId,
                    consultationFee: Number(consultationFee),
                    isActive: true,
                  },
                }
              : undefined,
          },
        },
      },
      include: {
        doctor: {
          include: {
            affiliations: { include: { hospital: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: user.doctor,
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return next(new AppError('A doctor with this phone number or registration number already exists', 400));
    }
    next(err);
  }
});

/**
 * PATCH /api/v1/admin/doctors/:id/toggle
 * Toggle Doctor Active / Deactivated status
 */
router.patch('/doctors/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!doctor) throw new AppError('Doctor not found', 404);

    const updatedUser = await prisma.user.update({
      where: { id: doctor.userId },
      data: { isActive: !doctor.user.isActive },
    });

    res.status(200).json({
      success: true,
      message: `Doctor account ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: updatedUser.isActive },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/doctors/sample-template
 * Download Clean Sample Excel (.xlsx) Template with example doctors
 */
router.get('/doctors/sample-template', (_req: Request, res: Response) => {
  const sampleData = [
    {
      'Full Name': 'Dr. Rohan Deshmukh',
      'Phone (10 digits)': '9822100001',
      'Registration Number': 'MCI-2015-44912',
      'Specializations (comma separated)': 'Cardiology, Interventional Cardiology',
      'Experience (Years)': 14,
      'Consultation Fee (INR)': 800,
      'Languages (comma separated)': 'English, Hindi, Marathi',
      'Bio': 'Senior Cardiologist specializing in echocardiography and preventive care.',
      'Hospital Name (Optional)': 'Ruby Hall Clinic',
    },
    {
      'Full Name': 'Dr. Ananya Sharma',
      'Phone (10 digits)': '9822100002',
      'Registration Number': 'MCI-2018-88219',
      'Specializations (comma separated)': 'Pediatrics, Neonatology',
      'Experience (Years)': 9,
      'Consultation Fee (INR)': 600,
      'Languages (comma separated)': 'English, Hindi',
      'Bio': 'Pediatrician dedicated to child health, immunizations, and adolescent wellness.',
      'Hospital Name (Optional)': 'Sahyadri Super Speciality Hospital',
    },
    {
      'Full Name': 'Dr. Sameer Kulkarni',
      'Phone (10 digits)': '9822100003',
      'Registration Number': 'MCI-2012-10934',
      'Specializations (comma separated)': 'Orthopedics, Sports Medicine',
      'Experience (Years)': 16,
      'Consultation Fee (INR)': 900,
      'Languages (comma separated)': 'English, Marathi',
      'Bio': 'Orthopedic surgeon focusing on joint replacements and arthroscopy.',
      'Hospital Name (Optional)': 'Jupiter Hospital',
    },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 24 },
    { wch: 18 },
    { wch: 22 },
    { wch: 38 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 45 },
    { wch: 32 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Doctors_Template');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="HealthSync_Doctor_Import_Template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

/**
 * POST /api/v1/admin/doctors/bulk-upload
 * Parse and batch import doctors from Excel / CSV file
 */
router.post('/doctors/bulk-upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('Please attach an Excel (.xlsx, .xls) or CSV file', 400);
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0) {
      throw new AppError('The uploaded sheet is empty', 400);
    }

    const defaultPasswordHash = await bcrypt.hash('HealthSync@123', 10);
    const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
    const hospitalMap = new Map<string, string>();
    hospitals.forEach((h) => hospitalMap.set(h.name.toLowerCase().trim(), h.id));

    const results = {
      total: rows.length,
      successCount: 0,
      failedCount: 0,
      errors: [] as { row: number; doctorName?: string; error: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const fullName = row['Full Name'] || row['fullName'] || row['Name'] || row['Doctor Name'];
      const rawPhone = String(row['Phone (10 digits)'] || row['phone'] || row['Phone'] || row['Mobile'] || '').replace(/\D/g, '');
      const registrationNumber = String(row['Registration Number'] || row['registrationNumber'] || row['Reg No'] || `REG-${Date.now()}-${i}`);
      const rawSpecs = row['Specializations (comma separated)'] || row['specializations'] || row['Specialty'] || 'General Medicine';
      const experienceYears = Number(row['Experience (Years)'] || row['experienceYears'] || row['Experience'] || 5);
      const consultationFee = Number(row['Consultation Fee (INR)'] || row['consultationFee'] || row['Fee'] || 500);
      const rawLangs = row['Languages (comma separated)'] || row['languages'] || 'English, Hindi';
      const bio = row['Bio'] || `Dr. ${fullName} is a dedicated healthcare specialist.`;
      const hospitalName = (row['Hospital Name (Optional)'] || row['hospital'] || '').toLowerCase().trim();

      if (!fullName || !rawPhone || rawPhone.length < 10) {
        results.failedCount++;
        results.errors.push({
          row: rowNum,
          doctorName: fullName || 'Unknown',
          error: 'Missing Full Name or valid 10-digit Phone Number',
        });
        continue;
      }

      const phone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone.slice(-10)}`;
      const specializations = String(rawSpecs).split(',').map((s) => s.trim()).filter(Boolean);
      const languages = String(rawLangs).split(',').map((l) => l.trim()).filter(Boolean);
      const matchedHospitalId = hospitalName ? hospitalMap.get(hospitalName) : undefined;

      try {
        await prisma.user.upsert({
          where: { phone },
          update: {
            role: UserRole.DOCTOR,
            isActive: true,
            doctor: {
              upsert: {
                update: {
                  fullName,
                  registrationNumber,
                  specializations,
                  experienceYears,
                  bio,
                  languages,
                  isAvailable: true,
                },
                create: {
                  fullName,
                  registrationNumber,
                  specializations,
                  experienceYears,
                  bio,
                  languages,
                  isAvailable: true,
                  affiliations: matchedHospitalId
                    ? {
                        create: {
                          hospitalId: matchedHospitalId,
                          consultationFee,
                          isActive: true,
                        },
                      }
                    : undefined,
                },
              },
            },
          },
          create: {
            phone,
            password: defaultPasswordHash,
            role: UserRole.DOCTOR,
            isActive: true,
            doctor: {
              create: {
                fullName,
                registrationNumber,
                specializations,
                experienceYears,
                bio,
                languages,
                isAvailable: true,
                affiliations: matchedHospitalId
                  ? {
                      create: {
                        hospitalId: matchedHospitalId,
                        consultationFee,
                        isActive: true,
                      },
                    }
                  : undefined,
              },
            },
          },
        });
        results.successCount++;
      } catch (err: any) {
        results.failedCount++;
        results.errors.push({
          row: rowNum,
          doctorName: fullName,
          error: err.message || 'Failed to save doctor',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${results.successCount} doctors created/updated, ${results.failedCount} skipped.`,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/doctors/export
 * Export existing doctor registry to Excel (.xlsx)
 */
router.get('/doctors/export', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: { select: { phone: true, isActive: true } },
        affiliations: { include: { hospital: { select: { name: true } } } },
      },
      orderBy: { fullName: 'asc' },
    });

    const exportRows = doctors.map((doc) => ({
      'Doctor Name': doc.fullName,
      'Phone': doc.user.phone,
      'Registration Number': doc.registrationNumber,
      'Specializations': Array.isArray(doc.specializations) ? (doc.specializations as string[]).join(', ') : String(doc.specializations || ''),
      'Experience (Years)': doc.experienceYears,
      'Languages': Array.isArray(doc.languages) ? (doc.languages as string[]).join(', ') : String(doc.languages || ''),
      'Hospital Affiliation': doc.affiliations.map((a) => a.hospital.name).join(', ') || 'Independent',
      'Consultation Fee': doc.affiliations[0]?.consultationFee || 500,
      'Status': doc.user.isActive ? 'Active' : 'Inactive',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registered_Doctors');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="HealthSync_Doctor_Registry.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/hospitals & POST /api/v1/admin/hospitals
 */
router.get('/hospitals', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: {
        _count: {
          select: { affiliations: true, receptionists: true, appointments: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: hospitals });
  } catch (err) {
    next(err);
  }
});

router.post('/hospitals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, city, state = 'Maharashtra', pinCode, phone, latitude = 18.5204, longitude = 73.8567, hasEmergency = true, departments = [], facilities = [] } = req.body;
    if (!name || !address || !city) throw new AppError('Hospital Name, Address, and City are required', 400);

    const hospital = await prisma.hospital.create({
      data: {
        name,
        address,
        city,
        state,
        pinCode: pinCode || '411001',
        phone: phone || '+912012345678',
        latitude: Number(latitude),
        longitude: Number(longitude),
        hasEmergency: Boolean(hasEmergency),
        departments: Array.isArray(departments) ? departments : ['General Medicine'],
        facilities: Array.isArray(facilities) ? facilities : ['24x7 ER', 'Pharmacy'],
      },
    });

    res.status(201).json({ success: true, message: 'Hospital created', data: hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/users
 */
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as UserRole | undefined;
    const users = await prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        patient: { select: { fullName: true } },
        doctor: { select: { fullName: true, specializations: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    res.status(200).json({ success: true, message: 'User status updated', data: { isActive: updated.isActive } });
  } catch (err) {
    next(err);
  }
});

export default router;
