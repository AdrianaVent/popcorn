import GlobalProvider from '@/providers/GlobalProvider.client'
import { Open_Sans } from 'next/font/google'
import '@/styles/globals.css'

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={openSans.variable}>
      <head>
        <title>Popcorn</title>
        <meta name="description" content="Discover movies and series with Popcorn" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon universal */}
        <link rel="icon" href="/favicon.ico" />

        {/* PNG favicons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/favicon-512x512.png" />

        {/* SVG */}
        <link rel="icon" type="image/svg+xml" href="/icons/bucket-white.svg" />

        {/* Android / Chrome */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/android-chrome-512x512.png" />

        {/* Manifest para PWA */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  )
}