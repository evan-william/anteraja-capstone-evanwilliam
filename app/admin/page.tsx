import Link from 'next/link';

import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';
import { OperationsAssistant } from '@/components/admin/operations-assistant';

export const metadata = { title: 'Pusat Operasi — Anteraja' };

export default async function AdminHomePage() {
  const user = await requireRole(['admin']);
  const supabase = await createClient();
  const { data, error } = await supabase.from('shipments')
    .select('id, tracking_number, service_type, delivery_status, risk_status, destination_city, current_location, exception_reason, estimated_delivery_at')
    .not('delivery_status', 'in', '(delivered,returned,cancelled)')
    .order('estimated_delivery_at', { ascending: true }).limit(500);
  const shipments = data ?? [];
  const urgent = shipments.filter((item) => item.risk_status === 'action_required');
  const risk = shipments.filter((item) => item.risk_status === 'at_risk');

  return <>
    <SiteHeader userName={user.name || user.email} role={user.role} />
    <main id="main-content" className="app-main space-y-7">
      <PageHeader eyebrow="Operasi Anteraja" title="Pusat operasi" description="Semua kiriman aktif yang membutuhkan perhatian, melintasi akun Seller. Mulai dari kendala yang bisa ditangani hari ini." />
      {error ? <p role="alert" className="text-sm text-destructive">Data pengiriman belum dapat dimuat. Periksa koneksi dan migrasi role, lalu muat ulang.</p> : <>
        <section aria-label="Ringkasan operasi" className="grid gap-3 sm:grid-cols-3">
          <Metric label="Aktif" value={shipments.length} tone="normal" />
          <Metric label="Perlu tindakan" value={urgent.length} tone="urgent" />
          <Metric label="Berisiko" value={risk.length} tone="warning" />
        </section>
        <section aria-labelledby="rescue-title" className="surface-flat overflow-hidden">
          <header className="border-b px-5 py-4">
            <h2 id="rescue-title" className="section-title">Tangani lebih dulu</h2>
            <p className="mt-1 text-sm text-muted-foreground">Prioritas dari alasan kendala dan estimasi tiba. <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/admin/kiriman">Lihat semua kiriman →</Link></p>
          </header>
          <div className="overflow-x-auto"><table className="data-table">
            <thead><tr><th scope="col">Resi</th><th scope="col">Tujuan</th><th scope="col">Posisi terakhir</th><th scope="col">Kendala</th><th scope="col">Estimasi</th></tr></thead>
            <tbody>{[...urgent.slice(0, 12), ...risk.slice(0, 8)].map((item) => <tr key={item.id}>
              <td><Link className="font-semibold text-primary underline-offset-4 hover:underline" href={`/admin/pengiriman/${item.id}`}>{item.tracking_number}</Link><p className="mt-1 text-xs text-muted-foreground">{item.service_type.replace('_', ' ')}</p></td>
              <td>{item.destination_city || '—'}</td><td>{item.current_location || '—'}</td>
              <td><span className={item.risk_status === 'action_required' ? 'font-semibold text-rose-800' : 'font-semibold text-amber-800'}>{item.risk_status === 'action_required' ? 'Perlu tindakan' : 'Berisiko'}</span><p className="mt-1 max-w-64 text-xs text-muted-foreground">{item.exception_reason || 'Perlu ditinjau'}</p></td>
              <td className="whitespace-nowrap text-xs">{item.estimated_delivery_at ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(item.estimated_delivery_at)) : '—'}</td>
            </tr>)}{!urgent.length && !risk.length ? <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Tidak ada kiriman aktif yang perlu ditangani saat ini.</td></tr> : null}</tbody>
          </table></div>
        </section>
        {shipments.length >= 500 ? <p className="text-xs text-muted-foreground">Menampilkan 500 kiriman aktif pertama. Filter lanjutan akan tersedia setelah pagination server diterapkan.</p> : null}
      </>}
    </main>
    <OperationsAssistant />
  </>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'normal' | 'urgent' | 'warning' }) {
  const appearance = tone === 'urgent' ? 'bg-[#f9d6df] text-[#85132c]' : tone === 'warning' ? 'bg-[#ffe8ab] text-[#713d06]' : 'bg-[#d5efe0] text-[#19543a]';
  return <article className={`rounded-xl p-5 ${appearance}`}><h2 className="truncate text-xs font-semibold">{label}</h2><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p></article>;
}
