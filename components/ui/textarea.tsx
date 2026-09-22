import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      suppressHydrationWarning
      className={cn(
        'min-h-36 w-full resize-y rounded-lg border border-input bg-white px-3 py-3 text-base font-normal text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
