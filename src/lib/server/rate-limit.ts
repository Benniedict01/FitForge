// Best-effort, per-instance protection. Use a shared store (e.g. Redis) for a
// horizontally scaled production deployment; this intentionally adds no service dependency.
const bucket = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 12;

export function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (bucket.size > 2_000) {
    for (const [ip, value] of bucket) if (value.resetAt <= now) bucket.delete(ip);
    // Bound memory even if untrusted forwarded addresses produce many keys.
    if (bucket.size > 2_000) bucket.clear();
  }
  const current = bucket.get(key);
  if (!current || current.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  return {
    allowed: current.count <= LIMIT,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}
