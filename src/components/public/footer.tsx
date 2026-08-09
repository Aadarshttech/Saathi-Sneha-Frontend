import Link from 'next/link'
import Image from 'next/image'
import { MapPin, MessageCircle, Facebook, Instagram } from 'lucide-react'
import { WHATSAPP_NUMBER, FACEBOOK_PAGE_USERNAME, INSTAGRAM_USERNAME } from '@/lib/constants'


export default function PublicFooter() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-1 mb-3">
              <Image src="/logo.png" alt="Saathi Sneha Care" width={52} height={52} className="object-contain mix-blend-mode-screen" style={{ mixBlendMode: 'screen' }} />
              <div className="leading-none">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white text-2xl tracking-tight">Saathi</span>
                  <span className="text-[13px] font-semibold tracking-[0.08em] text-white/70 [word-spacing:-0.1em]">Sneha Care</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#6aab5e] text-[8px]">♥</span>
                  <span className="text-[11px] text-[#6aab5e] font-medium italic">Care that feels like family</span>
                  <span className="text-[#6aab5e] text-[8px]">♥</span>
                </div>
              </div>
            </Link>
            <p className="text-xs text-white/50 leading-relaxed mb-2">Professional home care for your parents in Nepal.</p>
            <p className="text-xs font-medium text-white/60 font-nepali">साथी स्नेह केयर — आमाबाको हेरचाह</p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Services</h3>
            <ul className="space-y-1.5">
              {['Wellness Checks', 'Chronic Disease Care', 'Medication Management'].map(s => (
                <li key={s}>
                  <Link href="/services" className="text-xs text-white/40 hover:text-white transition-colors">{s}</Link>
                </li>
              ))}
              <li>
                <Link href="/services" className="text-xs text-brand-red hover:text-white transition-colors italic">+ many more →</Link>
              </li>
            </ul>
          </div>

          {/* Company + Portals */}
          <div>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Company</h3>
            <ul className="space-y-1.5 mb-4">
              {[{ href: '/about', label: 'About Us' }, { href: '/plans', label: 'Plans & Pricing' }, { href: '/contact', label: 'Contact' }].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-white/40 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Contact</h3>
            <ul className="space-y-2 mb-3">
              <li className="flex items-start gap-2 text-xs text-white/50">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-red" />
                Kathmandu, Nepal
              </li>
            </ul>
            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="text-white/50 hover:text-brand-red transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={`https://m.me/${FACEBOOK_PAGE_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on Messenger"
                className="text-white/50 hover:text-brand-red transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={`https://ig.me/m/${INSTAGRAM_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on Instagram"
                className="text-white/50 hover:text-brand-red transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/25">
          <p>© {new Date().getFullYear()} Saathi Sneha Care. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-white/50 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
