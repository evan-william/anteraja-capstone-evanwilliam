import Link from 'next/link';

import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = { title: 'Ruang Seller — Anteraja' };

export default async function SellerHomePage() {
  const user = await requireRole(['seller']);
  const supabase = await createClient();
  const [shipmentsResult, settlementsResult] = await Promise.all([
    supabase.from('shipments').select('id, tracking_number, risk_status, destination_city, estimated_delivery_at').eq('user_id', user.id).not('delivery_status', 'in', '(delivered,returned,cancelled)').order('estimated_delivery_at').limit(100),
    supabase.from('settlements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);
  const shipments = shipmentsResult.data ?? [];
  const urgent = shipments.filter((item) => item.risk_status === 'action_required');
  return <><SiteHeader userName={user.name || user.email} role={user.role} /><main id="main-content" className="app-main page-enter space-y-7"><PageHeader eyebrow="Ruang Seller" title="Kiriman dan arus dana" description="Lihat pesanan toko yang perlu ditindaklanjuti, lalu cocokkan settlement dengan mutasi bank." />
    {shipmentsResult.error ? <p role="alert" className="text-sm text-destructive">Kiriman belum dapat dimuat. Periksa koneksi lalu coba lagi.</p> : <><section aria-label="Ringkasan Seller" className="grid gap-3 sm:grid-cols-3"><Metric label="Kiriman aktif" value={shipments.length} /><Metric label="Perlu tindakan" value={urgent.length} /><Metric label="Settlement tercatat" value={settlementsResult.count ?? 0} /></section>
      <section className="grid gap-4 md:grid-cols-2"><article className="surface-flat p-6"><h2 className="section-title">Pengiriman toko</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Pantau hanya kiriman milik akun ini; cari resi, filter risiko, dan ekspor daftar.</p><Link className="mt-5 inline-block font-semibold text-primary underline underline-offset-4" href="/pengiriman">Buka pengiriman →</Link></article><article className="surface-flat p-6"><h2 className="section-title">Rekonsiliasi bank</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Tinjau mutasi sebelum menyimpan transaksi dan kaitkan dengan settlement.</p><Link className="mt-5 inline-block font-semibold text-primary underline underline-offset-4" href="/import">Buka rekonsiliasi →</Link></article></section>
      {urgent.length ? <section className="surface-flat p-6"><h2 className="section-title">Perlu ditindaklanjuti</h2><ul className="mt-4 divide-y">{urgent.slice(0, 5).map((item) => <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={item.id}><span><strong>{item.tracking_number}</strong><span className="ml-3 text-sm text-muted-foreground">{item.destination_city || 'Tujuan belum tersedia'}</span></span><Link className="text-sm font-semibold text-primary underline-offset-4 hover:underline" href={`/pengiriman/${encodeURIComponent(item.tracking_number)}`}>Lihat detail</Link></li>)}</ul></section> : null}
    </>}
  </main></>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="surface-flat p-5"><h2 className="truncate text-xs font-semibold text-muted-foreground">{label}</h2><p className="mt-2 text-3xl font-bold tabular">{value}</p></article>;
}
