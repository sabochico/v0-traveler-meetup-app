import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair'
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains'
})

export const metadata: Metadata = {
  title: 'Drift - Find Your People Anywhere',
  description: 'Connect with travelers, expats, and digital nomads nearby for spontaneous coffee meetups and genuine human connection.',
  keywords: ['travel', 'meetup', 'digital nomad', 'expat', 'coffee', 'connection'],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1625',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        {/* Restore accent color and reduce-motion before first paint */}
        <Script id="appearance-init" strategy="beforeInteractive">{`
          (function(){try{
            var a=localStorage.getItem('drift-accent');
            if(a&&a!=='amber')document.documentElement.setAttribute('data-accent',a);
            if(localStorage.getItem('drift-reduced-motion')==='true')document.documentElement.classList.add('reduce-motion');
          }catch(e){}}());
        `}</Script>
        <ThemeProvider attribute="class" defaultTheme="dark" storageKey="drift-theme" value={{ light: "light", dark: "dark" }}>
          {children}
          <Toaster />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
