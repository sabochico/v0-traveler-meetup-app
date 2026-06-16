import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { NativeOAuthListener } from '@/components/native-oauth-listener'
import { StartupSplashHaptic } from '@/components/startup-splash-haptic'
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
  title: 'Drift — Find Your People',
  description: 'Find people to do something with today. Drift helps travelers, expats, students, and locals connect through shared activities, meetups, and genuine friendships.',
  keywords: ['travel', 'meetup', 'locals', 'spontaneous plans', 'coffee', 'connection'],
  openGraph: {
    title: 'Drift — Find Your People',
    description: 'Find people to do something with today. Drift helps travelers, expats, students, and locals connect through shared activities, meetups, and genuine friendships.',
    siteName: 'Drift',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Drift — Find Your People',
    description: 'Find people to do something with today. Drift helps travelers, expats, students, and locals connect through shared activities, meetups, and genuine friendships.',
  },
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
            <svg
              viewBox="0 0 64 64"
              className="drift-startup-splash__logo"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M16 11h18c9.9 0 18 7.8 18 17.5 0 2.2-1.9 3.9-4.1 3.6-8.6-1.3-15.2-4-20.2-8.4-1.7-1.5-3.8-2.3-6.1-2.3H16a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4Z"
              />
              <path
                fill="currentColor"
                d="M16 34.3h5.3c2.4 0 4.7.8 6.5 2.4 5 4.3 11.6 7 20 8.2 2.3.3 4.2 2.1 4.2 4.4C52 58.1 44.1 64 34.7 64H16a4 4 0 0 1-4-4V38.3a4 4 0 0 1 4-4Z"
                transform="translate(0 -10)"
              />
            </svg>
          </div>
        </div>
        <StartupSplashHaptic />
        {/* Restore accent color and reduce-motion before first paint */}
        <Script id="appearance-init" strategy="beforeInteractive">{`
          (function(){try{
            var a=localStorage.getItem('drift-accent');
            if(a&&a!=='blue')document.documentElement.setAttribute('data-accent',a);
            if(localStorage.getItem('drift-reduced-motion')==='true')document.documentElement.classList.add('reduce-motion');
          }catch(e){}}());
        `}</Script>
        <Script id="startup-splash-ready" strategy="afterInteractive">{`
          window.setTimeout(function(){
            requestAnimationFrame(function(){
              document.documentElement.classList.add('drift-ready');
            });
          }, 2000);
        `}</Script>
        <ThemeProvider attribute="class" defaultTheme="dark" storageKey="drift-theme" value={{ light: "light", dark: "dark" }}>
          <NativeOAuthListener />
          {children}
          <Toaster />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
