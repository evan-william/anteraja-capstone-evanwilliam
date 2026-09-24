'use client';

import { useActionState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { signIn, type SignInState } from './actions';

const initialState: SignInState = { error: null, email: '' };

export function SignInForm() {
  const [state, action, isPending] = useActionState(signIn, initialState);

  return (
    <form id="sign-in-form" action={action} className="js-sign-in-form space-y-4">
      {state.error ? <Alert id="sign-in-error" variant="destructive">{state.error}</Alert> : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" spellCheck={false} defaultValue={state.email} aria-invalid={Boolean(state.error)} aria-describedby={state.error ? 'sign-in-error' : undefined} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" aria-invalid={Boolean(state.error)} aria-describedby={state.error ? 'sign-in-error' : undefined} required />
      </div>
      <Button id="sign-in-submit" type="submit" className="js-sign-in-submit w-full" disabled={isPending}>
        {isPending ? 'Memeriksa akun…' : 'Masuk'}
      </Button>
    </form>
  );
}
