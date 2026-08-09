import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Provider Portal — Saathi Sneha Care', template: '%s — Provider Portal' },
}

export default function ProviderPortalRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
