/**
 * Rate Limiting Module
 * 
 * Prevents Denial of Service (DoS) attacks on upload endpoints by limiting:
 * - Requests per IP address
 * - Requests per user (if authenticated)
 * - Total bytes uploaded
 * 
 * @version 1.0.0
 * @phase 44
 */

/**
 * Rate limit store: tracks requests by identifier (IP/user)
 * Format: { identifier: { count: number; bytes: number; resetTime: number } }
 */
class RateLimitStore {
  private store: Map<string, { count: number; bytes: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  /**
   * Record a request/upload
   */
  record(identifier: string, bytesUploaded: number, windowMs: number = 3600000): void {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      this.store.set(identifier, {
        count: 1,
        bytes: bytesUploaded,
        resetTime: now + windowMs,
      });
    } else {
      // Existing window
      entry.count++;
      entry.bytes += bytesUploaded;
    }
  }

  /**
   * Check if identifier is over limit
   */
  isOverLimit(identifier: string, maxRequests: number, maxBytes: number): boolean {
    const entry = this.store.get(identifier);
    if (!entry) return false;

    const now = Date.now();
    if (now > entry.resetTime) {
      // Window expired
      this.store.delete(identifier);
      return false;
    }

    return entry.count > maxRequests || entry.bytes > maxBytes;
  }

  /**
   * Get current usage
   */
  getUsage(identifier: string): { count: number; bytes: number; remaining: number } {
    const entry = this.store.get(identifier);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return { count: 0, bytes: 0, remaining: 0 };
    }

    return {
      count: entry.count,
      bytes: entry.bytes,
      remaining: entry.resetTime - now,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Shutdown cleanup interval
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
let store: RateLimitStore | null = null;

/**
 * Initialize rate limit store (call once at startup)
 */
export function initializeRateLimiting(): void {
  if (!store) {
    store = new RateLimitStore();
  }
}

/**
 * Shutdown rate limiting (call on graceful shutdown)
 */
export function shutdownRateLimiting(): void {
  if (store) {
    store.shutdown();
    store = null;
  }
}

/**
 * Get client identifier (IP address or user ID if authenticated)
 */
export function getClientIdentifier(req: any): string {
  // Try to get user ID first (if authenticated)
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }

  // Fall back to IP address
  const ip =
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs?: number; // Time window in milliseconds (default: 1 hour)
  maxRequests?: number; // Max requests per window
  maxBytes?: number; // Max total bytes per window
}

export interface RateLimitResult {
  allowed: boolean;
  identifier: string;
  current: { count: number; bytes: number };
  limit: { maxRequests: number; maxBytes: number };
  resetTime?: Date;
  message?: string;
}

/**
 * Check if request is within rate limits
 */
export function checkRateLimit(req: any, config: RateLimitConfig = {}): RateLimitResult {
  if (!store) {
    initializeRateLimiting();
  }

  const {
    windowMs = 3600000, // 1 hour
    maxRequests = 100, // 100 uploads per hour
    maxBytes = 5 * 1024 * 1024 * 1024, // 5GB per hour
  } = config;

  const identifier = getClientIdentifier(req);
  const usage = store!.getUsage(identifier);
  const isOverLimit = store!.isOverLimit(identifier, maxRequests, maxBytes);

  const result: RateLimitResult = {
    allowed: !isOverLimit,
    identifier,
    current: { count: usage.count, bytes: usage.bytes },
    limit: { maxRequests, maxBytes },
  };

  if (isOverLimit) {
    if (usage.count > maxRequests) {
      result.message = `Too many upload requests. Limit: ${maxRequests} per hour. Reset in ${Math.ceil(usage.remaining / 1000)}s`;
    } else {
      result.message = `Total upload size exceeded. Limit: ${(maxBytes / 1024 / 1024 / 1024).toFixed(1)}GB per hour. Reset in ${Math.ceil(usage.remaining / 1000)}s`;
    }
    result.resetTime = new Date(Date.now() + usage.remaining);
  }

  return result;
}

/**
 * Record upload in rate limit store
 */
export function recordUpload(req: any, bytesUploaded: number, config: RateLimitConfig = {}): void {
  if (!store) {
    initializeRateLimiting();
  }

  const { windowMs = 3600000 } = config;
  const identifier = getClientIdentifier(req);
  store!.record(identifier, bytesUploaded, windowMs);
}

/**
 * Get detailed rate limit stats (for monitoring/diagnostics)
 */
export function getRateLimitStats(req: any): { identifier: string; usage: { count: number; bytes: number; remaining: number } } {
  if (!store) {
    initializeRateLimiting();
  }

  const identifier = getClientIdentifier(req);
  const usage = store!.getUsage(identifier);

  return { identifier, usage };
}
