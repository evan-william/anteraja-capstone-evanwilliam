import { redirect } from 'next/navigation';

import {
  TransactionManager,
  type TransactionWithCategory,
} from '@/components/transaksi/transaction-manager';
import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Arus Dana — Anteraja Finance' };

export default async function TransaksiPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/masuk');

  const supabase = await createClient();

  const [transactionsResult, categoriesResult] = await Promise.all([
    supabase
      .from('transactions')
      .select(
        'id, user_id, category_id, amount, description, transaction_date, is_deleted, created_at, updated_at, categories ( id, name, type )',
      )
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('categories')
      .select('id, user_id, name, type, is_archived, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('type', { ascending: true })
      .order('name', { ascending: true }),
  ]);

  const failed = transactionsResult.error || categoriesResult.error;

  return (
    <>
      <SiteHeader userName={user.name || user.email} />
      <main id="main-content" className="app-main max-w-5xl">
        <PageHeader eyebrow="Keuangan operasional" title="Arus dana" description="Catat settlement masuk dan biaya pengiriman. Data terbaru ditampilkan lebih dahulu." />

        {failed ? (
          <p className="text-sm text-destructive">Data transaksi belum dapat dimuat. Periksa koneksi lalu muat ulang halaman.</p>
        ) : (
          <TransactionManager
            transactions={(transactionsResult.data ?? []) as TransactionWithCategory[]}
            categories={categoriesResult.data ?? []}
          />
        )}
      </main>
    </>
  );
}
