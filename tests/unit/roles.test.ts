import { describe, expect, it } from 'vitest';

import { isAccountRole, roleHome } from '@/lib/roles';

describe('role navigation', () => {
  it('maps each account to its workspace', () => {
    expect(roleHome('admin')).toBe('/admin');
    expect(roleHome('seller')).toBe('/seller');
    expect(roleHome('consumer')).toBe('/akun');
  });

  it('rejects untrusted role strings', () => {
    expect(isAccountRole('admin')).toBe(true);
    expect(isAccountRole('seller')).toBe(true);
    expect(isAccountRole('consumer')).toBe(true);
    expect(isAccountRole('superadmin')).toBe(false);
    expect(isAccountRole(null)).toBe(false);
  });
});
