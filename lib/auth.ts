import 'server-only';

import { createClient } from './supabase/server';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
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

  const email = profile?.email ?? user.email ?? '';
  const name = profile?.name ?? (user.user_metadata.name as string | undefined) ?? '';

  return { id: user.id, email, name };
}

/** Seperti getCurrentUser(), tapi melempar error kalau belum login. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}
