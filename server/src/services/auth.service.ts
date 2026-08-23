import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserRole, LanguagePreference } from '@prisma/client';
import prisma from '../utils/prisma';
import config from '../config';
import { AuthenticationError, NotFoundError } from '../utils/errors';
import { AuthUser } from '../middleware/auth';

export class AuthService {
  /**
   * Generate access token (JWT)
   */
  static generateAccessToken(user: { id: string; phone: string; role: UserRole }): string {
    const payload: AuthUser = {
      id: user.id,
      phone: user.phone,
      role: user.role,
    };
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry as any,
    });
  }

  /**
   * Generate refresh token (JWT)
   */
  static generateRefreshToken(user: { id: string }): string {
    return jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as any,
    });
  }

  /**
   * Verify refresh token and issue new access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ token: string; user: any }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          patient: true,
          doctor: true,
          receptionist: true,
          ambulanceOperator: true,
        },
      });

      if (!user || !user.isActive) {
        throw new AuthenticationError('User account not found or deactivated');
      }

      const newAccessToken = this.generateAccessToken(user);
      return {
        token: newAccessToken,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          languagePreference: user.languagePreference,
          profile: user.patient || user.doctor || user.receptionist || user.ambulanceOperator,
        },
      };
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  /**
   * Handle OTP-based login or patient registration
   */
  static async handleOTPAuth(
    phone: string,
    countryCode: string = '+91',
    preferredLanguage: LanguagePreference = LanguagePreference.EN
  ): Promise<{ token: string; refreshToken: string; user: any; isNewUser: boolean }> {
    const normalizedPhone = phone.trim();

    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: {
        patient: true,
        doctor: true,
        receptionist: true,
        ambulanceOperator: true,
      },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Register new user as PATIENT
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          countryCode,
          role: UserRole.PATIENT,
          languagePreference: preferredLanguage,
          patient: {
            create: {
              fullName: '',
            },
          },
        },
        include: {
          patient: true,
          doctor: true,
          receptionist: true,
          ambulanceOperator: true,
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      token,
      refreshToken,
      isNewUser,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        languagePreference: user.languagePreference,
        profile: user.patient || user.doctor || user.receptionist || user.ambulanceOperator,
      },
    };
  }

  /**
   * Handle credential-based login (doctors, receptionists, ambulance, admin)
   */
  static async handleCredentialLogin(
    identifier: string, // phone or email (searchable in doctors/hospitals or phone)
    passwordInput: string
  ): Promise<{ token: string; refreshToken: string; user: any }> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: identifier }],
      },
      include: {
        patient: true,
        doctor: true,
        receptionist: true,
        ambulanceOperator: true,
      },
    });

    if (!user || !user.password) {
      throw new AuthenticationError('Invalid phone number or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await bcrypt.compare(passwordInput, user.password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid phone number or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        languagePreference: user.languagePreference,
        profile: user.patient || user.doctor || user.receptionist || user.ambulanceOperator,
      },
    };
  }

  /**
   * Hash a plain-text password
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}

export default AuthService;
