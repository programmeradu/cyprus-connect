/**
 * Simple in-memory rate limiter
 * For production with multiple instances, consider using Redis/Upstash
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per interval
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // AI generation endpoints - expensive operations
  AI_GENERATION: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  // General API endpoints
  API_DEFAULT: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Authentication endpoints
  AUTH: {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // File uploads
  UPLOAD: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
  },
  // Report generation
  REPORTS: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 reports per minute
  },
} as const;

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and limit info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = `${identifier}`;

  let entry = rateLimitStore.get(key);

  // Initialize or reset if expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.interval,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment request count
  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getRequestIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if available
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    ...(result.retryAfter && { 'Retry-After': String(result.retryAfter) }),
  };
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withRateLimit(
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT
) {
  return async (
    request: Request,
    handler: () => Promise<Response>
  ): Promise<Response> => {
    // Get user ID from auth header if available
    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      // Extract user info from token if needed
      // For now, use the identifier from request
    }

    const identifier = getRequestIdentifier(request, userId);
    const result = checkRateLimit(identifier, config);

    // Add rate limit headers to response
    const headers = createRateLimitHeaders(result);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );
    }

    // Execute the handler
    const response = await handler();

    // Add rate limit headers to successful response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
