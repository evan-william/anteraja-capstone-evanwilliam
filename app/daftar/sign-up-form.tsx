'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { roleHome } from '@/lib/roles';
import { firstIssueMessage, signUpSchema } from '@/lib/validation';
import type { AccountRole } from '@/lib/supabase/types';

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AccountRole>('consumer');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const formData = new FormData(event.currentTarget);
    const parsed = signUpSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }

    const activationCode = String(formData.get('activation_code') ?? '').trim();
    if (selectedRole === 'admin' && activationCode.length < 12) {
      setError('Masukkan kode aktivasi Admin yang valid.');
      return;
    }

    setIsPending(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { name: parsed.data.name, requested_role: selectedRole === 'seller' ? 'seller' : 'consumer' } },
    });
    if (signUpError) {
      setIsPending(false);
      setError(signUpError.message);
      return;
    }

    // Kalau konfirmasi email masih aktif di project Supabase, session belum terbentuk.
    if (!data.session) {
      setIsPending(false);
      setNotice(selectedRole === 'admin' ? 'Akun dibuat sebagai Konsumen sementara. Konfirmasi email, masuk, lalu buka /aktivasi-admin dan masukkan kode yang sama.' : 'Akun dibuat. Buka email konfirmasi sebelum masuk.');
      return;
    }

    if (selectedRole === 'admin') {
      const { data: activated, error: activationError } = await supabase.rpc('redeem_admin_activation_code', { p_code: activationCode });
      if (activationError || !activated) {
        setIsPending(false);
        setNotice('Akun dibuat sebagai Konsumen sementara. Kode belum diterima; coba lagi di halaman Aktivasi Admin.');
        return;
      }
    }

    setIsPending(false);
    router.push(roleHome(selectedRole));
    router.refresh();
  }

  return (
    <form id="sign-up-form" method="post" onSubmit={handleSubmit} className="js-sign-up-form space-y-4">
      {error ? <Alert id="sign-up-error" variant="destructive">{error}</Alert> : null}
      {notice ? <Alert>{notice} {selectedRole === 'admin' ? <Link href="/aktivasi-admin" className="font-semibold underline underline-offset-4">Buka Aktivasi Admin</Link> : null}</Alert> : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Daftar sebagai</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Jenis akun">
          {([['consumer', 'Konsumen'], ['seller', 'Seller'], ['admin', 'Admin']] as const).map(([role, label]) => <label key={role} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"><input type="radio" name="role" value={role} checked={selectedRole === role} onChange={() => setSelectedRole(role)} />{label}</label>)}
        </div>
        <p className="field-help">Admin memerlukan kode aktivasi resmi. Akun Seller dan Konsumen dapat didaftarkan langsung.</p>
      </fieldset>
      {selectedRole === 'admin' ? <div className="space-y-2"><Label htmlFor="activation-code">Kode aktivasi Admin</Label><Input id="activation-code" name="activation_code" autoComplete="off" required aria-describedby="activation-help" /><p id="activation-help" className="field-help">Kode sekali pakai dari pengelola operasional. Jangan bagikan ke orang lain.</p></div> : null}

      <div className="space-y-2">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" name="name" autoComplete="name" aria-invalid={Boolean(error)} aria-describedby={error ? 'sign-up-error' : undefined} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? 'sign-up-error' : undefined} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'sign-up-error password-help' : 'password-help'}
          minLength={8}
          required
        />
        <p id="password-help" className="field-help">Minimal 8 karakter.</p>
      </div>

      <Button id="sign-up-submit" type="submit" className="js-sign-up-submit w-full" disabled={isPending}>
        {isPending ? 'Membuat akun…' : 'Buat akun'}
      </Button>
    </form>
  );
}
