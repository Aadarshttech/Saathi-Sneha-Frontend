interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>()

// Purge expired entries every 10 minutes to avoid memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 10 * 60 * 1000)

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  entry.count++
  store.set(key, entry)
  const remaining = Math.max(0, limit - entry.count)
  return { allowed: entry.count <= limit, remaining }
}

export function getIp(req: Request): string {
  const h = req.headers as Headers
  // Cloudflare sets CF-Connecting-IP to the real client IP and it cannot be spoofed
  const cf = h.get('cf-connecting-ip')
  if (cf) return cf.trim()
  // Behind a trusted reverse proxy (nginx), take the last hop of x-forwarded-for
  // (rightmost = added by our proxy, not client-controlled)
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',')
    return parts[parts.length - 1].trim()
  }
  return 'unknown'
}
