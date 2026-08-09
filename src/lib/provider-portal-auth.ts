import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

export const PROVIDER_PORTAL_COOKIE = 'sahayata_provider_portal'

const SECRET = process.env.SESSION_SECRET ?? 'dev-only-secret-change-in-production'

export interface ProviderSession {
  userId:    string
  firstName: string
  lastName:  string
  role:      string
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function encodeProviderSession(session: ProviderSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function getProviderSession(): ProviderSession | null {
  const raw = cookies().get(PROVIDER_PORTAL_COOKIE)?.value
  if (!raw) return null
  try {
    const dot = raw.lastIndexOf('.')
    if (dot === -1) return null
    const payload = raw.slice(0, dot)
    const sig     = raw.slice(dot + 1)
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as ProviderSession
  } catch {
    return null
  }
}
