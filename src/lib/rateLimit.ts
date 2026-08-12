import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import RateLimit from '@/models/RateLimit';

type RateLimitRecord = {
  timestamps: number[];
};

// Global in-memory map for rate limiting (fallback for local development)
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Helper to extract client IP from Next.js request headers
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = headerList.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // Fallback if headers() context is unavailable
  }
  return '127.0.0.1';
}

/**
 * 3-Tier Multi-Persistent Sliding Window Rate Limiter
 * 1. Upstash Redis REST API (Primary for Serverless Edge/Node if env configured)
 * 2. MongoDB RateLimit Collection (Secondary for persistent DB storage across serverless lambdas)
 * 3. In-Memory Map (Fallback for offline local development)
 */
export async function checkRateLimit(
  actionName: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number; attemptCount: number }> {
  const ip = await getClientIp();
  const key = `${actionName}:${ip}`;
  const now = Date.now();

  // Tier 1: Upstash Redis REST API (zero-dependency HTTP fetch)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    try {
      return await checkUpstashRateLimit(key, maxAttempts, windowMs, upstashUrl, upstashToken);
    } catch (err) {
      console.warn('[RATE_LIMIT] Upstash Redis check failed, falling back to MongoDB/Memory:', err);
    }
  }

  // Tier 2: MongoDB Persistent Rate Limit Storage
  try {
    await dbConnect();
    const expiresAt = new Date(now + windowMs);

    // Find existing rate limit doc or create new
    const doc = await RateLimit.findOne({ key });
    const timestamps: number[] = doc
      ? doc.timestamps.map((t: Date) => new Date(t).getTime()).filter((t: number) => now - t < windowMs)
      : [];

    const attemptCount = timestamps.length;
    if (attemptCount >= maxAttempts) {
      const oldestTimestamp = timestamps[0] || now;
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(Math.max(1000, retryAfterMs) / 1000),
        attemptCount,
      };
    }

    timestamps.push(now);
    await RateLimit.findOneAndUpdate(
      { key },
      {
        $set: {
          timestamps: timestamps.map((t) => new Date(t)),
          expiresAt,
        },
      },
      { upsert: true, new: true }
    );

    return {
      allowed: true,
      remaining: maxAttempts - timestamps.length,
      retryAfterSeconds: 0,
      attemptCount: timestamps.length,
    };
  } catch (err) {
    // Tier 3: In-Memory Sliding Window Fallback
    return checkInMemoryRateLimit(key, now, maxAttempts, windowMs);
  }
}

/**
 * Gets current attempt count for a specific action and client IP within sliding window
 */
export async function getRateLimitAttempts(
  actionName: string,
  windowMs: number = 60 * 1000
): Promise<number> {
  const ip = await getClientIp();
  const key = `${actionName}:${ip}`;
  const now = Date.now();

  try {
    await dbConnect();
    const doc = await RateLimit.findOne({ key });
    if (!doc) return 0;
    const activeTimestamps = doc.timestamps.filter((t: Date) => now - new Date(t).getTime() < windowMs);
    return activeTimestamps.length;
  } catch {
    const record = rateLimitMap.get(key);
    if (!record) return 0;
    return record.timestamps.filter((t) => now - t < windowMs).length;
  }
}

/**
 * Upstash Redis REST Rate Limiter implementation using sliding window log
 */
async function checkUpstashRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  url: string,
  token: string
) {
  const now = Date.now();
  const clearBefore = now - windowMs;

  const headers = { Authorization: `Bearer ${token}` };

  // Pipeline command to ZREMRANGEBYSCORE, ZADD, ZCARD, EXPIRE
  const pipelineRes = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['ZREMRANGEBYSCORE', key, 0, clearBefore],
      ['ZADD', key, now, now.toString()],
      ['ZCARD', key],
      ['EXPIRE', key, Math.ceil(windowMs / 1000)],
    ]),
  });

  const results = await pipelineRes.json();
  const count = results?.[2]?.result || 1;

  if (count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      attemptCount: count,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - count,
    retryAfterSeconds: 0,
    attemptCount: count,
  };
}

/**
 * In-memory fallback rate limiter logic
 */
function checkInMemoryRateLimit(
  key: string,
  now: number,
  maxAttempts: number,
  windowMs: number
) {
  let record = rateLimitMap.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestTimestamp);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(Math.max(1000, retryAfterMs) / 1000),
      attemptCount: record.timestamps.length,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxAttempts - record.timestamps.length,
    retryAfterSeconds: 0,
    attemptCount: record.timestamps.length,
  };
}
