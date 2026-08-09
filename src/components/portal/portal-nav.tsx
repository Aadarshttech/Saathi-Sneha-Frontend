'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, FlaskConical, Pill, User, LogOut, Menu, X, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/portal/dashboard',   label: 'Home',        icon: LayoutDashboard },
  { href: '/portal/visits',      label: 'Visits',      icon: Calendar },
  { href: '/portal/labs',        label: 'Lab Results', icon: FlaskConical },
  { href: '/portal/medications', label: 'Medications', icon: Pill },
  { href: '/portal/billing',     label: 'Billing',     icon: Receipt },
  { href: '/portal/profile',     label: 'Profile',     icon: User },
]

interface PatientOption {
  id:        string
  firstName: string
  lastName:  string
}

interface PortalNavProps {
  firstName:       string
  lastName:        string
  patients?:       PatientOption[]
  currentPatientId?: string | null
}

export default function PortalNav({ firstName, lastName, patients = [], currentPatientId }: PortalNavProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen]     = useState(false)
  const [switching, setSwitching] = useState(false)

  async function logout() {
    await fetch('/api/portal/auth/logout', { method: 'POST' })
    router.push('/portal')
    router.refresh()
  }

  async function switchPatient(patientId: string) {
    if (patientId === currentPatientId) return
    setSwitching(true)
    try {
      const res = await fetch('/api/portal/select-patient', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ patientId }),
      })
      if (res.ok) {
        router.push('/portal/dashboard')
        router.refresh()
      }
    } finally {
      setSwitching(false)
    }
  }

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center h-14 gap-3">
          <Link href="/portal/dashboard" className="flex items-center gap-1 shrink-0 mr-2">
            <Image src="/logo.png" alt="Saathi Sneha Care" width={36} height={36} className="object-contain" />
            <div className="leading-none hidden sm:block">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-[#2a9d8f] text-lg tracking-tight">Saathi</span>
                <span className="text-[11px] font-semibold text-[#4a7c6b] [word-spacing:-0.1em]">Sneha Care</span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-[#6aab5e] text-[7px]">♥</span>
                <span className="text-[9px] text-[#6aab5e] font-medium italic">Care that feels like family</span>
                <span className="text-[#6aab5e] text-[7px]">♥</span>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap',
                    active
                      ? 'bg-red-50 text-brand-red font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {patients.length > 1 && (
              <select
                value={currentPatientId ?? ''}
                onChange={e => switchPatient(e.target.value)}
                disabled={switching}
                className="hidden sm:block text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 disabled:opacity-60"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>Caring for: {p.firstName} {p.lastName}</option>
                ))}
              </select>
            )}

            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
              <div className="w-7 h-7 rounded-full bg-brand-red text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span>{firstName}</span>
            </div>

            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>

            <button
              className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-gray-100 py-2 pb-3">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-800">{firstName} {lastName}</span>
            </div>
            {patients.length > 1 && (
              <select
                value={currentPatientId ?? ''}
                onChange={e => switchPatient(e.target.value)}
                disabled={switching}
                className="w-[calc(100%-0.5rem)] mx-1 mb-2 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 disabled:opacity-60"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>Caring for: {p.firstName} {p.lastName}</option>
                ))}
              </select>
            )}
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-1',
                    active ? 'bg-red-50 text-brand-red font-medium' : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 rounded-lg mx-1 hover:bg-red-50 w-[calc(100%-0.5rem)]"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
