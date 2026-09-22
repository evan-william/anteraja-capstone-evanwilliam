'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, PackageSearch } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TrackingSearchForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [awb, setAwb] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = awb.trim().toUpperCase();
    if (!/^ANT-[0-9]{6}$/.test(normalized)) return setError('Gunakan format resi ANT-100015.');
    if (!/^[0-9]{6}$/.test(code)) return setError('Kode akses harus 6 angka.');
    router.push(`/lacak/${encodeURIComponent(normalized)}?code=${encodeURIComponent(code)}`);
  }

  return (
    <form onSubmit={submit} className={compact ? 'space-y-3' : 'space-y-4'} noValidate>
      <div className={compact ? 'grid gap-3 sm:grid-cols-[1fr_180px_auto]' : 'grid gap-3 sm:grid-cols-[1fr_180px]'}>
        <label className="grid gap-2 text-sm font-semibold">
          Nomor resi
          <span className="relative block"><PackageSearch className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={awb} onChange={(event) => { setAwb(event.target.value); setError(''); }} placeholder="Contoh: ANT-100015" autoCapitalize="characters" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby="tracking-help" className="h-13 bg-white pl-12 text-base font-semibold uppercase tracking-wide" /></span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Kode akses
          <span className="relative block"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} placeholder="6 digit" inputMode="numeric" autoComplete="one-time-code" aria-invalid={Boolean(error)} aria-describedby="tracking-help" className="h-13 bg-white pl-11 tabular" /></span>
        </label>
        {compact ? <Button size="lg" className="h-13 self-end px-5">Lacak <ArrowRight /></Button> : null}
      </div>
      {!compact ? <Button size="lg" className="h-13 w-full text-base">Lacak kiriman <ArrowRight /></Button> : null}
      <div id="tracking-help" aria-live="polite" className="min-h-5">
        {error ? <p role="alert" className="text-sm font-semibold text-destructive">{error}</p> : <p className="text-xs leading-5 text-muted-foreground">Kode akses ada di pesan konfirmasi pengiriman. Detail penerima tetap disamarkan.</p>}
      </div>
    </form>
  );
}
