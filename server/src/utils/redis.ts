import Redis from 'ioredis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 2000);
    return delay;
  },
  lazyConnect: true,
});

let isConnected = false;

redis.on('connect', () => {
  isConnected = true;
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
  if (!isConnected) {
    logger.warn(`Redis connection unavailable at ${redisUrl}. Background workers/cache may use fallback.`);
  } else {
    logger.error('Redis error:', err);
  }
});

// Try non-blocking connect on startup
redis.connect().catch(() => {
  logger.warn(`Initial Redis connection attempt to ${redisUrl} failed. Redis operations will retry.`);
});

// Simple in-memory fallback cache for dev when Redis is not running
const memoryStore = new Map<string, { val: string; expiresAt: number | null }>();

export const cacheService = {
  async get(key: string): Promise<string | null> {
    try {
      if (isConnected) return await redis.get(key);
    } catch {
      // fallback
    }
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return item.val;
  },

  async set(key: string, val: string, ttlSeconds?: number): Promise<void> {
    try {
      if (isConnected) {
        if (ttlSeconds) {
          await redis.set(key, val, 'EX', ttlSeconds);
        } else {
          await redis.set(key, val);
        }
        return;
      }
    } catch {
      // fallback
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    memoryStore.set(key, { val, expiresAt });
  },

  async del(key: string): Promise<void> {
    try {
      if (isConnected) await redis.del(key);
    } catch {
      // fallback
    }
    memoryStore.delete(key);
  },
};

export default redis;
