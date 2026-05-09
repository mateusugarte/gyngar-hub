import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gyngar.hub',
  description: 'SaaS de organização empresarial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Inline script: aplica tema antes do primeiro render para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('gyngar-theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
