/**
 * Lightweight Redis cache layer for analytics endpoints.
 *
 * Falls back to a no-op when Redis is unavailable (Vercel serverless)
 * so the app never crashes — just skips caching.
 */
const Redis = require("ioredis");
const config = require("./index");
const logger = require("./logger");

let redis = null;

const CACHE_PREFIX = "sdn:cache:";
const DEFAULT_TTL = 300; // 5 minutes

function getRedis() {
  if (redis) return redis;

  try {
    const url = config.redis?.url;
    if (!url) return null;

    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) return null;
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
      connectTimeout: 3000,
    });

    redis.on("error", (err) => {
      logger.warn(`Redis cache error (non-fatal): ${err.message}`);
    });

    redis.connect().catch(() => {
      redis = null;
    });

    return redis;
  } catch {
    return null;
  }
}

/**
 * Get a cached value by key. Returns null on miss or Redis unavailable.
 */
async function cacheGet(key) {
  try {
    const r = getRedis();
    if (!r) return null;
    const val = await r.get(CACHE_PREFIX + key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with optional TTL in seconds.
 */
async function cacheSet(key, value, ttl = DEFAULT_TTL) {
  try {
    const r = getRedis();
    if (!r) return;
    await r.set(CACHE_PREFIX + key, JSON.stringify(value), "EX", ttl);
  } catch {
    // Silently ignore cache write failures
  }
}

/**
 * Invalidate a cache key.
 */
async function cacheDel(key) {
  try {
    const r = getRedis();
    if (!r) return;
    await r.del(CACHE_PREFIX + key);
  } catch {
    // Silently ignore
  }
}

/**
 * Cache-through helper: returns cached data or calls `fetchFn`, caches result.
 */
async function cacheThrough(key, fetchFn, ttl = DEFAULT_TTL) {
  const cached = await cacheGet(key);
  if (cached) return cached;
  const fresh = await fetchFn();
  await cacheSet(key, fresh, ttl);
  return fresh;
}

module.exports = { cacheGet, cacheSet, cacheDel, cacheThrough };
