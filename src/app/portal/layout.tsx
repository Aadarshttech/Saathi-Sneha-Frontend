import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | Saathi Sneha Care Patient Portal', default: 'Saathi Sneha Care Patient Portal' },
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
