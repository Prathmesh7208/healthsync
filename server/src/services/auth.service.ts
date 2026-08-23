import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRole, LanguagePreference } from '@prisma/client';
import prisma from '../utils/prisma';
import config from '../config';
import { AuthenticationError } from '../utils/errors';
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
   * Handle credential-based login (doctors, receptionists, ambulance, admin, patients)
   */
  static async handleCredentialLogin(
    identifier: string,
    passwordInput: string
  ): Promise<{ token: string; refreshToken: string; user: any }> {
    const trimmed = identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: trimmed },
          { phone: trimmed.startsWith('+') ? trimmed : `+91${trimmed}` },
        ],
      },
      include: {
        patient: true,
        doctor: true,
        receptionist: true,
        ambulanceOperator: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('Account not found with this phone number');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Your account has been deactivated. Please contact support.');
    }

    // Master test passwords accepted for any account: "123456" or "HealthSync@123"
    const isMasterPassword = passwordInput === '123456' || passwordInput === 'HealthSync@123';

    if (!isMasterPassword) {
      if (!user.password) {
        throw new AuthenticationError('Invalid credentials. Use OTP or password HealthSync@123 / 123456.');
      }
      const isMatch = await bcrypt.compare(passwordInput, user.password);
      if (!isMatch) {
        throw new AuthenticationError('Invalid password. Default demo password is 123456 or HealthSync@123.');
      }
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
