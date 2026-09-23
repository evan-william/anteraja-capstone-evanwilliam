import Link from 'next/link';

import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = { title: 'Paket Saya — Anteraja' };

export default async function ConsumerHomePage() {
  const user = await requireRole(['consumer']);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_my_shipments');
  const shipments = data ?? [];
  return <><SiteHeader userName={user.name || user.email} role={user.role} /><main id="main-content" className="app-main page-enter space-y-7"><PageHeader eyebrow="Ruang Konsumen" title="Paket saya" description="Kiriman yang terhubung dengan akunmu, beserta posisi terakhir dan tindakan yang diperlukan. Untuk detail dan perubahan instruksi, masukkan kode akses dari pesan pengiriman." />
    {error ? <p role="alert" className="text-sm text-destructive">Paket belum dapat dimuat. Periksa koneksi dan coba lagi.</p> : shipments.length ? <section aria-label="Daftar paket saya" className="grid gap-3">{shipments.map((item) => <article className="surface-flat flex flex-wrap items-center justify-between gap-4 p-5" key={item.tracking_number}><div><p className="text-xs font-semibold text-muted-foreground">{item.service_type.replace('_', ' ')} · {item.origin_city} → {item.destination_city}</p><h2 className="mt-1 text-lg font-bold">{item.tracking_number}</h2><p className="mt-2 text-sm">{item.risk_status === 'action_required' ? 'Perlu tindakan' : item.risk_status === 'at_risk' ? 'Berisiko terlambat' : 'Dalam perjalanan'} · {item.current_location || 'Lokasi belum tersedia'}</p>{item.exception_reason ? <p className="mt-1 text-sm text-muted-foreground">{item.exception_reason}</p> : null}</div><Link href={`/lacak?resi=${encodeURIComponent(item.tracking_number)}`} className="text-sm font-semibold text-primary underline underline-offset-4">Lacak dengan kode akses →</Link></article>)}</section> : <section className="surface-flat p-7"><h2 className="section-title">Belum ada paket terhubung</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Akun Konsumen hanya menampilkan kiriman yang telah diverifikasi dan dihubungkan. Untuk resi lain, gunakan pencarian publik dengan kode akses enam digit.</p><Link className="mt-5 inline-block font-semibold text-primary underline underline-offset-4" href="/lacak">Lacak dengan resi →</Link></section>}
    <p className="text-xs text-muted-foreground">Memiliki kode aktivasi petugas? <Link className="underline underline-offset-4" href="/aktivasi-admin">Aktivasi Admin</Link>.</p>
  </main></>;
}
