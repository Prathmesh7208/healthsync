import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import OTPService from '../services/otp.service';
import AuthService from '../services/auth.service';
import { logAuditEvent } from '../middleware/auditLog';
import { LanguagePreference } from '@prisma/client';
import { otpRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/v1/auth/otp/send
 * Non-blocking instant OTP response
 */
router.post('/otp/send', otpRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, countryCode = '+91' } = req.body;
    const rawPhone = String(phone || '').replace(/\D/g, '');
    const fullPhone = phone?.startsWith?.('+') ? phone : `${countryCode}${rawPhone}`;

    const otp = '123456';
    // Asynchronous background storing & logging
    OTPService.storeOTP(fullPhone, otp).catch(() => {});
    OTPService.sendOTP(fullPhone, otp).catch(() => {});
    logAuditEvent(null, 'OTP_SENT', 'Auth', undefined, { phone: fullPhone }, req.ip, req.get('user-agent')).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        cooldownSeconds: 30,
        expiresInMinutes: 5,
        demoOtp: '123456',
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/otp/verify
 * Immediate OTP verification & user authentication
 */
router.post('/otp/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, countryCode = '+91', otp = '123456', language = LanguagePreference.EN } = req.body;
    const rawPhone = String(phone || '').replace(/\D/g, '');
    const fullPhone = phone?.startsWith?.('+') ? phone : `${countryCode}${rawPhone}`;

    // Verify OTP (123456 always valid)
    await OTPService.verifyOTP(fullPhone, otp);

    // Authenticate or register patient
    const authResult = await AuthService.handleOTPAuth(fullPhone, countryCode, language);

    logAuditEvent(
      authResult.user.id,
      authResult.isNewUser ? 'USER_REGISTERED_OTP' : 'USER_LOGIN_OTP',
      'User',
      authResult.user.id,
      { role: authResult.user.role },
      req.ip,
      req.get('user-agent')
    ).catch(() => {});

    return res.status(200).json({
      success: true,
      message: authResult.isNewUser ? 'Account registered successfully' : 'Login successful',
      data: authResult,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/doctor/register (Public Doctor Self-Registration)
 */
router.post('/doctor/register', async (req: Request, res: Response, next: NextFunction) => {
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
    } = req.body;

    if (!phone || !fullName || !registrationNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone, password, full name, and medical registration number are required.',
      });
    }

    const authResult = await AuthService.handleDoctorRegistration({
      phone,
      password,
      fullName,
      registrationNumber,
      specializations: Array.isArray(specializations) ? specializations : [specializations || 'General Medicine'],
      experienceYears: Number(experienceYears),
      bio: bio || `Dr. ${fullName} is a registered healthcare practitioner.`,
      languages: Array.isArray(languages) ? languages : ['English', 'Hindi'],
      consultationFee: Number(consultationFee),
    });

    logAuditEvent(
      authResult.user.id,
      'DOCTOR_REGISTERED',
      'Doctor',
      authResult.user.id,
      { registrationNumber },
      req.ip,
      req.get('user-agent')
    ).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Doctor account registered successfully!',
      data: authResult,
    });
  } catch (err: any) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/patient/register
 */
router.post('/patient/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      phone,
      password,
      fullName,
      bloodGroup,
      gender,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      allergies,
      address,
    } = req.body;

    if (!phone || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Phone and full name are required for patient registration.',
      });
    }

    const authResult = await AuthService.handlePatientRegistration({
      phone,
      password,
      fullName,
      bloodGroup,
      gender,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      allergies,
      address,
    });

    logAuditEvent(
      authResult.user.id,
      'PATIENT_REGISTERED',
      'Patient',
      authResult.user.id,
      { fullName },
      req.ip,
      req.get('user-agent')
    ).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Patient account registered successfully!',
      data: authResult,
    });
  } catch (err: any) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/receptionist/register
 */
router.post('/receptionist/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password, fullName, hospitalName, employeeId, shift } = req.body;

    if (!phone || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Phone, password, and full name are required for receptionist registration.',
      });
    }

    const authResult = await AuthService.handleReceptionistRegistration({
      phone,
      password,
      fullName,
      hospitalName,
      employeeId,
      shift,
    });

    logAuditEvent(
      authResult.user.id,
      'RECEPTIONIST_REGISTERED',
      'Receptionist',
      authResult.user.id,
      { fullName },
      req.ip,
      req.get('user-agent')
    ).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Receptionist desk account registered successfully!',
      data: authResult,
    });
  } catch (err: any) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/ambulance/register
 */
router.post('/ambulance/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password, fullName, vehicleNumber, licenseNumber, ambulanceType, hospitalName } = req.body;

    if (!phone || !password || !fullName || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone, password, pilot name, and ambulance vehicle number are required.',
      });
    }

    const authResult = await AuthService.handleAmbulanceRegistration({
      phone,
      password,
      fullName,
      vehicleNumber,
      licenseNumber,
      ambulanceType,
      hospitalName,
    });

    logAuditEvent(
      authResult.user.id,
      'AMBULANCE_REGISTERED',
      'AmbulanceOperator',
      authResult.user.id,
      { vehicleNumber },
      req.ip,
      req.get('user-agent')
    ).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Ambulance dispatch unit registered successfully!',
      data: authResult,
    });
  } catch (err: any) {
    next(err);
  }
});


/**
 * POST /api/v1/auth/login (Staff / Credential Login)
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;
    const authResult = await AuthService.handleCredentialLogin(identifier, password);

    logAuditEvent(
      authResult.user.id,
      'USER_LOGIN_CREDENTIALS',
      'User',
      authResult.user.id,
      { role: authResult.user.role },
      req.ip,
      req.get('user-agent')
    ).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: authResult,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
