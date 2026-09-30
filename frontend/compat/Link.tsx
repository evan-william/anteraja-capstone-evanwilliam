import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; children?: ReactNode };

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, ...props }, ref) {
  return <RouterLink ref={ref} to={href} {...props} />;
});

export default Link;
