import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Anteraja Tracking & Operations',
  description: 'Tracking proaktif, penyelesaian kendala kiriman, dan rekonsiliasi settlement dalam satu ruang kerja.',
  icons: {
    icon: '/brand/anteraja-favicon.png',
    shortcut: '/brand/anteraja-favicon.png',
    apple: '/brand/anteraja-favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
        {children}
      </body>
    </html>
  );
}
