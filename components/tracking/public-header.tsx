import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Brand } from '@/components/ui/brand';
import { getCurrentUser, roleHome } from '@/lib/auth';

export async function PublicHeader() {
  const user = await getCurrentUser();
  return (
    <header className="relative z-30 border-b border-white/10 bg-[#21171d]/90 text-white backdrop-blur-xl">
      <div className="app-container flex min-h-18 items-center justify-between gap-4 py-3">
        <Brand href="/lacak" label="Anteraja — lacak paket" className="[&_span_span:first-child]:text-white [&_span_span:last-child]:text-white/55" />
        <nav aria-label="Navigasi publik" className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/lacak" aria-current="page" className="hidden rounded-lg px-3 py-2 text-white/75 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:inline-flex">Lacak paket</Link>
          <Link href={user ? roleHome(user.role) : '/masuk'} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-white shadow-[0_10px_28px_rgba(233,0,127,.28)] hover:bg-[#ff168f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            {user ? 'Ruang kerja' : 'Masuk'} <ArrowRight className="size-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
