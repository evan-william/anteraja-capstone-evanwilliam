import Link from 'next/link';

import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';

type Props = { searchParams: Promise<{ q?: string; risiko?: string; halaman?: string }> };
const risks = ['all', 'action_required', 'at_risk', 'on_track', 'resolved'] as const;
const riskNames: Record<string, string> = { action_required: 'Perlu tindakan', at_risk: 'Berisiko', on_track: 'Sesuai jadwal', resolved: 'Ditangani' };
const pageSize = 25;

export const metadata = { title: 'Semua Kiriman — Anteraja' };

export default async function AdminShipmentsPage({ searchParams }: Props) {
  const user = await requireRole(['admin']);
  const params = await searchParams;
  const q = (params.q ?? '').trim().slice(0, 40).replace(/[^a-zA-Z0-9\s-]/g, '');
  const risk = risks.find((item) => item === params.risiko) ?? 'all';
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.halaman ?? '1', 10) || 1));
  const supabase = await createClient();
  let query = supabase.from('shipments').select('id, tracking_number, service_type, delivery_status, risk_status, recipient_name, destination_city, current_location, estimated_delivery_at', { count: 'exact' });
  if (risk !== 'all') query = query.eq('risk_status', risk);
  if (q) query = query.or(`tracking_number.ilike.%${q}%,recipient_name.ilike.%${q}%,destination_city.ilike.%${q}%`);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  const pageUrl = (next: number) => `/admin/kiriman?${new URLSearchParams({ q, risiko: risk, halaman: String(next) })}`;
  return <><SiteHeader userName={user.name || user.email} role={user.role} /><main id="main-content" className="app-main page-enter space-y-6"><PageHeader eyebrow="Operasi Anteraja" title="Semua kiriman" description="Cari resi, penerima, atau kota. Daftar ini melintasi akun Seller dan hanya dapat dibaca petugas Admin." />
    <form action="/admin/kiriman" className="surface-flat flex flex-wrap items-end gap-3 p-4"><label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold" htmlFor="admin-shipment-search">Cari kiriman<input id="admin-shipment-search" name="q" defaultValue={q} maxLength={40} placeholder="Resi, penerima, kota" className="h-10 rounded-md border bg-white px-3 font-normal" /></label><label className="grid gap-1 text-sm font-semibold" htmlFor="admin-risk">Risiko<select id="admin-risk" name="risiko" defaultValue={risk} className="h-10 min-w-44 rounded-md border bg-white px-3 font-normal"><option value="all">Semua risiko</option>{risks.filter((value) => value !== 'all').map((value) => <option key={value} value={value}>{riskNames[value]}</option>)}</select></label><button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c9006d]">Terapkan</button></form>
    {error ? <p role="alert" className="text-sm text-destructive">Kiriman belum dapat dimuat. Periksa koneksi lalu coba lagi.</p> : <section aria-label="Hasil pencarian pengiriman" className="surface-flat overflow-hidden"><div className="border-b px-5 py-3 text-sm text-muted-foreground">{count ?? 0} kiriman ditemukan · halaman {page}</div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th scope="col">Resi</th><th scope="col">Penerima</th><th scope="col">Tujuan</th><th scope="col">Status</th><th scope="col">Posisi terakhir</th></tr></thead><tbody>{(data ?? []).map((item) => <tr key={item.id}><td><Link href={`/admin/pengiriman/${item.id}`} className="font-semibold text-primary underline-offset-4 hover:underline">{item.tracking_number}</Link><p className="text-xs text-muted-foreground">{item.service_type.replace('_', ' ')}</p></td><td>{item.recipient_name || '—'}</td><td>{item.destination_city || '—'}</td><td>{riskNames[item.risk_status] || item.delivery_status}</td><td>{item.current_location || '—'}</td></tr>)}{!data?.length ? <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Tidak ada kiriman yang sesuai. Ubah pencarian atau filter.</td></tr> : null}</tbody></table></div><nav aria-label="Halaman hasil" className="flex justify-between border-t px-5 py-4 text-sm font-semibold"><span>{page > 1 ? <Link href={pageUrl(page - 1)} className="text-primary underline-offset-4 hover:underline">← Sebelumnya</Link> : null}</span><span>{page * pageSize < (count ?? 0) ? <Link href={pageUrl(page + 1)} className="text-primary underline-offset-4 hover:underline">Berikutnya →</Link> : null}</span></nav></section>}
  </main></>;
}
