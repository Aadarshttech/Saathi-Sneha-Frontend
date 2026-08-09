import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import bcrypt from 'bcryptjs'

export const PORTAL_COOKIE = 'sahayata_portal'

const SECRET = process.env.SESSION_SECRET ?? 'dev-only-secret-change-in-production'

export interface PortalSession {
  caregiverAccountId: string
  patientId:          string | null
  firstName:          string
  lastName:           string
}

function sign(payload: string): string {
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET env var is required in production')
  }
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function encodeSession(session: PortalSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function getPortalSession(): PortalSession | null {
  const raw = cookies().get(PORTAL_COOKIE)?.value
  if (!raw) return null
  try {
    const dot = raw.lastIndexOf('.')
    if (dot === -1) return null
    const payload = raw.slice(0, dot)
    const sig     = raw.slice(dot + 1)
    const expected = sign(payload)
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as PortalSession
  } catch {
    return null
  }
}

export function signToken(payload: PortalSession): string {
  return encodeSession(payload)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return bcrypt.compare(password, stored)
}
