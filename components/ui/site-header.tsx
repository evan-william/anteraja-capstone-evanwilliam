import Link from 'next/link';
import { LogOut, PackageCheck } from 'lucide-react';

import { signOut } from '@/app/actions';
import { Button } from '@/components/ui/button';

export function SiteHeader({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-6">
          <Link href="/transaksi" className="flex items-center gap-2" aria-label="Anteraja Finance">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><PackageCheck className="size-5" /></span>
            <span className="leading-none"><strong className="block text-sm">Anteraja</strong><span className="text-[11px] text-muted-foreground">Finance</span></span>
          </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
          <Link href="/transaksi" className="hover:text-primary">
            Arus dana
          </Link>
          <Link href="/kategori" className="hover:text-primary">
            Kategori
          </Link>
          <Link href="/import" className="hover:text-primary">
            Rekonsiliasi
          </Link>
        </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="gap-2">
              <LogOut className="size-4" /> Keluar
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
