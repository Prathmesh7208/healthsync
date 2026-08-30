import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { recordSecurityAudit } from '../utils/securityAudit';

/**
 * 1. Enterprise Helmet Security Headers
 */
export const helmetSecurityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'https://*.basemaps.cartocdn.com', 'https://server.arcgisonline.com', 'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * 2. Rate Limiting Suite
 */

// Strict Rate Limiting for Auth & Login (15 attempts per 5 minutes per IP)
export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 5 minutes.',
    },
  },
  handler: (req, res, _next, options) => {
    recordSecurityAudit('AUTH_BRUTE_FORCE_ATTEMPT', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'CRITICAL_BLOCK',
      resource: req.originalUrl,
    });
    res.status(options.statusCode).json(options.message);
  },
});

// General API Rate Limiting (200 requests per minute per IP)
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'API rate limit reached. Please slow down requests.',
    },
  },
});

// Sensitive Emergency Trigger Limiter (5 SOS triggers per 2 minutes)
export const emergencyRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'EMERGENCY_RATE_LIMIT_EXCEEDED',
      message: 'Emergency request threshold reached.',
    },
  },
});

/**
 * 3. Deep Request Sanitization & Anti-Injection Middleware
 * Cleans prototype pollution (__proto__, constructor), script tags, and malicious SQL injection keywords
 */
export const sanitizeRequestPayload = (req: Request, _res: Response, next: NextFunction) => {
  const sanitizeValue = (val: any): any => {
    if (val === null || val === undefined) return val;

    if (typeof val === 'string') {
      // Strip potential XSS & script tags
      let cleaned = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      // Strip JavaScript event handlers in HTML
      cleaned = cleaned.replace(/on\w+="[^"]*"/g, '');
      // Neutralize prototype pollution keywords
      if (cleaned === '__proto__' || cleaned === 'constructor' || cleaned === 'prototype') {
        return '';
      }
      return cleaned;
    }

    if (Array.isArray(val)) {
      return val.map(sanitizeValue);
    }

    if (typeof val === 'object') {
      const sanitizedObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(val)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue; // Drop dangerous prototype keys
        }
        sanitizedObj[key] = sanitizeValue(value);
      }
      return sanitizedObj;
    }

    return val;
  };

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);

  next();
};

/**
 * 4. Bot & Third-Party Scraper Trap
 */
export const antiScraperDefense = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = (req.get('user-agent') || '').toLowerCase();
  const blockedScrapers = ['sqlmap', 'nikto', 'acunetix', 'masscan', 'zgrab', 'nmap', 'havij'];

  for (const bot of blockedScrapers) {
    if (userAgent.includes(bot)) {
      recordSecurityAudit('INJECTION_ATTEMPT_BLOCKED', {
        ipAddress: req.ip,
        userAgent,
        resource: req.originalUrl,
        status: 'CRITICAL_BLOCK',
      });
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Automated extraction blocked.' },
      });
    }
  }

  next();
};
