import Link from 'next/link';

import { signOut } from '@/app/actions';
import { Button } from '@/components/ui/button';

export function SiteHeader({ userName }: { userName: string }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-4 px-4">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/transaksi" className="hover:text-primary">
            Transaksi
          </Link>
          <Link href="/kategori" className="hover:text-primary">
            Kategori
          </Link>
          <Link href="/import" className="hover:text-primary">
            Import
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Keluar
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
