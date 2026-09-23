import 'server-only';

import { redirect } from 'next/navigation';

import { createClient } from './supabase/server';
export { roleHome } from './roles';
import type { AccountRole } from './supabase/types';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: AccountRole;
};

/**
 * Satu-satunya cara mendapatkan user aktif di seluruh aplikasi.
 * Jangan membaca session Supabase langsung dari tempat lain.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('id', user.id)
    .maybeSingle();

  const { data: accountRole } = await supabase
    .from('account_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const email = profile?.email ?? user.email ?? '';
  const name = profile?.name ?? (user.user_metadata.name as string | undefined) ?? '';

  return { id: user.id, email, name, role: accountRole?.role ?? 'consumer' };
}

/** Seperti getCurrentUser(), tapi melempar error kalau belum login. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireRole(allowed: readonly AccountRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/masuk');
  if (!allowed.includes(user.role)) redirect('/akses-ditolak');
  return user;
}
