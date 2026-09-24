import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/ui/site-header';

type Props = { params: Promise<{ awb: string }> };

export default async function AdminShipmentDetail({ params }: Props) {
  const user = await requireRole(['admin']);
  const { awb } = await params;
  const supabase = await createClient();
  const { data: shipment, error } = await supabase.from('shipments').select('id, user_id, tracking_number, service_type, delivery_status, risk_status, origin_city, destination_city, recipient_name, current_location, exception_reason, estimated_delivery_at, last_scan_at').eq('id', awb).maybeSingle();
  if (error || !shipment) notFound();
  const [events, resolutions, tickets] = await Promise.all([
    supabase.from('shipment_events').select('id, status_label, description, location, occurred_at').eq('shipment_id', shipment.id).order('occurred_at', { ascending: false }).limit(30),
    supabase.from('shipment_resolutions').select('id, resolution_type, status, submitted_at').eq('shipment_id', shipment.id).order('submitted_at', { ascending: false }).limit(10),
    supabase.from('support_tickets').select('id, ticket_number, status, customer_note, created_at').eq('shipment_id', shipment.id).order('created_at', { ascending: false }).limit(10),
  ]);
  const date = (value: string | null) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
  return <><SiteHeader userName={user.name || user.email} role={user.role} /><main id="main-content" className="app-main max-w-5xl space-y-6"><Link href="/admin/kiriman" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">← Semua kiriman</Link>
    <header className="surface-flat p-6"><p className="eyebrow">Detail operasional</p><h1 className="page-title">{shipment.tracking_number}</h1><p className="page-copy">{shipment.origin_city || 'Asal belum tersedia'} → {shipment.destination_city || 'Tujuan belum tersedia'}</p><dl className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3"><div><dt className="text-xs text-muted-foreground">Risiko</dt><dd className="mt-1 font-semibold">{shipment.risk_status === 'action_required' ? 'Perlu tindakan' : shipment.risk_status === 'at_risk' ? 'Berisiko' : 'Dalam pemantauan'}</dd></div><div><dt className="text-xs text-muted-foreground">Posisi terakhir</dt><dd className="mt-1 font-semibold">{shipment.current_location || 'Belum tersedia'}</dd></div><div><dt className="text-xs text-muted-foreground">Estimasi tiba</dt><dd className="mt-1 font-semibold">{date(shipment.estimated_delivery_at)}</dd></div></dl></header>
    {shipment.exception_reason ? <section className="surface-flat p-6"><h2 className="section-title">Kendala yang diketahui</h2><p className="mt-2 text-sm leading-6">{shipment.exception_reason}</p></section> : null}
    <section className="grid gap-5 lg:grid-cols-2"><article className="surface-flat p-6"><h2 className="section-title">Riwayat perjalanan</h2>{events.error ? <p role="alert" className="mt-3 text-sm text-destructive">Riwayat belum dapat dimuat.</p> : <ol className="mt-4 divide-y">{(events.data ?? []).map((item) => <li key={item.id} className="py-3"><h3 className="text-sm font-semibold">{item.status_label}</h3><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">{item.location} · {date(item.occurred_at)}</p></li>)}</ol>}</article><div className="space-y-5"><article className="surface-flat p-6"><h2 className="section-title">Instruksi penerima</h2>{resolutions.error ? <p role="alert" className="mt-3 text-sm text-destructive">Instruksi belum dapat dimuat.</p> : (resolutions.data ?? []).length ? <ul className="mt-4 divide-y">{(resolutions.data ?? []).map((item) => <li className="py-3 text-sm" key={item.id}><strong>{item.resolution_type.replaceAll('_', ' ')}</strong><span className="ml-2 text-muted-foreground">{item.status} · {date(item.submitted_at)}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Belum ada instruksi penerima.</p>}</article><article className="surface-flat p-6"><h2 className="section-title">Tiket CS</h2>{tickets.error ? <p role="alert" className="mt-3 text-sm text-destructive">Tiket belum dapat dimuat.</p> : (tickets.data ?? []).length ? <ul className="mt-4 divide-y">{(tickets.data ?? []).map((item) => <li className="py-3 text-sm" key={item.id}><strong>{item.ticket_number}</strong> · {item.status}<p className="mt-1 text-muted-foreground">{item.customer_note || 'Tidak ada catatan tambahan.'}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Belum ada tiket untuk resi ini.</p>}</article></div></section>
  </main></>;
}
