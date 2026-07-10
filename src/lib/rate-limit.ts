// ============================================================
// Rate Limiting — In-memory sliding window
// ============================================================

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 600000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 300000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  login: { maxRequests: 5, windowMs: 10 * 60 * 1000 } as RateLimitConfig,    // 5 per 10 mins (Blueprint §19)
  otp: { maxRequests: 3, windowMs: 5 * 60 * 1000 } as RateLimitConfig,       // 3 per 5 mins (Blueprint §19)
  verify: { maxRequests: 5, windowMs: 10 * 60 * 1000 } as RateLimitConfig,   // 5 per 10 mins (Blueprint §19)
  vote: { maxRequests: 1, windowMs: 60 * 60 * 1000 } as RateLimitConfig,     // 1 submission only (Blueprint §19)
  admin: { maxRequests: 10, windowMs: 5 * 60 * 1000 } as RateLimitConfig,    // 10 per 5 mins
} as const;

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const entry = store.get(key) || { timestamps: [] };

  // Filter timestamps within window
  entry.timestamps = entry.timestamps.filter(
    (t) => now - t < config.windowMs
  );

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = config.windowMs - (now - oldestInWindow);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetMs: 0,
  };
}

export function getRateLimitKey(
  prefix: string,
  identifier: string
): string {
  return `${prefix}:${identifier}`;
}

/**
 * Clear all rate-limit entries whose key starts with the given prefix.
 * Used when admin resets votes so students can vote again.
 */
export function clearRateLimitByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(`${prefix}:`)) {
      store.delete(key);
    }
  }
}
