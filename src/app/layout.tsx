import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://aether-strk20.vercel.app'),
  title: {
    default: 'Aether — private portfolio engine on Starknet',
    template: '%s · Aether',
  },
  description:
    'Shield once. Aether runs continuous private strategies entirely inside the STRK20 pool, sizing and timing every action so your financial behaviour never becomes a fingerprint.',
  keywords: ['Starknet', 'STRK20', 'privacy', 'DeFi', 'zero knowledge', 'private portfolio'],
  authors: [{ name: 'Shariq Shaukat' }],
  openGraph: {
    title: 'Aether — private portfolio engine on Starknet',
    description:
      'Continuous private strategies that never leave the shielded pool. Live effective-privacy scoring on Starknet mainnet.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aether — private portfolio engine on Starknet',
    description: 'Shield once. Stay private for the whole lifecycle.',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
