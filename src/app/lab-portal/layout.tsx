import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Lab Portal — Saathi Sneha Care', template: '%s — Lab Portal' },
}

export default function LabPortalRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
