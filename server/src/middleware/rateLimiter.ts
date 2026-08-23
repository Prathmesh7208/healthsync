import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../utils/redis';
import { RateLimitError } from '../utils/errors';

export interface RateLimitOptions {
  windowSeconds?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export const rateLimiter = (options: RateLimitOptions = {}) => {
  const { windowSeconds = 60, maxRequests = 100, keyPrefix = 'ratelimit' } = options;

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
      const userId = req.user?.id || clientIp;
      const key = `${keyPrefix}:${userId}`;

      const current = await cacheService.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        return next(
          new RateLimitError(`Too many requests. Limit is ${maxRequests} per ${windowSeconds}s.`)
        );
      }

      if (!current) {
        await cacheService.set(key, '1', windowSeconds);
      } else {
        await cacheService.set(key, (count + 1).toString(), windowSeconds);
      }

      next();
    } catch {
      // Allow request to proceed if rate limiting cache encounters an internal error
      next();
    }
  };
};

export default rateLimiter;
