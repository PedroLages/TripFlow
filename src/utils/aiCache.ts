/**
 * AI Response Caching and Rate Limiting Utility
 *
 * Features:
 * - In-memory cache with TTL for Gemini responses
 * - Rate limiting to prevent quota exhaustion
 * - Automatic cache key generation from prompts
 */

interface CacheEntry {
  response: string;
  timestamp: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class AICache {
  private cache = new Map<string, CacheEntry>();
  private rateLimits = new Map<string, RateLimitEntry>();

  // Cache TTL in milliseconds (default: 1 hour)
  private cacheTTL = 60 * 60 * 1000;

  // Rate limit: max requests per time window
  private maxRequests = 20; // 20 requests
  private timeWindow = 60 * 1000; // per minute

  /**
   * Generate a cache key from request parameters
   */
  private generateKey(prompt: string, model?: string, config?: any): string {
    const configStr = config ? JSON.stringify(config) : '';
    return `${model || 'default'}:${prompt}:${configStr}`;
  }

  /**
   * Check if request is rate limited
   */
  isRateLimited(userId: string = 'default'): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(userId);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.rateLimits.set(userId, {
        count: 1,
        resetTime: now + this.timeWindow
      });
      return false;
    }

    if (entry.count >= this.maxRequests) {
      return true; // Rate limited
    }

    // Increment count
    entry.count++;
    return false;
  }

  /**
   * Get time until rate limit resets (in seconds)
   */
  getResetTime(userId: string = 'default'): number {
    const entry = this.rateLimits.get(userId);
    if (!entry) return 0;

    const now = Date.now();
    if (now > entry.resetTime) return 0;

    return Math.ceil((entry.resetTime - now) / 1000);
  }

  /**
   * Get cached response if available and not expired
   */
  get(prompt: string, model?: string, config?: any): string | null {
    const key = this.generateKey(prompt, model, config);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    console.log('[AICache] Cache hit for:', prompt.substring(0, 50) + '...');
    return entry.response;
  }

  /**
   * Store response in cache
   */
  set(prompt: string, response: string, model?: string, config?: any): void {
    const key = this.generateKey(prompt, model, config);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
    console.log('[AICache] Cached response for:', prompt.substring(0, 50) + '...');
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    console.log('[AICache] Cache cleared');
  }

  /**
   * Clear expired entries (run periodically)
   */
  clearExpired(): void {
    const now = Date.now();
    let clearedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.cache.delete(key);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      console.log(`[AICache] Cleared ${clearedCount} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; ttl: number; hitRate?: number } {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL,
    };
  }
}

// Export singleton instance
export const aiCache = new AICache();

// Auto-clear expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => aiCache.clearExpired(), 5 * 60 * 1000);
}
