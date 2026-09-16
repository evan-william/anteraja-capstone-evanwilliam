import { redirect } from 'next/navigation';

import { ImportManager } from '@/components/import/import-manager';
import { SiteHeader } from '@/components/ui/site-header';
import { getCurrentUser } from '@/lib/auth';
import type { ImportCategory, ImportHistory } from '@/lib/import/types';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Import Mutasi — Expense Tracker' };

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/masuk');
  const supabase = await createClient();
  const [categoriesResult, historyResult] = await Promise.all([
    supabase.from('categories').select('id, name, type').eq('user_id', user.id).eq('is_archived', false).order('name'),
    supabase.from('bank_imports').select('id, file_name, bank, new_count, matched_count, error_count, status, cancelled_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ]);

  return (
    <>
      <SiteHeader userName={user.name || user.email} />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Import mutasi bank</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tinjau hasil sebelum transaksi baru disimpan.</p>
        </div>
        {categoriesResult.error || historyResult.error ? (
          <AlertLoadError />
        ) : (
          <ImportManager
            initialCategories={(categoriesResult.data ?? []) as ImportCategory[]}
            initialHistory={(historyResult.data ?? []) as ImportHistory[]}
          />
        )}
      </main>
    </>
  );
}

function AlertLoadError() {
  return <p className="text-sm text-destructive">Gagal memuat data impor. Pastikan migrasi database sudah diterapkan.</p>;
}
