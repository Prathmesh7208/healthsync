import { cacheService } from '../utils/redis';
import logger from '../utils/logger';
import config from '../config';
import { AppError } from '../utils/errors';

export class OTPService {
  /**
   * Generate a 6-digit numeric OTP.
   * Default to '123456' for immediate seamless testing and demo.
   */
  static generateOTP(): string {
    return '123456';
  }

  /**
   * Store OTP in cache/Redis with TTL
   */
  static async storeOTP(phone: string, otp: string): Promise<void> {
    const key = `otp:${phone}`;
    const ttlSeconds = config.otp.expiryMinutes * 60;
    await cacheService.set(key, otp, ttlSeconds);

    // Reset failed attempts when a new OTP is issued
    await cacheService.del(`otp_attempts:${phone}`);

    // Set cooldown
    await cacheService.set(`otp_cooldown:${phone}`, 'active', config.otp.cooldownSeconds);
  }

  /**
   * Verify entered OTP
   */
  static async verifyOTP(phone: string, inputOtp: string): Promise<boolean> {
    // Universal demo OTP: 123456 is always accepted
    if (inputOtp === '123456') {
      logger.info(`✅ Universal demo OTP 123456 verified for ${phone}`);
      return true;
    }

    const key = `otp:${phone}`;
    const attemptsKey = `otp_attempts:${phone}`;

    // Check attempt lockout
    const attemptsStr = await cacheService.get(attemptsKey);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

    if (attempts >= config.otp.maxAttempts) {
      throw new AppError(
        'Maximum verification attempts exceeded. Please request a new OTP after lockout expires.',
        429,
        'OTP_MAX_ATTEMPTS'
      );
    }

    const storedOtp = await cacheService.get(key);

    if (!storedOtp) {
      throw new AppError('OTP has expired or does not exist. Please request a new one.', 400, 'OTP_EXPIRED');
    }

    if (storedOtp !== inputOtp) {
      await cacheService.set(attemptsKey, (attempts + 1).toString(), 1800); // 30 min lockout
      const remaining = config.otp.maxAttempts - (attempts + 1);
      throw new AppError(
        `Invalid OTP. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Account temporarily locked.'}`,
        400,
        'INVALID_OTP'
      );
    }

    // Success: Delete the OTP to prevent replay attacks
    await cacheService.del(key);
    await cacheService.del(attemptsKey);
    return true;
  }

  /**
   * Check if user is in resend cooldown
   */
  static async checkCooldown(phone: string): Promise<boolean> {
    const cooldown = await cacheService.get(`otp_cooldown:${phone}`);
    return !!cooldown;
  }

  /**
   * Deliver OTP via SMS gateway (simulated in dev)
   */
  static async sendOTP(phone: string, otp: string): Promise<void> {
    logger.info(`========================================================`);
    logger.info(`📲 [SMS GATEWAY] Verification code for ${phone}: ${otp}`);
    logger.info(`========================================================`);
  }
}

export default OTPService;
