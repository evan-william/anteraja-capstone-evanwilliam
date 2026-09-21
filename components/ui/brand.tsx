import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/pengiriman" className={cn('inline-flex items-center gap-2.5 rounded-md', className)} aria-label="Anteraja — buka operasi pengiriman">
      <Image src="/brand/anteraja-mark.png" alt="" width={42} height={42} className="size-9 scale-[1.65] object-contain" priority />
      {!compact ? (
        <span className="leading-none">
          <span className="block text-[21px] font-bold tracking-[-0.045em] text-primary">anteraja</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tracking & operations</span>
        </span>
      ) : null}
    </Link>
  );
}
