import { createClient, type RedisClientType } from "redis";

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

let redisClientPromise: Promise<RedisClientType> | null = null;

function getRedisClient(): Promise<RedisClientType> | null {
  const url = process.env.REDIS_URL;

  if (!url) {
    return null;
  }

  if (!redisClientPromise) {
    const client = createClient({ url });
    client.on("error", (error) => {
      console.error("Redis rate-limit error:", error);
    });
    redisClientPromise = client.connect().then(() => client);
  }

  return redisClientPromise;
}

const noopRateLimiter = {
  limit: async (): Promise<RateLimitResult> => ({
    success: true,
    limit: 0,
    remaining: 0,
    reset: 0,
  }),
};

const MINUTE_LIMIT = Number(process.env.RATE_LIMIT_PER_MINUTE) || 10;
const DAILY_LIMIT = Number(process.env.RATE_LIMIT_PER_DAY) || 100;

function createSlidingWindowLimiter(
  prefix: string,
  limit: number,
  windowMs: number,
) {
  return {
    limit: async (identifier: string): Promise<RateLimitResult> => {
      const clientPromise = getRedisClient();
      if (!clientPromise) return noopRateLimiter.limit();

      const client = await clientPromise;
      const now = Date.now();
      const key = `${prefix}:${identifier}`;
      const member = `${now}-${Math.random().toString(36).slice(2)}`;
      const transaction = client.multi();

      transaction.zRemRangeByScore(key, 0, now - windowMs);
      transaction.zAdd(key, { score: now, value: member });
      transaction.zCard(key);
      transaction.pExpire(key, windowMs);

      const results = await transaction.exec();
      const total = Number(results?.[2] ?? 0);
      const remaining = Math.max(limit - total, 0);

      return {
        success: total <= limit,
        limit,
        remaining,
        reset: now + windowMs,
      };
    },
  };
}

function createFixedWindowLimiter(
  prefix: string,
  limit: number,
  windowSeconds: number,
) {
  return {
    limit: async (identifier: string): Promise<RateLimitResult> => {
      const clientPromise = getRedisClient();
      if (!clientPromise) return noopRateLimiter.limit();

      const client = await clientPromise;
      const key = `${prefix}:${identifier}`;
      const total = await client.incr(key);

      if (total === 1) {
        await client.expire(key, windowSeconds);
      }

      const ttl = await client.ttl(key);
      const remaining = Math.max(limit - total, 0);

      return {
        success: total <= limit,
        limit,
        remaining,
        reset: Date.now() + Math.max(ttl, 0) * 1000,
      };
    },
  };
}

export const minuteRateLimit = createSlidingWindowLimiter(
  "ratelimit:react-email:minute",
  MINUTE_LIMIT,
  60_000,
);

export const dailyRateLimit = createFixedWindowLimiter(
  "ratelimit:react-email:daily",
  DAILY_LIMIT,
  86_400,
);
