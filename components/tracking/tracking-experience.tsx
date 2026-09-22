'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, BellRing, CalendarClock, Check, CheckCircle2,
  ChevronRight, Circle, Clock3, Copy, Headphones, MapPin,
  RefreshCcw, Route, ShieldCheck, Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ApiResponse } from '@/lib/api';
import type { PublicTracking, RiskStatus } from '@/lib/tracking/types';
import { cn } from '@/lib/utils';

const riskMeta: Record<RiskStatus, { label: string; copy: string; className: string; icon: typeof CheckCircle2 }> = {
  on_track: { label: 'Sesuai jadwal', copy: 'Perjalanan berjalan sesuai rencana. Tidak ada tindakan yang dibutuhkan.', className: 'bg-emerald-50 text-emerald-950', icon: CheckCircle2 },
  at_risk: { label: 'Berisiko terlambat', copy: 'Kami mendeteksi jeda perjalanan lebih lama dari biasanya dan sedang memantaunya.', className: 'bg-amber-50 text-amber-950', icon: Clock3 },
  action_required: { label: 'Perlu tindakanmu', copy: 'Tim kurir membutuhkan informasi tambahan agar pengiriman dapat dilanjutkan.', className: 'bg-rose-50 text-rose-950', icon: AlertTriangle },
  resolved: { label: 'Instruksi diterima', copy: 'Informasi terbaru sudah diteruskan ke tim operasional.', className: 'bg-sky-50 text-sky-950', icon: CheckCircle2 },
};

function formatDate(value: string | null, includeTime = true) {
  if (!value) return 'Belum tersedia';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', ...(includeTime ? { timeStyle: 'short' } : {}) }).format(new Date(value));
}

export function TrackingExperience({ awb, code }: { awb: string; code: string }) {
  const [tracking, setTracking] = useState<PublicTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/v1/tracking/${encodeURIComponent(awb)}?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
      const body = await response.json() as ApiResponse<PublicTracking>;
      if (!body.success) throw new Error(body.error.message);
      setTracking(body.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Status kiriman belum dapat dimuat.');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/tracking/${encodeURIComponent(awb)}?code=${encodeURIComponent(code)}`, { cache: 'no-store' })
      .then((response) => response.json() as Promise<ApiResponse<PublicTracking>>)
      .then((body) => {
        if (!active) return;
        if (!body.success) throw new Error(body.error.message);
        setTracking(body.data);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Status kiriman belum dapat dimuat.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [awb, code]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <TrackingSkeleton />;
  if (error || !tracking) return (
    <article aria-labelledby="tracking-error-title" className="mx-auto max-w-xl py-20 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-destructive"><AlertTriangle /></div>
      <h1 id="tracking-error-title" className="mt-5 text-2xl font-bold">Kiriman belum ditemukan</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
      <nav aria-label="Pemulihan tracking" className="mt-7 flex justify-center gap-3"><Button variant="outline" asChild><Link href="/lacak"><ArrowLeft /> Coba resi lain</Link></Button><Button onClick={() => void load()}><RefreshCcw /> Muat ulang</Button></nav>
    </article>
  );

  const risk = riskMeta[tracking.risk_status];
  const RiskIcon = risk.icon;
  return (
    <article className="page-enter">
      <nav aria-label="Aksi tracking" className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/lacak" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Lacak resi lain</Link>
        <Button variant="outline" size="sm" onClick={() => void copyLink()}>{copied ? <Check /> : <Copy />}{copied ? 'Tautan disalin' : 'Bagikan tracking'}</Button>
      </nav>

      <section className="relative overflow-hidden rounded-[1.5rem] bg-[#21171d] p-6 text-white shadow-[0_22px_60px_rgba(33,23,29,.18)] sm:p-9">
        <div className="absolute -right-18 -top-22 size-64 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff75bd]">{tracking.service_type.replace('_', ' ')} shipment</p><h1 className="mt-3 text-3xl font-bold tracking-[-.045em] sm:text-4xl">{tracking.tracking_number}</h1><p className="mt-3 text-sm text-white/60">{tracking.origin_city} <ChevronRight className="mx-1 inline size-4" /> {tracking.destination_city}</p></div>
          <div className="grid grid-cols-2 gap-x-7 gap-y-5 border-t border-white/12 pt-6 lg:min-w-72 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0"><div><p className="text-xs text-white/55">Estimasi tiba</p><p className="mt-1 font-semibold">{formatDate(tracking.estimated_delivery_at, false)}</p></div><div><p className="text-xs text-white/55">Penerima</p><p className="mt-1 font-semibold">{tracking.recipient_name ?? '—'}</p></div><div className="col-span-2 border-t border-white/12 pt-4"><p className="text-xs text-white/55">Posisi terakhir</p><p className="mt-1 font-semibold">{tracking.current_location ?? 'Belum tersedia'}</p></div></div>
        </div>
      </section>

      <section className={cn('mt-5 flex gap-4 rounded-2xl p-5 sm:p-6', risk.className)}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/70"><RiskIcon className="size-5" /></div>
        <div><h2 className="font-bold">{risk.label}</h2><p className="mt-1 text-sm leading-6 opacity-75">{tracking.exception_reason || risk.copy}</p></div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
        <Timeline tracking={tracking} />
        <aside className="space-y-5">
          <ShipmentSummary tracking={tracking} />
          <NotificationCard awb={awb} code={code} />
        </aside>
      </div>

      {tracking.risk_status === 'action_required' ? <ResolutionCard awb={awb} code={code} onSuccess={load} /> : null}
      <SupportCard awb={awb} code={code} />
    </article>
  );
}

function Timeline({ tracking }: { tracking: PublicTracking }) {
  return (
    <section className="surface overflow-hidden">
      <header className="border-b p-5 sm:p-6"><p className="eyebrow">Perjalanan paket</p><h2 className="mt-2 text-xl font-bold tracking-[-.025em]">Timeline pengiriman</h2></header>
      <ol className="p-5 sm:p-7">
        {tracking.events.map((event, index) => (
          <li key={event.id} className="relative grid grid-cols-[32px_1fr] gap-3 pb-8 last:pb-0">
            {index < tracking.events.length - 1 ? <span className="absolute left-[15px] top-7 h-[calc(100%-10px)] w-px bg-border" /> : null}
            <span className={cn('relative z-10 mt-1 flex size-8 items-center justify-center rounded-full bg-white shadow-sm', index === 0 ? 'text-primary' : 'text-muted-foreground')}>
              {index === 0 ? <Truck className="size-4" /> : <Circle className="size-2 fill-current" />}
            </span>
            <div><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-bold">{event.status_label}</h3><time className="text-xs text-muted-foreground tabular">{formatDate(event.occurred_at)}</time></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p>{event.location ? <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold"><MapPin className="size-3.5 text-primary" /> {event.location}</p> : null}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ShipmentSummary({ tracking }: { tracking: PublicTracking }) {
  const rows: Array<[LucideIcon, string, string | null]> = [
    [Route, 'Posisi terakhir', tracking.current_location],
    [CalendarClock, 'Pembaruan terakhir', formatDate(tracking.last_scan_at)],
    [ShieldCheck, 'Kontak penerima', tracking.recipient_phone],
  ];
  return <section className="surface p-5 sm:p-6"><h2 className="section-title">Ringkasan</h2><dl className="mt-5 space-y-4 text-sm">
    {rows.map(([Icon, label, value]) => <div key={label} className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 font-semibold">{value || 'Belum tersedia'}</dd></div></div>)}
  </dl></section>;
}

function ResolutionCard({ awb, code, onSuccess }: { awb: string; code: string; onSuccess: () => Promise<void> }) {
  const [type, setType] = useState<'update_address' | 'reschedule' | 'safe_drop'>('update_address');
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = type === 'update_address'
      ? { type, district: form.get('district'), street: form.get('street'), landmark: form.get('landmark'), phone: form.get('phone') }
      : type === 'reschedule'
        ? { type, delivery_date: form.get('delivery_date'), note: form.get('note') }
        : { type, landmark: form.get('landmark'), phone: form.get('phone') };
    try {
      const response = await fetch(`/api/v1/tracking/${encodeURIComponent(awb)}/resolution`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tracking-code': code }, body: JSON.stringify(payload) });
      const body = await response.json() as ApiResponse<{ message: string }>;
      if (!body.success) throw new Error(body.error.message);
      setMessage(body.data.message); await onSuccess();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Instruksi belum dapat dikirim.'); }
    finally { setBusy(false); }
  }
  return <section className="surface mt-5 overflow-hidden"><header className="border-b bg-accent/50 p-5 sm:p-6"><p className="eyebrow">Perlu tindakan</p><h2 className="mt-2 text-xl font-bold">Bantu kurir menyelesaikan pengiriman</h2><p className="mt-2 text-sm text-muted-foreground">Pilih satu instruksi. Demi keamanan, perubahan dibatasi satu kali per hari.</p></header>
    <div className="p-5 sm:p-6"><div className="grid gap-2 sm:grid-cols-3">{([['update_address','Perjelas alamat'],['reschedule','Atur ulang jadwal'],['safe_drop','Titip di tempat aman']] as const).map(([value,label]) => <button key={value} onClick={() => setType(value)} className={cn('rounded-xl border px-4 py-3 text-left text-sm font-bold', type === value ? 'bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_rgba(233,0,127,.12)]' : 'bg-white hover:bg-muted')}>{label}</button>)}</div>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        {type === 'update_address' ? <><Field name="district" label="Kecamatan" placeholder="Cilandak" /><Field name="street" label="Jalan dan nomor" placeholder="Jl. Terogong Raya No. 18" /><Field name="landmark" label="Patokan (maks. 150 karakter)" placeholder="Pagar hitam, sebelah minimarket" /><Field name="phone" label="Nomor penerima" placeholder="081234567890" /></> : null}
        {type === 'reschedule' ? <><Field name="delivery_date" label="Tanggal pilihan" type="date" /><Field name="note" label="Catatan (opsional)" placeholder="Penerima tersedia setelah pukul 13.00" /></> : null}
        {type === 'safe_drop' ? <><Field name="landmark" label="Lokasi penitipan" placeholder="Pos keamanan lobi utama" /><Field name="phone" label="Nomor penerima" placeholder="081234567890" /></> : null}
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3"><Button disabled={busy}>{busy ? 'Mengirim…' : 'Kirim instruksi'} <ChevronRight /></Button><span aria-live="polite" className={cn('text-sm font-semibold', error ? 'text-destructive' : 'text-emerald-700')}>{error || message}</span></div>
      </form>
    </div></section>;
}

function Field({ name, label, placeholder, type = 'text' }: { name: string; label: string; placeholder?: string; type?: string }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}<Input name={name} type={type} placeholder={placeholder} required={name !== 'note'} className="h-11 font-normal" /></label>;
}

function NotificationCard({ awb, code }: { awb: string; code: string }) {
  const [enabled, setEnabled] = useState(false); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState('');
  async function toggle() {
    const next = !enabled; setBusy(true); setSaved('');
    const response = await fetch(`/api/v1/tracking/${encodeURIComponent(awb)}/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tracking-code': code }, body: JSON.stringify({ whatsapp: next, email: false, push: false }) });
    const body = await response.json() as ApiResponse<unknown>;
    if (body.success) { setEnabled(next); setSaved(next ? 'Notifikasi aktif' : 'Notifikasi dimatikan'); } else setSaved(body.error.message);
    setBusy(false);
  }
  return <section className="surface p-5 sm:p-6"><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><BellRing className="size-4" /></div><div><h2 className="section-title">Update bermakna</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Terima WhatsApp hanya saat estimasi atau tindakan berubah.</p></div></div><Button onClick={() => void toggle()} disabled={busy} variant={enabled ? 'secondary' : 'outline'} className="mt-4 w-full">{enabled ? <Check /> : <BellRing />}{busy ? 'Menyimpan…' : enabled ? 'Notifikasi aktif' : 'Aktifkan WhatsApp'}</Button><p aria-live="polite" className="mt-2 min-h-4 text-xs text-muted-foreground">{saved}</p></section>;
}

function SupportCard({ awb, code }: { awb: string; code: string }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); const note = new FormData(event.currentTarget).get('note');
    const response = await fetch(`/api/v1/tracking/${encodeURIComponent(awb)}/escalate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tracking-code': code }, body: JSON.stringify({ note }) });
    const body = await response.json() as ApiResponse<{ ticket_number: string }>;
    setMessage(body.success ? `Tiket ${body.data.ticket_number} dibuat. Konteks perjalanan sudah dilampirkan.` : body.error.message); setBusy(false);
  }
  return <section className="mt-5 rounded-2xl border bg-[#f0edef] p-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-6"><div className="flex gap-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary"><Headphones className="size-5" /></div><div><h2 className="font-bold">Masih butuh bantuan?</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Tiket otomatis membawa resi, timeline, kendala, dan lokasi terakhir—tidak perlu mengulang cerita.</p></div></div>{!open ? <Button variant="outline" className="mt-4 bg-white sm:mt-0" onClick={() => setOpen(true)}>Buat tiket bantuan</Button> : null}{open ? <form onSubmit={submit} className="mt-4 min-w-0 flex-1 sm:mt-0"><Input name="note" placeholder="Tambahkan catatan singkat (opsional)" maxLength={500} /><div className="mt-2 flex items-center gap-3"><Button size="sm" disabled={busy}>{busy ? 'Membuat…' : 'Kirim ke CS'}</Button><p className="text-xs font-semibold text-emerald-700" aria-live="polite">{message}</p></div></form> : null}</section>;
}

function TrackingSkeleton() {
  return <div className="animate-pulse py-10"><div className="h-52 rounded-[1.5rem] bg-[#21171d]/10" /><div className="mt-5 h-24 rounded-2xl bg-muted" /><div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]"><div className="h-[520px] rounded-xl bg-muted" /><div className="h-64 rounded-xl bg-muted" /></div><p className="sr-only">Memuat status kiriman</p></div>;
}
