import { headers } from 'next/headers';

type RateLimitRecord = {
  timestamps: number[];
};

// Global in-memory map for rate limiting per process instance
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
 * In-memory sliding window rate limiter
 * @param actionName Name of the action (e.g. 'login', 'register')
 * @param maxAttempts Maximum allowed attempts in the window (default 5)
 * @param windowMs Time window in milliseconds (default 60,000ms = 1 minute)
 */
export async function checkRateLimit(
  actionName: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const ip = await getClientIp();
  const key = `${actionName}:${ip}`;
  const now = Date.now();

  let record = rateLimitMap.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Filter out timestamps older than the sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestTimestamp);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(Math.max(1000, retryAfterMs) / 1000),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxAttempts - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}
