import type { Metadata } from 'next';
import { DM_Sans, DM_Mono, Instrument_Serif } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/lib/theme';
import { Analytics } from '@vercel/analytics/next';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
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
  title: 'FAST Isb Schedule',
  description: 'Find your exam timetable — FAST NUCES, Islamabad',
  openGraph: {
    title: 'FAST Isb Schedule',
    description: 'Find your exam timetable instantly',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#FAFAF8',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-[var(--color-bg)] text-[var(--color-text-primary)] font-body antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
