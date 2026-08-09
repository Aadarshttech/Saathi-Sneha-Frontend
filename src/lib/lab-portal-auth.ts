import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

export const LAB_PORTAL_COOKIE = 'sahayata_lab_portal'

const SECRET = process.env.SESSION_SECRET ?? 'dev-only-secret-change-in-production'

export interface LabSession {
  userId:    string
  firstName: string
  lastName:  string
  role:      string
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function encodeLabSession(session: LabSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function getLabSession(): LabSession | null {
  const raw = cookies().get(LAB_PORTAL_COOKIE)?.value
  if (!raw) return null
  try {
    const dot = raw.lastIndexOf('.')
    if (dot === -1) return null
    const payload = raw.slice(0, dot)
    const sig     = raw.slice(dot + 1)
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as LabSession
  } catch {
    return null
  }
}
