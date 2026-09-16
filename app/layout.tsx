import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Catat pemasukan dan pengeluaran harianmu.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
