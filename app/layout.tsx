import type { Metadata, Viewport } from 'next';
import ErrorBoundary from '@/components/ErrorBoundary';
import './globals.css';

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Payton's Art Club";

export const metadata: Metadata = {
  title: appName,
  description: 'A cozy drawing club for young artists',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appName,
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFFBF4',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
