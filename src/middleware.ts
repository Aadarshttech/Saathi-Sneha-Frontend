import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PORTAL_COOKIE          = 'sahayata_portal'
const PROVIDER_PORTAL_COOKIE = 'sahayata_provider_portal'
const LAB_PORTAL_COOKIE      = 'sahayata_lab_portal'
const ADMIN_COOKIE           = 'sahayata_admin'

// API routes that are intentionally public (auth endpoints + contact form + Stripe webhook,
// which authenticates itself via signature verification rather than a session cookie)
const PUBLIC_API = [
  '/api/portal/auth/login',
  '/api/portal/auth/logout',
  '/api/portal/auth/signup',
  '/api/portal/auth/verify-email',
  '/api/provider-portal/auth/login',
  '/api/provider-portal/auth/logout',
  '/api/lab-portal/auth/login',
  '/api/lab-portal/auth/logout',
  '/api/auth/login',
  '/api/contact',
  '/api/billing/stripe/webhook',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Patient portal — allow only login/signup without a session
  if (pathname.startsWith('/portal') && !pathname.startsWith('/portal/login') && !pathname.startsWith('/portal/signup')) {
    if (!request.cookies.get(PORTAL_COOKIE)?.value) {
      return NextResponse.redirect(new URL('/portal/login', request.url))
    }
  }

  // Provider portal — allow only login without a session
  if (pathname.startsWith('/provider-portal') && !pathname.startsWith('/provider-portal/login')) {
    if (!request.cookies.get(PROVIDER_PORTAL_COOKIE)?.value) {
      return NextResponse.redirect(new URL('/provider-portal/login', request.url))
    }
  }

  // Lab portal — allow only login without a session
  if (pathname.startsWith('/lab-portal') && !pathname.startsWith('/lab-portal/login')) {
    if (!request.cookies.get(LAB_PORTAL_COOKIE)?.value) {
      return NextResponse.redirect(new URL('/lab-portal/login', request.url))
    }
  }

  // API routes — role-aware gate. Each session cookie only grants access to the routes
  // its own portal actually needs; everything else under /api/ (internal staff tooling
  // like /api/patients, /api/staff, /api/users, /api/scheduling, /api/services,
  // /api/invoices, /api/billing/plans) defaults to admin-only. Previously this just
  // checked "does *some* cookie exist," which meant a public caregiver self-signup
  // session was treated as equivalent to internal staff access for every route that
  // didn't separately re-check — this is the fix for that.
  if (pathname.startsWith('/api/') && !PUBLIC_API.some(p => pathname.startsWith(p))) {
    const has = {
      admin:    !!request.cookies.get(ADMIN_COOKIE)?.value,
      portal:   !!request.cookies.get(PORTAL_COOKIE)?.value,
      provider: !!request.cookies.get(PROVIDER_PORTAL_COOKIE)?.value,
      lab:      !!request.cookies.get(LAB_PORTAL_COOKIE)?.value,
    }

    const allowed =
      pathname.startsWith('/api/portal/')          ? (has.portal || has.admin) :
      pathname.startsWith('/api/provider-portal/') ? (has.provider || has.admin) :
      pathname.startsWith('/api/lab-portal/')      ? (has.lab || has.admin) :
      // Provider-portal's visit chart (shared with the admin dashboard) creates visits and
      // saves status/vitals/CGA/completion against them via /api/visits and /api/visits/[id]/*
      (pathname === '/api/visits' || pathname.startsWith('/api/visits/')) ? (has.admin || has.provider) :
      // Lab-portal's result-entry feature posts results directly via this route
      pathname === '/api/lab/results'                ? (has.admin || has.lab) :
      // Provider-portal's shared visit chart adds/updates medications from the CGA section
      /^\/api\/patients\/[^/]+\/medications(\/|$)/.test(pathname) ? (has.admin || has.provider) :
      // Self-service password change, shared by provider-portal and lab-portal
      pathname === '/api/staff/change-password'       ? (has.provider || has.lab) :
      // Caregiver-facing checkout/payment actions
      (pathname.startsWith('/api/billing/stripe/') || pathname.startsWith('/api/billing/khalti/'))
                                                       ? (has.admin || has.portal) :
      has.admin

    if (!allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/provider-portal/:path*',
    '/lab-portal/:path*',
    '/api/:path*',
  ],
}
