import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Anteraja Tracking & Operations',
  description: 'Tracking proaktif, penyelesaian kendala kiriman, dan rekonsiliasi settlement dalam satu ruang kerja.',
  icons: {
    icon: '/brand/anteraja-icon.png',
    shortcut: '/brand/anteraja-icon.png',
    apple: '/brand/anteraja-icon.png',
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
