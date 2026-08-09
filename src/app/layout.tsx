import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Quicksand, Playfair_Display } from 'next/font/google'
import './globals.css'

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fontQuicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

const fontPlayfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: { default: 'Saathi Sneha Care', template: '%s | Saathi Sneha Care' },
  description: 'Professional home health care for your parents in Nepal — trusted by Nepali families worldwide.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontQuicksand.variable} ${fontPlayfair.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
