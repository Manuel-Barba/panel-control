import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Panel de Control - Hablemos Emprendimiento',
  description: 'Panel de administración para Hablemos Emprendimiento',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}