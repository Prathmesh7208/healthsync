import Redis from 'ioredis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL;

let redis: Redis | null = null;
let isConnected = false;

if (redisUrl) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retry spam if Redis is permanently unavailable
      return Math.min(times * 1000, 3000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    isConnected = true;
    logger.info('Connected to Redis');
  });

  redis.on('error', (_err) => {
    if (!isConnected) {
      logger.warn(`Redis connection unavailable at ${redisUrl}. Using memory cache fallback.`);
    }
  });

  // Try non-blocking connect
  redis.connect().catch(() => {
    logger.warn(`Initial Redis connection attempt to ${redisUrl} failed. In-memory fallback is active.`);
  });
} else {
  logger.info('REDIS_URL not configured. Running with in-memory caching engine.');
}

// In-memory fallback cache
const memoryStore = new Map<string, { val: string; expiresAt: number | null }>();

export const cacheService = {
  async get(key: string): Promise<string | null> {
    try {
      if (isConnected && redis) return await redis.get(key);
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
      if (isConnected && redis) {
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
      if (isConnected && redis) await redis.del(key);
    } catch {
      // fallback
    }
    memoryStore.delete(key);
  },
};

export default redis;
