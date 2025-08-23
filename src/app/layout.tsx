import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import './globals.css'
import '../styles/audio-player.css'
import '../styles/transcript.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lumina - AI-Powered Meeting Recorder',
  description: 'Premium meeting recording and analysis platform with AI summaries, transcripts, and action items.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SubscriptionProvider>
          <Navigation />
          <main>{children}</main>
        </SubscriptionProvider>
      </body>
    </html>
  )
}
