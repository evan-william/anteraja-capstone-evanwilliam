'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { ChevronDown, Menu } from 'lucide-react';

import type { AccountRole } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

type NavLink = { href: string; label: string };
type NavGroup = { label: string; links: NavLink[] };

const groups: Record<'admin' | 'seller', NavGroup[]> = {
  admin: [{ label: 'Operasional', links: [
    { href: '/admin', label: 'Ringkasan' },
    { href: '/admin/kiriman', label: 'Pengiriman' },
    { href: '/admin/tiket', label: 'Tiket CS' },
    { href: '/lacak', label: 'Lacak paket' },
  ] }],
  seller: [
    { label: 'Pengiriman', links: [
      { href: '/seller', label: 'Ringkasan' },
      { href: '/pengiriman', label: 'Pengiriman' },
      { href: '/lacak', label: 'Lacak paket' },
    ] },
    { label: 'Finance', links: [
      { href: '/transaksi', label: 'Arus dana' },
      { href: '/import', label: 'Rekonsiliasi' },
      { href: '/kategori', label: 'Kategori' },
    ] },
  ],
};

const consumerLinks: NavLink[] = [
  { href: '/akun', label: 'Paket saya' },
  { href: '/lacak', label: 'Lacak paket' },
];

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === '/admin/kiriman' && pathname.startsWith('/admin/pengiriman/')) return true;
  if (href === '/admin' || href === '/seller' || href === '/akun') return false;
  return pathname.startsWith(`${href}/`);
}

function NavItem({ link, pathname, mobile = false }: { link: NavLink; pathname: string; mobile?: boolean }) {
  const active = isActive(pathname, link.href);
  return <Link href={link.href} aria-current={active ? 'page' : undefined} className={cn(
    'rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    mobile && 'flex min-h-11 items-center',
    active && 'bg-accent text-accent-foreground underline decoration-primary decoration-2 underline-offset-8',
  )}>{link.label}</Link>;
}

export function NavLinks({ role, mobile = false }: { role: AccountRole; mobile?: boolean }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const roleGroups = role === 'consumer' ? [] : groups[role];

  if (mobile) return <details className="group w-full">
    <summary className="summary-clean flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Menu className="size-4" /> Menu <ChevronDown className="ml-auto size-4 group-open:rotate-180" /></summary>
    <nav aria-label="Navigasi utama mobile" className="grid gap-1 border-t py-3">
      {role === 'consumer' ? consumerLinks.map((link) => <NavItem key={link.href} link={link} pathname={pathname} mobile />) : roleGroups.map((group) => <details key={group.label} className="group/sub rounded-md">
        <summary className={cn('summary-clean flex min-h-11 cursor-pointer list-none items-center justify-between rounded-md px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary', group.links.some((link) => isActive(pathname, link.href)) ? 'bg-accent text-accent-foreground' : 'text-foreground')}>
          {group.label}<ChevronDown className="size-4 group-open/sub:rotate-180" />
        </summary>
        <div className="grid gap-1 py-1 pl-3">{group.links.map((link) => <NavItem key={link.href} link={link} pathname={pathname} mobile />)}</div>
      </details>)}
    </nav>
  </details>;

  if (role === 'consumer') return <nav aria-label="Navigasi utama" className="flex items-center gap-1">{consumerLinks.map((link) => <NavItem key={link.href} link={link} pathname={pathname} />)}</nav>;

  return <nav aria-label="Navigasi utama" className="flex items-center gap-2">
    {roleGroups.map((group) => {
      const active = group.links.some((link) => isActive(pathname, link.href));
      const open = openMenu === group.label;
      return <div key={group.label} className="relative" onMouseEnter={() => setOpenMenu(group.label)} onMouseLeave={() => setOpenMenu(null)} onFocus={() => setOpenMenu(group.label)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenMenu(null); }} onKeyDown={(event) => { if (event.key === 'Escape') { setOpenMenu(null); menuRefs.current[group.label]?.focus(); } }}>
        <button ref={(node) => { menuRefs.current[group.label] = node; }} type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpenMenu(group.label)} className={cn('inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary', active && 'bg-accent text-accent-foreground')}>
          {group.label}<ChevronDown className={cn('size-4', open && 'rotate-180')} />
        </button>
        {open ? <div className="absolute left-0 top-full z-50 min-w-48 pt-2"><div className="grid gap-1 rounded-xl border bg-white p-2 shadow-[0_14px_36px_rgba(36,29,33,.14)]">{group.links.map((link) => <NavItem key={link.href} link={link} pathname={pathname} />)}</div></div> : null}
      </div>;
    })}
  </nav>;
}
