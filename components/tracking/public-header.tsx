import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Brand } from '@/components/ui/brand';

export function PublicHeader() {
  return (
    <header className="relative z-30 border-b border-white/10 bg-[#21171d]/90 text-white backdrop-blur-xl">
      <div className="app-container flex min-h-18 items-center justify-between gap-4 py-3">
        <Brand href="/lacak" className="[&_span_span:first-child]:text-white [&_span_span:last-child]:text-white/55" />
        <nav aria-label="Navigasi publik" className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/lacak" className="rounded-lg px-3 py-2 text-white/75 transition hover:bg-white/8 hover:text-white">Lacak paket</Link>
          <Link href="/masuk" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-white shadow-[0_10px_28px_rgba(233,0,127,.28)] transition hover:-translate-y-0.5 hover:bg-[#ff168f]">
            Masuk <ArrowRight className="size-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
