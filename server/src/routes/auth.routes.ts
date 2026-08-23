import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import validate from '../middleware/validate';
import rateLimiter from '../middleware/rateLimiter';
import OTPService from '../services/otp.service';
import AuthService from '../services/auth.service';
import { logAuditEvent } from '../middleware/auditLog';
import { AppError } from '../utils/errors';
import { LanguagePreference } from '@prisma/client';

const router = Router();

// Validation Schemas
const sendOTPSchema = z.object({
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 digits')
    .max(15, 'Phone number must be at most 15 digits'),
  countryCode: z.string().default('+91'),
});

const verifyOTPSchema = z.object({
  phone: z.string().min(8).max(15),
  countryCode: z.string().default('+91'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  language: z.nativeEnum(LanguagePreference).default(LanguagePreference.EN),
});

const credentialLoginSchema = z.object({
  identifier: z.string().min(3, 'Phone or username required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

/**
 * POST /api/v1/auth/otp/send
 * Rate limited to 5 requests per minute per IP
 */
router.post(
  '/otp/send',
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyPrefix: 'otp_send' }),
  validate(sendOTPSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, countryCode } = req.body;
      const fullPhone = phone.startsWith('+') ? phone : `${countryCode}${phone}`;

      const inCooldown = await OTPService.checkCooldown(fullPhone);
      if (inCooldown) {
        throw new AppError('Please wait before requesting another OTP.', 429, 'OTP_COOLDOWN');
      }

      const otp = OTPService.generateOTP();
      await OTPService.storeOTP(fullPhone, otp);
      await OTPService.sendOTP(fullPhone, otp);

      await logAuditEvent(
        null,
        'OTP_SENT',
        'Auth',
        undefined,
        { phone: fullPhone },
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          cooldownSeconds: 30,
          expiresInMinutes: 5,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/otp/verify
 */
router.post(
  '/otp/verify',
  rateLimiter({ windowSeconds: 60, maxRequests: 10, keyPrefix: 'otp_verify' }),
  validate(verifyOTPSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, countryCode, otp, language } = req.body;
      const fullPhone = phone.startsWith('+') ? phone : `${countryCode}${phone}`;

      // Verify OTP
      await OTPService.verifyOTP(fullPhone, otp);

      // Authenticate or register patient
      const authResult = await AuthService.handleOTPAuth(fullPhone, countryCode, language);

      await logAuditEvent(
        authResult.user.id,
        authResult.isNewUser ? 'USER_REGISTERED_OTP' : 'USER_LOGIN_OTP',
        'User',
        authResult.user.id,
        { role: authResult.user.role },
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        message: authResult.isNewUser ? 'Account registered successfully' : 'Login successful',
        data: authResult,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/login (Staff / Credential Login)
 */
router.post(
  '/login',
  rateLimiter({ windowSeconds: 60, maxRequests: 10, keyPrefix: 'login_cred' }),
  validate(credentialLoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier, password } = req.body;
      const authResult = await AuthService.handleCredentialLogin(identifier, password);

      await logAuditEvent(
        authResult.user.id,
        'USER_LOGIN_CREDENTIALS',
        'User',
        authResult.user.id,
        { role: authResult.user.role },
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: authResult,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', (req: Request, res: Response) => {
  // Invalidate client side tokens
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
