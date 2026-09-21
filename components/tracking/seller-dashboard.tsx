'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, Download, PackageSearch, Search, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RiskStatus, SellerShipment } from '@/lib/tracking/types';
import { cn } from '@/lib/utils';

const filters: Array<{ value: 'all' | RiskStatus; label: string }> = [
  { value: 'all', label: 'Semua' }, { value: 'on_track', label: 'Sesuai jadwal' },
  { value: 'at_risk', label: 'Berisiko' }, { value: 'action_required', label: 'Perlu tindakan' },
  { value: 'resolved', label: 'Ditangani' },
];
const meta: Record<RiskStatus, { label: string; className: string }> = {
  on_track: { label: 'Sesuai jadwal', className: 'status-success' },
  at_risk: { label: 'Berisiko', className: 'status-warning' },
  action_required: { label: 'Perlu tindakan', className: 'status-danger' },
  resolved: { label: 'Ditangani', className: 'text-sky-700' },
};

export function SellerDashboard({ shipments }: { shipments: SellerShipment[] }) {
  const [filter, setFilter] = useState<'all' | RiskStatus>('all');
  const [query, setQuery] = useState('');
  const visible = useMemo(() => shipments.filter((shipment) => {
    const matchesFilter = filter === 'all' || shipment.risk_status === filter;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [shipment.tracking_number, shipment.recipient_name, shipment.destination_city].some((value) => value?.toLowerCase().includes(needle));
    return matchesFilter && matchesQuery;
  }), [filter, query, shipments]);

  function exportData(type: 'csv' | 'json') {
    const contents = type === 'json' ? JSON.stringify(visible, null, 2) : [
      ['resi','status_risiko','status_pengiriman','penerima','tujuan','estimasi','lokasi_terakhir'],
      ...visible.map((x) => [x.tracking_number, x.risk_status, x.delivery_status, x.recipient_name ?? '', x.destination_city ?? '', x.estimated_delivery_at ?? '', x.current_location ?? '']),
    ].map((row) => row.map((value) => `"${String(value).replaceAll('"','""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([contents], { type: type === 'json' ? 'application/json' : 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `anteraja-kiriman-${new Date().toISOString().slice(0,10)}.${type}`; link.click(); URL.revokeObjectURL(url);
  }

  const counts = (risk: RiskStatus) => shipments.filter((x) => x.risk_status === risk).length;
  return <div className="space-y-5">
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric icon={PackageSearch} label="Kiriman aktif" value={shipments.length} detail="Dalam pemantauan" />
      <Metric icon={CheckCircle2} label="Sesuai jadwal" value={counts('on_track')} detail="Tidak perlu aksi" tone="success" />
      <Metric icon={Clock3} label="Berisiko" value={counts('at_risk')} detail="Pantau lebih dekat" tone="warning" />
      <Metric icon={ShieldAlert} label="Perlu tindakan" value={counts('action_required')} detail="Prioritas hari ini" tone="danger" />
    </section>

    <section className="surface overflow-hidden">
      <div className="border-b p-4 sm:p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-1 overflow-x-auto">{filters.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={cn('shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition', filter === item.value ? 'bg-[#21171d] text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>{item.label}<span className="ml-1.5 opacity-55">{item.value === 'all' ? shipments.length : counts(item.value)}</span></button>)}</div>
        <div className="flex gap-2"><label className="relative min-w-0 flex-1 xl:w-64"><span className="sr-only">Cari kiriman</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari resi, penerima, kota" className="pl-9" /></label><Button variant="outline" size="icon" title="Ekspor CSV" onClick={() => exportData('csv')}><Download /></Button><Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => exportData('json')}>JSON</Button></div>
      </div></div>
      <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Kiriman</th><th>Tujuan</th><th>Status</th><th>Estimasi</th><th>Posisi terakhir</th><th><span className="sr-only">Buka</span></th></tr></thead><tbody>
        {visible.map((shipment) => <tr key={shipment.id} className="group hover:bg-[#fcfbfb]"><td><Link href={`/pengiriman/${shipment.tracking_number}`} className="font-bold hover:text-primary">{shipment.tracking_number}</Link><p className="mt-1 text-xs text-muted-foreground">{shipment.recipient_name ?? 'Penerima tidak tersedia'} · {shipment.service_type.replace('_',' ')}</p></td><td>{shipment.destination_city ?? '—'}</td><td><span className={cn('status', meta[shipment.risk_status].className)}>{meta[shipment.risk_status].label}</span>{shipment.exception_reason ? <p className="mt-1 max-w-52 text-xs text-muted-foreground line-clamp-1">{shipment.exception_reason}</p> : null}</td><td className="whitespace-nowrap text-xs tabular">{shipment.estimated_delivery_at ? new Intl.DateTimeFormat('id-ID',{ dateStyle:'medium' }).format(new Date(shipment.estimated_delivery_at)) : '—'}</td><td className="max-w-48 text-xs text-muted-foreground">{shipment.current_location ?? '—'}</td><td><Button variant="ghost" size="icon" asChild><Link href={`/pengiriman/${shipment.tracking_number}`} aria-label={`Buka ${shipment.tracking_number}`}><ArrowUpRight /></Link></Button></td></tr>)}
        {!visible.length ? <tr><td colSpan={6} className="py-14 text-center text-muted-foreground"><AlertTriangle className="mx-auto mb-3 size-5" />Tidak ada kiriman yang cocok.</td></tr> : null}
      </tbody></table></div>
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value, detail, tone = 'neutral' }: { icon: typeof PackageSearch; label: string; value: number; detail: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const colors = { neutral: 'bg-accent text-primary', success: 'bg-emerald-50 text-emerald-700', warning: 'bg-amber-50 text-amber-700', danger: 'bg-rose-50 text-rose-700' };
  return <article className="surface surface-lift p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold tracking-[-.05em] tabular">{value}</p></div><div className={cn('flex size-10 items-center justify-center rounded-xl', colors[tone])}><Icon className="size-5" /></div></div><p className="mt-4 text-xs text-muted-foreground">{detail}</p></article>;
}
