import type { Metadata } from 'next'
import { Space_Mono, DM_Sans, Orbitron } from 'next/font/google'
import './globals.css'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono'
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans'
})

const orbitron = Orbitron({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-display'
})

export const metadata: Metadata = {
  title: 'APEX AI — Institutional Crypto Trading Intelligence',
  description: 'Multi-agent AI trading platform with real-time signals, risk management, and automated strategy execution.',
  keywords: ['crypto trading', 'AI trading bot', 'Bitcoin', 'trading signals', 'risk management'],
  openGraph: {
    title: 'APEX AI Trading Platform',
    description: 'Institutional-grade AI crypto trading intelligence',
    type: 'website'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${dmSans.variable} ${orbitron.variable}`}>
      <body className="bg-bg-0 text-slate-200 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
