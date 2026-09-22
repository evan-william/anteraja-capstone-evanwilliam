'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const operations = [
  { href: '/pengiriman', label: 'Pengiriman' },
  { href: '/lacak', label: 'Lacak paket' },
];
const finance = [
  { href: '/transaksi', label: 'Arus dana' },
  { href: '/import', label: 'Rekonsiliasi' },
  { href: '/kategori', label: 'Kategori' },
];

function NavItem({ href, label, pathname, mobile = false }: { href: string; label: string; pathname: string; mobile?: boolean }) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return <Link href={href} aria-current={active ? 'page' : undefined} className={cn('relative rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground', mobile && 'flex min-h-11 items-center', active && 'bg-accent text-accent-foreground after:absolute after:bottom-1 after:left-3 after:h-0.5 after:w-5 after:bg-primary')}>{label}</Link>;
}

export function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const financeActive = finance.some(({ href }) => pathname === href || pathname.startsWith(`${href}/`));

  if (mobile) return (
    <details className="group w-full">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden"><Menu className="size-4" /> Menu <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-open:rotate-180" /></summary>
      <nav aria-label="Navigasi utama mobile" className="grid gap-1 border-t py-3">
        {operations.map((link) => <NavItem key={link.href} {...link} pathname={pathname} mobile />)}
        <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Finance</p>
        {finance.map((link) => <NavItem key={link.href} {...link} pathname={pathname} mobile />)}
      </nav>
    </details>
  );

  return (
    <nav aria-label="Navigasi utama" className="flex items-center gap-1">
      {operations.map((link) => <NavItem key={link.href} {...link} pathname={pathname} />)}
      <details className="group relative">
        <summary className={cn('flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden', financeActive && 'bg-accent text-accent-foreground')}>
          Finance <ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 grid min-w-52 origin-top-left rounded-xl border bg-white p-1.5 shadow-[0_16px_44px_rgba(36,29,33,.14)]">
          {finance.map((link) => <NavItem key={link.href} {...link} pathname={pathname} />)}
        </div>
      </details>
    </nav>
  );
}
