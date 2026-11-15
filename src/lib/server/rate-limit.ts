type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfter: number } {
  const normalizedKey = key.slice(0, 120) || "unknown";
  let bucket = buckets.get(normalizedKey);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [entryKey, entry] of buckets) if (entry.resetAt <= now) buckets.delete(entryKey);
      if (buckets.size >= MAX_BUCKETS) {
        const oldest = buckets.keys().next().value;
        if (oldest) buckets.delete(oldest);
      }
    }
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(normalizedKey, bucket);
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= MAX_REQUESTS_PER_WINDOW,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
