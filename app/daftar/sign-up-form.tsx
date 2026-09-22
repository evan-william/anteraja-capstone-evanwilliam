'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { firstIssueMessage, signUpSchema } from '@/lib/validation';

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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

    setIsPending(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { name: parsed.data.name } },
    });
    setIsPending(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Kalau konfirmasi email masih aktif di project Supabase, session belum terbentuk.
    if (!data.session) {
      setNotice('Akun dibuat. Buka email konfirmasi sebelum masuk.');
      return;
    }

    router.push('/transaksi');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <Alert id="sign-up-error" variant="destructive">{error}</Alert> : null}
      {notice ? <Alert>{notice}</Alert> : null}

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

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Membuat akun…' : 'Buat akun'}
      </Button>
    </form>
  );
}
