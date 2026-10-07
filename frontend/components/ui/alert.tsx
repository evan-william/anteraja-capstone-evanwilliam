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
        'rounded-lg px-4 py-3 text-sm leading-5',
        variant === 'destructive'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-accent/55 text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Alert };
