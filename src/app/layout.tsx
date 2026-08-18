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
    default: 'Aether — shielded isn\u2019t private',
    template: '%s · Aether',
  },
  description:
    'A privacy pool gives you an anonymity set; your behaviour spends it. Aether runs the real deanonymization attacks against your public footprint on Starknet mainnet, then closes every leak it finds inside the STRK20 pool.',
  keywords: ['Starknet', 'STRK20', 'privacy', 'DeFi', 'zero knowledge', 'private portfolio'],
  authors: [{ name: 'Shariq Shaukat' }],
  openGraph: {
    title: 'Aether — shielded isn\u2019t private',
    description:
      'Run the real deanonymization attacks against any Starknet address, then close every leak inside the STRK20 pool. No wallet needed to see how linkable you are.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aether — shielded isn\u2019t private',
    description:
      'The pool gives you an anonymity set. Your behaviour spends it. Point the adversary at any address.',
  },
}

export const viewport: Viewport = {
  themeColor: '#f7f6f4',
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
