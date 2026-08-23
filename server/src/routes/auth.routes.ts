import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import OTPService from '../services/otp.service';
import AuthService from '../services/auth.service';
import { logAuditEvent } from '../middleware/auditLog';
import { LanguagePreference } from '@prisma/client';

const router = Router();

/**
 * POST /api/v1/auth/otp/send
 * Non-blocking instant OTP response
 */
router.post('/otp/send', async (req: Request, res: Response, next: NextFunction) => {
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
