import type { Metadata } from 'next';
import { DM_Sans, DM_Mono, Instrument_Serif, JetBrains_Mono } from 'next/font/google';

import '../styles/globals.css';
import { ThemeProvider } from '@/lib/theme';
import { Navbar } from '@/components/Navbar';
import { FloatingMenu } from '@/components/FloatingMenu';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '@/components/ui/toaster';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { GlobalShortcuts } from '@/components/GlobalShortcuts';
import { BackToTop } from '@/components/BackToTop';
import { ReadingProgress } from '@/components/ReadingProgress';
import { CommandPalette } from '@/components/CommandPalette';
import { ShortcutHelp } from '@/components/ShortcutHelp';
import { SkipLinks } from '@/components/SkipLinks';
import { ContrastChecker } from '@/components/ContrastChecker';
import { FocusVisibleDebug } from '@/components/FocusVisibleDebug';
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-clock',
  display: 'swap',
});


const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'FAST Isb Utilities',
  description: 'Find your weekly and exam schedules — FAST NUCES, Islamabad',
  icons: {
    icon: [
      { url: '/logo/icon.png', media: '(prefers-color-scheme: light)' },
      { url: '/logo/icon-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
    shortcut: [
      { url: '/logo/icon.png', media: '(prefers-color-scheme: light)' },
      { url: '/logo/icon-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/logo/icon.png',
  },
  openGraph: {
    title: 'FAST Isb Utilities',
    description: 'Find your weekly and exam schedules instantly',
    type: 'website',
    images: [{ url: '/og/og-preview.png', width: 1152, height: 864, alt: 'FAST Isb Utilities' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAST Isb Utilities',
    description: 'Find your weekly and exam schedules instantly',
    images: ['/og/og-preview.png'],
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)', color: '#111110' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >





      <body className="bg-[var(--color-bg)] text-[var(--color-text-primary)] font-body antialiased">
        <ThemeProvider>
          {/* Reading progress indicator (laser-rail gradient, top of viewport) */}
          <ReadingProgress />
          {/* Accessibility: skip links (visible on keyboard focus) */}
          <SkipLinks />
          {children}
          <Navbar />
          <FloatingMenu />
          <FeedbackWidget />
          <GlobalShortcuts />
          <BackToTop />
          <CommandPalette />
          <ShortcutHelp />
          {/* ContrastChecker + FocusVisibleDebug are dev/QA-only tools — gated
              behind NODE_ENV so they don't ship to production. */}
          {process.env.NODE_ENV !== 'production' && (
            <>
              <ContrastChecker />
              <FocusVisibleDebug />
            </>
          )}
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
