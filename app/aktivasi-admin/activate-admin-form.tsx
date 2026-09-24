'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export function ActivateAdminForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const code = String(new FormData(form).get('code') ?? '').trim();
    if (code.length < 12) { setError('Kode aktivasi tidak valid.'); return; }
    setPending(true);
    const { data, error: rpcError } = await createClient().rpc('redeem_admin_activation_code', { p_code: code });
    setPending(false);
    if (rpcError || !data) { setError('Kode tidak berlaku atau batas percobaan tercapai. Hubungi pengelola operasional.'); return; }
    form.reset();
    router.replace('/admin');
    router.refresh();
  }

  return <form method="post" onSubmit={onSubmit} className="space-y-4">{error ? <Alert id="activation-error" variant="destructive">{error}</Alert> : null}<div className="space-y-2"><Label htmlFor="code">Kode aktivasi</Label><Input id="code" name="code" autoComplete="off" required aria-describedby={error ? 'activation-error' : undefined} /></div><Button type="submit" disabled={pending}>{pending ? 'Memeriksa kode…' : 'Aktifkan Admin'}</Button></form>;
}
