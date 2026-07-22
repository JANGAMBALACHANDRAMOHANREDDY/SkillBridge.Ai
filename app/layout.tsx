import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://skillbridge.ai'),
  title: 'SkillBridge AI — The Complete AI Career Platform',
  description:
    'AI-powered platform that helps students become job-ready and helps recruiters discover the best candidates. Resume building, mock interviews, coding tracking, internships, learning hub, and analytics in one place.',
  keywords: [
    'AI career platform',
    'resume builder',
    'mock interview',
    'coding tracker',
    'internship portal',
    'job readiness',
    'ATS score',
    'student placement',
  ],
  authors: [{ name: 'SkillBridge AI' }],
  openGraph: {
    title: 'SkillBridge AI — The Complete AI Career Platform',
    description:
      'AI-powered platform that helps students become job-ready and helps recruiters discover the best candidates.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${display.variable} ${mono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
