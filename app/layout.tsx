import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { DriftLogo } from '@/components/drift-logo'
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
  title: 'Drift - Find people to do something with today',
  description: 'Meet travelers and locals nearby for spontaneous real-world plans, meetups, and conversations.',
  keywords: ['travel', 'meetup', 'locals', 'spontaneous plans', 'coffee', 'connection'],
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
        url: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B0D12',
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
      <body className="font-sans antialiased min-h-dvh overflow-x-hidden">
        <div id="drift-startup-splash" className="drift-startup-splash" aria-hidden="true">
          <div className="drift-startup-splash__content">
            <DriftLogo markClassName="h-20 w-20 mx-auto [&_path]:fill-white" />
            <p className="drift-startup-splash__name">Drift</p>
            <p className="drift-startup-splash__tagline">Find your people.</p>
          </div>
        </div>
        {/* Restore accent color and reduce-motion before first paint */}
        <Script id="appearance-init" strategy="beforeInteractive">{`
          (function(){try{
            var a=localStorage.getItem('drift-accent');
            if(a&&a!=='blue')document.documentElement.setAttribute('data-accent',a);
            if(localStorage.getItem('drift-reduced-motion')==='true')document.documentElement.classList.add('reduce-motion');
          }catch(e){}}());
        `}</Script>
        <Script id="startup-splash-ready" strategy="afterInteractive">{`
          requestAnimationFrame(function(){
            document.documentElement.classList.add('drift-ready');
          });
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
