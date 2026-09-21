import { LogOut } from 'lucide-react';

import { signOut } from '@/app/actions';
import { Brand } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { NavLinks } from '@/components/ui/nav-links';

export function SiteHeader({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl">
      <div className="app-container flex min-h-16 items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-7">
          <Brand className="shrink-0" />
          <div className="hidden md:block"><NavLinks /></div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden max-w-44 truncate text-sm text-muted-foreground lg:inline">{userName}</span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="gap-2">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Keluar</span>
            </Button>
          </form>
        </div>
      </div>
      <div className="app-container border-t py-1.5 md:hidden"><NavLinks /></div>
    </header>
  );
}
