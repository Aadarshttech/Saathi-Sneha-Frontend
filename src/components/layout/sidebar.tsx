'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Users, Calendar, Stethoscope, Receipt,
  Settings, ChevronRight, FlaskConical, CalendarDays, UserCheck, User, ExternalLink, KeyRound, UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CLINICAL_ITEMS = [
  { href: '/patients',  label: 'Patients',  icon: Users },
  { href: '/visits',    label: 'Visits',    icon: Calendar },
  { href: '/service-catalog',  label: 'Services',  icon: Stethoscope },
  { href: '/providers', label: 'Providers', icon: UserCheck },
  { href: '/nurses',    label: 'Nurses',    icon: User },
  { href: '/lab',       label: 'Lab',       icon: FlaskConical },
]

const ADMIN_ITEMS = [
  { href: '/scheduling',  label: 'Scheduling',   icon: CalendarDays },
  { href: '/billing',     label: 'Billing',       icon: Receipt },
  { href: '/accounts',    label: 'Enrollers',     icon: UserCog },
  { href: '/credentials', label: 'Credentials',   icon: KeyRound },
]

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  user?: { firstName: string; lastName: string; role: string; branchName?: string | null }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'A'
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Admin'
  const displayRole = user
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Admin'
  const displayBranch = user?.branchName ?? 'Sahayata EMR'

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-brand-dark text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-1 px-4 py-4 border-b border-white/10">
        <Image src="/logo.png" alt="Saathi Sneha Care" width={40} height={40} className="object-contain" style={{ mixBlendMode: 'screen' }} />
        <div className="leading-none">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-[#2a9d8f] text-base tracking-tight">Saathi</span>
            <span className="text-[10px] font-semibold text-[#4a7c6b]">Sneha Care</span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-[#6aab5e] text-[6px]">♥</span>
            <span className="text-[8px] text-[#6aab5e] font-medium italic">Care that feels like family</span>
            <span className="text-[#6aab5e] text-[6px]">♥</span>
          </div>
        </div>
      </div>

      {/* Logged-in user */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-brand-red/80 flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{displayName}</p>
            <p className="text-[10px] text-white/40 truncate">{displayRole} · {displayBranch}</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        <div className="space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Clinical</p>
          {CLINICAL_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-brand-red text-white font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-60" />}
              </Link>
            )
          })}
        </div>

        <div className="space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Administration</p>
          {ADMIN_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-brand-red text-white font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-60" />}
              </Link>
            )
          })}
        </div>

        <div className="space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Portals</p>
          {[
            { href: '/portal',          label: 'Patient View' },
            { href: '/provider-portal', label: 'Provider View' },
            { href: '/lab-portal',      label: 'Lab View' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/8 transition-colors"
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  )
}
