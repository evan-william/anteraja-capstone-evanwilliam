import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatRupiah } from '@/lib/format';
import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = { title: 'Ringkasan Finance — Anteraja' };

const statusLabel: Record<string, string> = {
  draft: 'Draf', paid: 'Dibayar', reconciled: 'Direkonsiliasi', disputed: 'Disengketakan', cancelled: 'Dibatalkan',
};

export default async function AdminFinancePage() {
  const user = await requireRole(['admin']);
  const supabase = await createClient();
  const [settlementResult, importResult, transactionResult, usersResult] = await Promise.all([
    supabase.from('settlements').select('id, user_id, reference, settlement_date, status, gross_amount, fee_amount, return_amount, net_amount', { count: 'exact' }).order('settlement_date', { ascending: false }).limit(100),
    supabase.from('bank_imports').select('id', { count: 'exact', head: true }),
    supabase.from('transactions').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id, name, email'),
  ]);
  const settlements = settlementResult.data ?? [];
  const sellerNames = new Map((usersResult.data ?? []).map((item) => [item.id, item.name || item.email]));
  const failed = settlementResult.error || importResult.error || transactionResult.error || usersResult.error;
  return <><SiteHeader userName={user.name || user.email} role={user.role} /><main id="main-content" className="app-main page-enter space-y-6"><PageHeader eyebrow="Operasi Anteraja" title="Ringkasan Finance" description="Baca jejak settlement lintas Seller. Perubahan kategori, transaksi, dan mutasi tetap dikerjakan oleh pemilik akun Seller." />
    {failed ? <p role="alert" className="text-sm text-destructive">Ringkasan Finance belum dapat dimuat. Periksa koneksi lalu coba lagi.</p> : <><section aria-label="Ringkasan data Finance" className="grid gap-3 sm:grid-cols-3"><Metric label="Settlement" value={settlementResult.count ?? 0} /><Metric label="Impor bank" value={importResult.count ?? 0} /><Metric label="Transaksi" value={transactionResult.count ?? 0} /></section>
      <section aria-label="Daftar settlement" className="surface-flat overflow-hidden"><header className="border-b px-5 py-4"><h2 className="section-title">Settlement lintas Seller</h2><p className="mt-1 text-sm text-muted-foreground">Read-only. Nominal bersih berasal dari perhitungan database, bukan input manual.</p></header><div className="overflow-x-auto"><table className="data-table"><thead><tr><th scope="col">Referensi</th><th scope="col">Seller</th><th scope="col">Tanggal</th><th scope="col">Status</th><th scope="col">Bruto</th><th scope="col">Bersih</th></tr></thead><tbody>{settlements.map((item) => <tr key={item.id}><td className="font-semibold">{item.reference}</td><td>{sellerNames.get(item.user_id) || 'Seller tidak tersedia'}</td><td className="whitespace-nowrap">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(item.settlement_date))}</td><td>{statusLabel[item.status] || item.status}</td><td className="whitespace-nowrap tabular">{formatRupiah(item.gross_amount)}</td><td className="whitespace-nowrap font-semibold tabular">{formatRupiah(item.net_amount)}</td></tr>)}{!settlements.length ? <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Belum ada settlement tercatat.</td></tr> : null}</tbody></table></div></section>
    </>}
  </main></>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="surface-flat p-5"><h2 className="truncate text-xs font-semibold text-muted-foreground">{label}</h2><p className="mt-2 text-3xl font-bold tabular">{value}</p></article>;
}
