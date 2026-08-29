import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired keys every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime <= now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

export function createRateLimiter(options: {
  windowMs: number; // e.g. 60 * 1000 (1 min)
  max: number; // e.g. 5 requests
  message: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime <= now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > options.max) {
      const retryAfterSec = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: options.message,
          retryAfter: `${retryAfterSec} seconds`,
        },
      });
    }

    next();
  };
}

export const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many OTP requests from this IP. Please wait 1 minute before retrying.',
});

export const emergencyRateLimiter = createRateLimiter({
  windowMs: 30 * 1000, // 30 seconds
  max: 3,
  message: 'Rapid emergency activation detected. Please wait before re-triggering.',
});
