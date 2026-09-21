'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/pengiriman', label: 'Pengiriman' },
  { href: '/lacak', label: 'Lacak paket' },
  { href: '/transaksi', label: 'Arus dana' },
  { href: '/import', label: 'Rekonsiliasi' },
  { href: '/kategori', label: 'Kategori' },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama" className="flex items-center gap-1 overflow-x-auto">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined} className={cn('shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-150 hover:text-foreground', active && 'bg-accent text-accent-foreground')}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
