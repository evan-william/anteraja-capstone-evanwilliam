import * as React from 'react';

import { cn } from '@/lib/utils';

type AlertProps = React.ComponentProps<'div'> & {
  variant?: 'default' | 'destructive';
};

function Alert({ className, variant = 'default', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border px-4 py-3 text-sm leading-5',
        variant === 'destructive'
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-primary/20 bg-accent/55 text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Alert };
