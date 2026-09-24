'use server';

import { redirect } from 'next/navigation';

import { roleHome } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import { firstIssueMessage, signInSchema } from '@/lib/validation';

export type SignInState = { error: string | null; email: string };

export async function signIn(_state: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim();
  const parsed = signInSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error), email };

  const supabase = await createClient();
  let result;
  try {
    result = await supabase.auth.signInWithPassword(parsed.data);
  } catch {
    return { error: 'Tidak dapat menghubungi layanan masuk. Coba lagi beberapa saat.', email };
  }
  if (result.error || !result.data.user) return { error: 'Email atau password salah.', email };

  const { data: accountRole } = await supabase.from('account_roles').select('role').eq('user_id', result.data.user.id).maybeSingle();
  redirect(roleHome(accountRole?.role ?? 'consumer'));
}
