import type { Metadata } from 'next'
import { SkipLink } from '@/components/shell/skip-link'
import { QueryProvider } from '@/lib/query-client'
import { buildRouteMetadata } from '@/lib/route-contracts'
import '@/components/jakaru/demo-jakaru.css'
import '@/components/jakaru/jakaru.css'
import '@/components/jakaru/prototype.css'
import './globals.css'

export const metadata: Metadata = {
  ...buildRouteMetadata('/'),
  icons: {
    icon: '/landing/source/logo.webp',
    shortcut: '/landing/source/logo.webp',
    apple: '/landing/source/logo.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <QueryProvider>
          <SkipLink />
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
