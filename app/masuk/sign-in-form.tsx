'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { firstIssueMessage, signInSchema } from '@/lib/validation';

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }

    setIsPending(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setIsPending(false);

    if (signInError) {
      setError('Email atau password salah.');
      return;
    }

    router.push('/transaksi');
    router.refresh();
  }

  return (
    <form id="sign-in-form" onSubmit={handleSubmit} className="js-sign-in-form space-y-4">
      {error ? <Alert id="sign-in-error" variant="destructive">{error}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? 'sign-in-error' : undefined} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'sign-in-error' : undefined}
          required
        />
      </div>

      <Button id="sign-in-submit" type="submit" className="js-sign-in-submit w-full" disabled={isPending}>
        {isPending ? 'Memeriksa akun…' : 'Masuk'}
      </Button>
    </form>
  );
}
