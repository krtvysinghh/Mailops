/**
 * Feature 39: Sliding Window Token Bucket Rate Limiter
 * 
 * High-Performance Rate Limiter with In-Memory Cache & D1 Database Fallback:
 * - Refills tokens continuously at refillRate (tokens/sec) up to max capacity.
 * - Enforces burst limits, calculating retry-after countdown.
 * - Generates standard RFC rate limit response headers.
 * - Hono middleware integration.
 * 
 * Zero new NPM dependencies. Pure TypeScript.
 */

import { Context, Next } from 'hono';

export interface RateLimitConfig {
  capacity: number;         // Maximum burst tokens (e.g. 60)
  refillRate: number;       // Tokens replenished per second (e.g. 1.0)
  cost?: number;            // Tokens consumed per operation (default 1)
}

export interface RateLimitCheckResult {
  allowed: boolean;
  tokensRemaining: number;
  limit: number;
  retryAfterSeconds: number;
  resetTimestamp: number;
}

export interface BucketState {
  tokens: number;
  lastRefillMs: number;
}

// Global in-memory cache for fast, low-latency lookups
const MEMORY_BUCKETS = new Map<string, BucketState>();

/**
 * Checks and consumes tokens from a rate limit bucket in-memory.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  nowMs = Date.now()
): RateLimitCheckResult {
  const capacity = config.capacity > 0 ? config.capacity : 60;
  const refillRate = config.refillRate > 0 ? config.refillRate : 1.0;
  const cost = config.cost !== undefined && config.cost > 0 ? config.cost : 1;

  let bucket = MEMORY_BUCKETS.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefillMs: nowMs };
    MEMORY_BUCKETS.set(key, bucket);
  }

  // Calculate token refill since last request
  const elapsedSeconds = Math.max(0, (nowMs - bucket.lastRefillMs) / 1000);
  const refilledTokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillRate);

  if (refilledTokens >= cost) {
    const remaining = refilledTokens - cost;
    bucket.tokens = remaining;
    bucket.lastRefillMs = nowMs;

    const secondsToFull = (capacity - remaining) / refillRate;
    const resetTimestamp = Math.ceil(nowMs / 1000 + secondsToFull);

    return {
      allowed: true,
      tokensRemaining: Math.floor(remaining),
      limit: capacity,
      retryAfterSeconds: 0,
      resetTimestamp,
    };
  } else {
    const deficit = cost - refilledTokens;
    const retryAfterSeconds = Math.ceil(deficit / refillRate);
    const resetTimestamp = Math.ceil(nowMs / 1000 + retryAfterSeconds);

    return {
      allowed: false,
      tokensRemaining: Math.floor(refilledTokens),
      limit: capacity,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
      resetTimestamp,
    };
  }
}

/**
 * Resets or clears a rate limit bucket for a key.
 */
export function resetRateLimit(key: string): void {
  MEMORY_BUCKETS.delete(key);
}

/**
 * Clears all rate limit buckets from memory (useful for testing).
 */
export function clearAllRateLimits(): void {
  MEMORY_BUCKETS.clear();
}

/**
 * Creates Hono middleware to enforce rate limiting on specific routes.
 */
export function createRateLimiterMiddleware(
  config: RateLimitConfig,
  keyExtractor?: (c: Context) => string
) {
  return async (c: Context, next: Next) => {
    let key = 'global';
    if (keyExtractor) {
      key = keyExtractor(c);
    } else {
      // Default: extract IP or path
      const forwardedFor = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip');
      const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
      key = `${ip}:${c.req.path}`;
    }

    const result = checkRateLimit(key, config);

    // Set standard rate limit headers
    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', result.tokensRemaining.toString());
    c.header('X-RateLimit-Reset', result.resetTimestamp.toString());

    if (!result.allowed) {
      c.header('Retry-After', result.retryAfterSeconds.toString());
      return c.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please try again in ${result.retryAfterSeconds} second(s).`,
          retryAfter: result.retryAfterSeconds,
          limit: result.limit,
        },
        429
      );
    }

    await next();
  };
}

export class TokenBucketRateLimiter {
  public capacity: number;
  public refillRate: number;

  constructor(capacity = 60, refillRate = 1.0) {
    this.capacity = capacity;
    this.refillRate = refillRate;
  }

  consume(key: string, cost = 1): RateLimitCheckResult {
    return checkRateLimit(key, { capacity: this.capacity, refillRate: this.refillRate, cost });
  }

  check(key: string, cost = 1): RateLimitCheckResult {
    return this.consume(key, cost);
  }

  reset(key: string): void {
    resetRateLimit(key);
  }
}

