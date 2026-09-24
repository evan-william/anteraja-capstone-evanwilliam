'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle, ArrowLeft, BellRing, CalendarClock, Check, CheckCircle2,
  ChevronDown, ChevronRight, Circle, Clock3, Copy, Headphones, MapPin,
  RefreshCcw, Route, ShieldCheck, Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ApiResponse } from '@/lib/api';
import type { PublicTracking, RiskStatus } from '@/lib/tracking/types';
import type { AccountRole } from '@/lib/supabase/types';
import { buildJourney } from '@/lib/tracking/journey';
import { resolveTrackingCityPhoto } from '@/lib/tracking/city-imagery';
import { JourneyMapDisclosure } from '@/components/tracking/journey-map-disclosure';
import { cn } from '@/lib/utils';

const riskMeta: Record<RiskStatus, { label: string; copy: string; className: string; icon: typeof CheckCircle2 }> = {
  on_track: { label: 'Sesuai jadwal', copy: 'Perjalanan berjalan sesuai rencana. Tidak ada tindakan yang dibutuhkan.', className: 'bg-emerald-50 text-emerald-950', icon: CheckCircle2 },
  at_risk: { label: 'Berisiko terlambat', copy: 'Kami mendeteksi jeda perjalanan lebih lama dari biasanya dan sedang memantaunya.', className: 'bg-amber-50 text-amber-950', icon: Clock3 },
  action_required: { label: 'Perlu tindakanmu', copy: 'Tim kurir membutuhkan informasi tambahan agar pengiriman dapat dilanjutkan.', className: 'bg-[#ffe4f0] text-[#5d0a32]', icon: AlertTriangle },
  resolved: { label: 'Instruksi diterima', copy: 'Informasi terbaru sudah diteruskan ke tim operasional.', className: 'bg-sky-50 text-sky-950', icon: CheckCircle2 },
};

function formatDate(value: string | null, includeTime = true) {
  if (!value) return 'Belum tersedia';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Belum tersedia';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', ...(includeTime ? { timeStyle: 'short' } : {}) }).format(date);
}

export function TrackingExperience({ awb, code, viewerRole }: { awb: string; code: string; viewerRole: AccountRole | null }) {
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
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true); window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
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
  const journey = buildJourney(tracking);
  const cityImage = resolveTrackingCityPhoto(tracking.current_location, tracking.destination_city);
  return (
    <article className="page-enter">
      <nav aria-label="Aksi tracking" className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/lacak" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Lacak resi lain</Link>
        <Button variant="outline" size="sm" onClick={() => void copyLink()}>{copied ? <Check /> : <Copy />}{copied ? 'Tautan disalin' : 'Bagikan tracking'}</Button>
      </nav>

      <section aria-labelledby="risk-status-title" className={cn('mb-5 flex flex-col gap-5 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6', risk.className)}>
        <div className="flex min-w-0 gap-4">
          <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', tracking.risk_status === 'action_required' ? 'bg-primary text-white' : 'bg-white/70')}><RiskIcon className="size-5" /></div>
          <div className="min-w-0"><h2 id="risk-status-title" className="text-lg font-semibold">{risk.label}</h2><p className="mt-1 text-base text-pretty opacity-80 sm:text-sm">{tracking.exception_reason || risk.copy}</p></div>
        </div>
        {tracking.risk_status === 'action_required' ? (
          <Button asChild variant="outline" className="w-full shrink-0 border-white/80 bg-white text-[#5d0a32] shadow-sm hover:bg-white/85 sm:w-auto">
            <a href="#resolution-actions" onClick={() => window.setTimeout(() => document.getElementById('resolution-actions')?.focus({ preventScroll: true }), 400)}>Tangani sekarang <ChevronDown /></a>
          </Button>
        ) : null}
      </section>

      <section aria-label={`Ringkasan kiriman ${tracking.tracking_number}`} className="overflow-hidden rounded-[1.5rem] bg-[#241f21] text-white shadow-[0_18px_48px_rgba(33,23,29,.12)] lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <div className="relative isolate flex min-h-56 flex-col justify-center overflow-hidden p-6 sm:min-h-64 sm:p-9">
          {cityImage ? (
            <Image src={cityImage.photo.src} alt={`Panorama kota ${cityImage.photo.city}`} fill priority quality={84} sizes="(max-width: 1023px) 100vw, 55vw" className="-z-20 object-cover object-center" />
          ) : (
            <><div className="absolute inset-0 -z-20 bg-[#30282b]" /><Image src="/brand/anteraja-favicon.png" alt="" width={180} height={180} className="absolute -right-5 -bottom-8 -z-10 size-44 rotate-[-12deg] object-contain opacity-[.08] brightness-0 invert" /></>
          )}
          {cityImage ? <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,18,20,.84)_0%,rgba(23,18,20,.65)_46%,rgba(23,18,20,.25)_100%)]" /> : null}
          <p className="text-xs font-bold uppercase tracking-[.16em] text-white/90">{tracking.service_type.replace('_', ' ')} shipment</p>
          <h1 className="mt-3 break-all text-3xl font-bold tracking-[-.045em] sm:text-4xl">{tracking.tracking_number}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-1 text-sm font-medium text-white/90"><span>{tracking.origin_city}</span><ChevronRight aria-hidden="true" className="size-4" /><span>{tracking.destination_city}</span></p>
          {cityImage ? <a href={cityImage.photo.source} target="_blank" rel="noopener noreferrer" className="absolute bottom-3 right-4 max-w-[75%] rounded-sm bg-[#181416]/75 px-2 py-1 text-right text-[10px] leading-4 text-white/90 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Foto {cityImage.photo.city}: {cityImage.photo.author} · {cityImage.photo.license}</a> : null}
        </div>
        <dl className="grid grid-cols-2 content-center gap-x-6 gap-y-5 p-6 sm:gap-x-9 sm:p-9">
          <div className="min-w-0"><dt className="text-xs text-white/65">Estimasi tiba</dt><dd className="mt-1 font-semibold tabular">{formatDate(tracking.estimated_delivery_at, false)}</dd></div>
          <div className="min-w-0"><dt className="text-xs text-white/65">Penerima</dt><dd className="mt-1 break-words font-semibold">{tracking.recipient_name ?? '—'}</dd></div>
          <div className="col-span-2 border-t border-white/15 pt-4"><dt className="text-xs text-white/65">Posisi terakhir</dt><dd className="mt-1 font-semibold">{tracking.current_location ?? 'Belum tersedia'}</dd></div>
        </dl>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
        <Timeline tracking={tracking} />
        <aside className="space-y-5">
          <ShipmentSummary tracking={tracking} />
          <NotificationCard awb={awb} code={code} />
        </aside>
      </div>

      {journey ? <JourneyMapDisclosure journey={journey} /> : null}

      {tracking.risk_status === 'action_required' ? <ResolutionCard awb={awb} code={code} onSuccess={load} /> : null}
      {viewerRole === 'consumer' || viewerRole === 'seller' ? <SupportCard awb={awb} code={code} /> : <section aria-labelledby="support-access-title" className="mt-5 rounded-xl bg-[#f0edef] p-5 sm:p-6"><h2 id="support-access-title" className="section-title">Butuh bantuan pengiriman?</h2><p className="mt-2 text-sm text-muted-foreground">{viewerRole === 'admin' ? 'Tiket dibuat oleh Konsumen atau Seller. Pantau laporan masuk di ruang Admin.' : 'Masuk sebagai Konsumen atau Seller untuk membuat tiket CS. Resi dan kode akses tetap diperlukan untuk laporan dari halaman ini.'}</p><Link href={viewerRole === 'admin' ? '/admin/tiket' : '/masuk'} className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4">{viewerRole === 'admin' ? 'Lihat tiket masuk →' : 'Masuk untuk membuat tiket →'}</Link></section>}
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
  return <section id="resolution-actions" tabIndex={-1} aria-labelledby="resolution-title" className="surface mt-5 scroll-mt-6 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><header className="border-b bg-accent/50 p-5 sm:p-6"><p className="eyebrow">Perlu tindakan</p><h2 id="resolution-title" className="mt-2 text-xl font-semibold tracking-tight">Bantu kurir menyelesaikan pengiriman</h2><p className="mt-2 text-base text-pretty text-muted-foreground sm:text-sm">Pilih satu instruksi. Demi keamanan, perubahan dibatasi satu kali per hari.</p></header>
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
    try {
      const response = await fetch(`/api/v1/tracking/${encodeURIComponent(awb)}/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tracking-code': code }, body: JSON.stringify({ whatsapp: next, email: false, push: false }) });
      const body = await response.json() as ApiResponse<unknown>;
      if (body.success) { setEnabled(next); setSaved(next ? 'Notifikasi aktif' : 'Notifikasi dimatikan'); } else setSaved(body.error.message);
    } catch { setSaved('Koneksi terputus. Coba simpan lagi.'); }
    finally { setBusy(false); }
  }
  return <section className="surface p-5 sm:p-6"><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><BellRing className="size-4" /></div><div><h2 className="section-title">Update bermakna</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Terima WhatsApp hanya saat estimasi atau tindakan berubah.</p></div></div><Button onClick={() => void toggle()} disabled={busy} variant={enabled ? 'secondary' : 'outline'} className="mt-4 w-full">{enabled ? <Check /> : <BellRing />}{busy ? 'Menyimpan…' : enabled ? 'Notifikasi aktif' : 'Aktifkan WhatsApp'}</Button><p aria-live="polite" className="mt-2 min-h-4 text-xs text-muted-foreground">{saved}</p></section>;
}

function SupportCard({ awb, code }: { awb: string; code: string }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [note, setNote] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); const note = new FormData(event.currentTarget).get('note');
    try {
      const response = await fetch(`/api/v1/tracking/${encodeURIComponent(awb)}/escalate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tracking-code': code }, body: JSON.stringify({ note }) });
      const body = await response.json() as ApiResponse<{ ticket_number: string }>;
      setMessage(body.success ? `Tiket ${body.data.ticket_number} dibuat. Konteks perjalanan sudah dilampirkan.` : body.error.message);
    } catch { setMessage('Koneksi terputus. Coba kirim lagi.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="support-title" className="mt-5 rounded-2xl bg-[#f0edef] p-5 sm:p-6"><header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary"><Headphones className="size-5" /></div><div className="min-w-0"><h2 id="support-title" className="text-lg font-semibold">Masih butuh bantuan?</h2><p className="mt-1 max-w-[70ch] text-base text-pretty text-muted-foreground sm:text-sm">Tiket otomatis membawa resi, timeline, kendala, dan lokasi terakhir. Kamu cukup menambahkan detail yang belum tercatat.</p></div></div>{!open ? <Button type="button" variant="outline" className="w-full shrink-0 bg-white sm:w-auto" onClick={() => setOpen(true)}>Tulis laporan</Button> : null}</header>{open ? <form onSubmit={submit} className="mt-6 grid gap-4"><label htmlFor="support-note" className="grid gap-2 text-base font-semibold sm:text-sm">Ceritakan kendalanya<Textarea id="support-note" name="note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: Kurir belum menemukan gang rumah. Patokannya minimarket di seberang jalan, lalu masuk sekitar 50 meter." maxLength={500} rows={6} aria-describedby="support-note-help" /></label><div id="support-note-help" className="flex flex-col gap-1 text-base text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-sm"><p>Maksimal 500 karakter. Data paket dan lima perjalanan terakhir otomatis dilampirkan.</p><p className="shrink-0 tabular">{note.length}/500</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><Button type="submit" disabled={busy}>{busy ? 'Membuat…' : 'Kirim laporan ke CS'}</Button><p className="text-base font-semibold text-emerald-700 sm:text-sm" aria-live="polite">{message}</p></div></form> : null}</section>;
}

function TrackingSkeleton() {
  return <div className="animate-pulse py-10"><div className="h-52 rounded-[1.5rem] bg-[#21171d]/10" /><div className="mt-5 h-24 rounded-2xl bg-muted" /><div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]"><div className="h-[520px] rounded-xl bg-muted" /><div className="h-64 rounded-xl bg-muted" /></div><p className="sr-only">Memuat status kiriman</p></div>;
}
