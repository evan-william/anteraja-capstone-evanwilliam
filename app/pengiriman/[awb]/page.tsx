import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, CalendarClock, MapPin, ShieldAlert } from 'lucide-react';

import { SiteHeader } from '@/components/ui/site-header';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ awb: string }> };
export default async function SellerShipmentDetail({ params }: PageProps) {
  const user = await getCurrentUser(); if (!user) redirect('/masuk');
  const { awb } = await params; const supabase = await createClient();
  const shipmentResult = await supabase.from('shipments').select('*').eq('user_id', user.id).eq('tracking_number', decodeURIComponent(awb).toUpperCase()).maybeSingle();
  if (!shipmentResult.data) notFound();
  const shipment = shipmentResult.data;
  const [events, resolutions, tickets] = await Promise.all([
    supabase.from('shipment_events').select('*').eq('shipment_id', shipment.id).order('occurred_at', { ascending: false }),
    supabase.from('shipment_resolutions').select('*').eq('shipment_id', shipment.id).order('submitted_at', { ascending: false }),
    supabase.from('support_tickets').select('*').eq('shipment_id', shipment.id).order('created_at', { ascending: false }),
  ]);
  return <><SiteHeader userName={user.name || user.email} /><main className="app-main max-w-5xl"><Button variant="ghost" size="sm" asChild><Link href="/pengiriman"><ArrowLeft /> Kembali ke pengiriman</Link></Button>
    <section className="mt-5 rounded-[1.5rem] bg-[#21171d] p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff75bd]">Detail operasional</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-[-.045em]">{shipment.tracking_number}</h1><p className="mt-2 text-sm text-white/60">{shipment.origin_city} → {shipment.destination_city}</p></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{shipment.risk_status.replaceAll('_',' ')}</span></div></section>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><section className="surface p-6"><h2 className="section-title">Timeline</h2><ol className="mt-6 space-y-6">{(events.data ?? []).map((event) => <li key={event.id} className="flex gap-3"><span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><MapPin className="size-3.5" /></span><div><h3 className="text-sm font-bold">{event.status_label}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p><p className="mt-1 text-xs text-muted-foreground">{event.location} · {new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(event.occurred_at))}</p></div></li>)}</ol></section>
      <aside className="space-y-5"><section className="surface p-5"><h2 className="section-title">Konteks kendala</h2><div className="mt-4 flex gap-3"><ShieldAlert className="size-5 shrink-0 text-primary" /><p className="text-sm leading-6 text-muted-foreground">{shipment.exception_reason ?? 'Tidak ada kendala aktif.'}</p></div><div className="mt-4 flex gap-3"><CalendarClock className="size-5 shrink-0 text-primary" /><p className="text-sm"><span className="block text-xs text-muted-foreground">Estimasi tiba</span>{shipment.estimated_delivery_at ? new Intl.DateTimeFormat('id-ID',{dateStyle:'long'}).format(new Date(shipment.estimated_delivery_at)) : '—'}</p></div></section><section className="surface p-5"><h2 className="section-title">Tindak lanjut</h2><dl className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted p-3"><dt className="text-xs text-muted-foreground">Instruksi</dt><dd className="mt-1 text-xl font-bold">{resolutions.data?.length ?? 0}</dd></div><div className="rounded-xl bg-muted p-3"><dt className="text-xs text-muted-foreground">Tiket CS</dt><dd className="mt-1 text-xl font-bold">{tickets.data?.length ?? 0}</dd></div></dl></section></aside>
    </div></main></>;
}
