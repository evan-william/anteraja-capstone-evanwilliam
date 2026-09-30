import type { AccountRole } from './database-types';

export function roleHome(role: AccountRole): string {
  if (role === 'admin') return '/admin';
  if (role === 'seller') return '/seller';
  return '/akun';
}

export function isAccountRole(value: unknown): value is AccountRole {
  return value === 'admin' || value === 'seller' || value === 'consumer';
}
