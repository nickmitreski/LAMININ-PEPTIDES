/**
 * Simple in-memory rate limiter for Edge Functions.
 * For production: use Redis or Supabase Edge Functions rate limit policies.
 *
 * Usage:
 * ```typescript
 * const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 10 });
 * if (!limiter.check(clientIp)) {
 *   return jsonResponse({ ok: false, error: 'Rate limit exceeded' }, 429);
 * }
 * ```
 */

interface RateLimiterConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Creates a rate limiter with in-memory storage.
 * Note: This is per-isolate and will reset on function cold starts.
 * For distributed rate limiting, use Redis or KV store.
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const storage = new Map<string, RateLimitEntry>();

  // Clean up expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of storage.entries()) {
      if (now > entry.resetAt) {
        storage.delete(key);
      }
    }
  }, 60000);

  return {
    /**
     * Check if the identifier (IP, user ID, etc.) is within rate limit.
     * Returns true if allowed, false if rate limit exceeded.
     */
    check(identifier: string): boolean {
      const now = Date.now();
      const entry = storage.get(identifier);

      if (!entry || now > entry.resetAt) {
        // New window
        storage.set(identifier, {
          count: 1,
          resetAt: now + config.windowMs,
        });
        return true;
      }

      if (entry.count >= config.maxRequests) {
        // Rate limit exceeded
        return false;
      }

      // Increment count
      entry.count++;
      storage.set(identifier, entry);
      return true;
    },

    /**
     * Get remaining requests for an identifier.
     */
    remaining(identifier: string): number {
      const entry = storage.get(identifier);
      if (!entry || Date.now() > entry.resetAt) {
        return config.maxRequests;
      }
      return Math.max(0, config.maxRequests - entry.count);
    },

    /**
     * Reset rate limit for an identifier.
     */
    reset(identifier: string): void {
      storage.delete(identifier);
    },
  };
}

/**
 * Extract client IP from request, handling common proxy headers.
 */
export function getClientIp(req: Request): string {
  // Check common proxy headers (Cloudflare, Vercel, etc.)
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can be: "client, proxy1, proxy2"
    return xForwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback (won't work well in production behind proxies)
  return 'unknown';
}

/**
 * Pre-configured rate limiter for checkout operations.
 * 10 requests per 5 minutes per IP.
 */
export const checkoutRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10,
});

/**
 * Pre-configured rate limiter for webhook operations.
 * 30 requests per minute per IP.
 */
export const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
});
