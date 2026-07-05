import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Patitas — Adopta una mascota',
  description: 'Encuentra a tu compañero perfecto y dale un hogar.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Patitas',
  },
}

export const viewport: Viewport = {
  themeColor: '#C04828',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-white max-w-md mx-auto relative">
          {children}
        </div>
      </body>
    </html>
  )
}
