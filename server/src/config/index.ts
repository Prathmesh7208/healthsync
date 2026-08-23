import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://healthsync:healthsync_password@localhost:5432/healthsync_db?schema=public',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'healthsync_jwt_secret_dev_key',
    expiry: process.env.JWT_EXPIRY || '24h',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'healthsync_refresh_secret_dev_key',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '30d',
  },

  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
    cooldownSeconds: parseInt(process.env.OTP_COOLDOWN_SECONDS || '30', 10),
  },

  sms: {
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || 'HLTSNC',
  },

  maps: {
    apiKey: process.env.MAPS_API_KEY || '',
  },

  storage: {
    bucket: process.env.S3_BUCKET || 'healthsync-records',
    region: process.env.S3_REGION || 'ap-south-1',
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
  },
};

export default config;
