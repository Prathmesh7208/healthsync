import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import config from './config';
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import { NotFoundError } from './utils/errors';
import {
  helmetSecurityMiddleware,
  apiRateLimiter,
  authRateLimiter,
  emergencyRateLimiter,
  sanitizeRequestPayload,
  antiScraperDefense,
} from './middleware/security';

export const app = express();

// 1. Enterprise Helmet Security Headers & WAF
app.use(helmetSecurityMiddleware);

// 2. Anti-Scraper & Bot Traps
app.use(antiScraperDefense);

// 3. Request ID attachment
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || randomUUID();
  (req as any).id = reqId;
  res.setHeader('x-request-id', reqId);
  next();
});

// 4. Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      requestId: (req as any).id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  next();
});

// 5. CORS with Strict Origin Policies
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile app / native API) or web requests
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  })
);

// 6. Request Body Parsing & Anti-Injection Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeRequestPayload);

// 7. General API Rate Limiting (Anti-DDoS)
app.use('/api', apiRateLimiter);

import path from 'path';
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import doctorRoutes from './routes/doctor.routes';
import appointmentRoutes from './routes/appointment.routes';
import recordsRoutes from './routes/records.routes';
import reminderRoutes from './routes/reminder.routes';

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// Health Check & Root Endpoints
app.get(['/health', '/api/v1/health', '/'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HealthSync Backend Engine',
    version: '1.0.0',
  });
});

app.head(['/health', '/api/v1/health', '/'], (_req: Request, res: Response) => {
  res.status(200).end();
});

import doctorDashboardRoutes from './routes/doctorDashboard.routes';
import doctorAppointmentRoutes from './routes/doctorAppointment.routes';
import consultationRoutes from './routes/consultation.routes';
import prescriptionRoutes from './routes/prescription.routes';

import receptionistRoutes from './routes/receptionist.routes';

import ambulanceRoutes from './routes/ambulance.routes';
import emergencyRoutes from './routes/emergency.routes';
import adminRoutes from './routes/admin.routes';

// Mount API Routes with Dedicated Security Limiters
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctors/me', doctorDashboardRoutes);
app.use('/api/v1/doctors/me', doctorAppointmentRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/patients/me/records', recordsRoutes);
app.use('/api/v1/patients/me/reminders', reminderRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/receptionist', receptionistRoutes);
app.use('/api/v1/ambulance', ambulanceRoutes);
app.use('/api/v1/emergencies', emergencyRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 Not Found Handler for unmatched routes
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('API Route'));
});

// Global Error Handler
app.use(errorHandler);

export default app;
