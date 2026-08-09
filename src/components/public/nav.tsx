'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, MessageCircle, Facebook, Instagram, Stethoscope, HeartHandshake, UsersRound, Phone, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WHATSAPP_NUMBER, FACEBOOK_PAGE_USERNAME, INSTAGRAM_USERNAME } from '@/lib/constants'

const NAV_LINKS = [
  { href: '/services', label: 'Services',     icon: Stethoscope },
  { href: '/plans',    label: 'Care Options', icon: HeartHandshake },
  { href: '/about',    label: 'About Us',     icon: UsersRound },
]

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <Image src="/logo.png" alt="Saathi Sneha Care" width={52} height={52} className="object-contain" />
            <div className="leading-none">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-[#2a9d8f] text-2xl tracking-tight">Saathi</span>
                <span className="text-[13px] font-semibold tracking-[0.08em] text-[#4a7c6b] [word-spacing:-0.1em]">Sneha Care</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#6aab5e] text-[8px]">♥</span>
                <span className="text-[11px] text-[#6aab5e] font-medium italic">Care that feels like family</span>
                <span className="text-[#6aab5e] text-[8px]">♥</span>
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'text-brand-red bg-red-50'
                    : 'text-gray-600 hover:text-brand-dark hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact" className="flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-dark transition-colors">
              <Phone className="w-4 h-4" />
              FREE Consultation
            </Link>
            <Link href="/portal/login" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors">
              <LogIn className="w-4 h-4" />
              Log In
            </Link>
            <div className="flex items-center gap-1">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="p-1.5 rounded-lg text-gray-500 hover:text-brand-red hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={`https://m.me/${FACEBOOK_PAGE_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on Messenger"
                className="p-1.5 rounded-lg text-gray-500 hover:text-brand-red hover:bg-gray-50 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={`https://ig.me/m/${INSTAGRAM_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on Instagram"
                className="p-1.5 rounded-lg text-gray-500 hover:text-brand-red hover:bg-gray-50 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1 pb-4">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === href ? 'text-brand-red bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2 px-1">
              <Link href="/contact" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark transition-colors">
                <Phone className="w-4 h-4" />
                FREE Consultation
              </Link>
              <Link href="/portal/login" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <LogIn className="w-4 h-4" />
                Log In
              </Link>
              <div className="flex items-center justify-center gap-4 pt-1">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on WhatsApp"
                  className="p-2 rounded-lg text-gray-500 hover:text-brand-red hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a
                  href={`https://m.me/${FACEBOOK_PAGE_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on Messenger"
                  className="p-2 rounded-lg text-gray-500 hover:text-brand-red hover:bg-gray-50 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href={`https://ig.me/m/${INSTAGRAM_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on Instagram"
                  className="p-2 rounded-lg text-gray-500 hover:text-brand-red hover:bg-gray-50 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
