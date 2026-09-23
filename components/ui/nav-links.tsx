'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu } from 'lucide-react';

import type { AccountRole } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const links: Record<AccountRole, { href: string; label: string }[]> = {
  admin: [
    { href: '/admin', label: 'Pusat operasi' },
    { href: '/admin/kiriman', label: 'Semua kiriman' },
    { href: '/admin/tiket', label: 'Tiket CS' },
    { href: '/admin/finance', label: 'Finance' },
    { href: '/lacak', label: 'Lacak paket' },
  ],
  seller: [
    { href: '/seller', label: 'Ringkasan' },
    { href: '/pengiriman', label: 'Pengiriman' },
    { href: '/lacak', label: 'Lacak paket' },
    { href: '/transaksi', label: 'Arus dana' },
    { href: '/import', label: 'Rekonsiliasi' },
    { href: '/kategori', label: 'Kategori' },
  ],
  consumer: [
    { href: '/akun', label: 'Paket saya' },
    { href: '/lacak', label: 'Lacak paket' },
  ],
};

function NavItem({ href, label, pathname, mobile }: { href: string; label: string; pathname: string; mobile: boolean }) {
  const home = href === '/admin' || href === '/seller' || href === '/akun';
  const active = pathname === href || (!home && pathname.startsWith(`${href}/`));
  return <Link href={href} aria-current={active ? 'page' : undefined} className={cn('rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary', mobile && 'flex min-h-11 items-center', active && 'bg-accent text-accent-foreground underline decoration-primary decoration-2 underline-offset-8')}>{label}</Link>;
}

export function NavLinks({ role, mobile = false }: { role: AccountRole; mobile?: boolean }) {
  const pathname = usePathname();
  const roleLinks = links[role];

  if (mobile) return (
    <details className="group w-full">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden"><Menu className="size-4" /> Menu <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-open:rotate-180" /></summary>
      <nav aria-label="Navigasi utama mobile" className="grid gap-1 border-t py-3">
        {roleLinks.map((link) => <NavItem key={link.href} {...link} pathname={pathname} mobile />)}
      </nav>
    </details>
  );

  return <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-1">
    {roleLinks.map((link) => <NavItem key={link.href} {...link} pathname={pathname} mobile={false} />)}
  </nav>;
}
