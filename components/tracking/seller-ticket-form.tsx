'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ApiResponse } from '@/lib/api';

export function SellerTicketForm({ awb }: { awb: string }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState('');
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setResult(''); setFailed(false);
    try {
      const response = await fetch(`/api/v1/seller/shipments/${encodeURIComponent(awb)}/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }),
      });
      const body = await response.json() as ApiResponse<{ ticket_number: string }>;
      if (!body.success) throw new Error(body.error.message);
      setResult(`Tiket ${body.data.ticket_number} dibuat. Tim Admin dapat melihat laporan ini.`);
      setNote('');
      router.refresh();
    } catch (error) {
      setFailed(true);
      setResult(error instanceof Error ? error.message : 'Tiket belum dapat dibuat. Coba lagi.');
    } finally { setPending(false); }
  }

  return <section aria-labelledby="seller-ticket-title" className="surface mt-5 p-5 sm:p-6">
    <h2 id="seller-ticket-title" className="section-title">Laporkan kendala pengiriman</h2>
    <p className="mt-2 text-sm text-muted-foreground">Laporan ini otomatis membawa resi, posisi terakhir, kendala, dan lima peristiwa terbaru ke tim Admin.</p>
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <label htmlFor="seller-ticket-note" className="grid gap-2 text-sm font-semibold">Catatan untuk CS
        <Textarea id="seller-ticket-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={5} placeholder="Jelaskan masalah yang perlu ditindaklanjuti." required />
      </label>
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Buat tiket CS'}</Button><span className="text-xs text-muted-foreground">{note.length}/500 karakter</span></div>
      <p role={failed ? 'alert' : 'status'} className={failed ? 'text-sm text-destructive' : 'text-sm text-emerald-700'}>{result}</p>
    </form>
  </section>;
}
