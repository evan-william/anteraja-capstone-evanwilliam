import { redirect } from 'next/navigation';

import { ImportManager } from '@/components/import/import-manager';
import { SiteHeader } from '@/components/ui/site-header';
import { getCurrentUser } from '@/lib/auth';
import type { ImportCategory, ImportHistory } from '@/lib/import/types';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Rekonsiliasi — Anteraja Finance' };

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
          <p className="eyebrow">Operasional keuangan</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Rekonsiliasi settlement</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Cocokkan mutasi rekening dengan pencatatan settlement pengiriman. Semua baris ditinjau sebelum disimpan.</p>
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
