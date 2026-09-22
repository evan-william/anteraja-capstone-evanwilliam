import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Select native. Cukup untuk fondasi; ganti ke Radix Select kalau butuh kustomisasi.
 */
function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      suppressHydrationWarning
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm transition-[border-color,box-shadow] duration-150 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };
