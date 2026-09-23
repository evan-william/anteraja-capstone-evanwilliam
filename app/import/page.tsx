import { ImportManager } from '@/components/import/import-manager';
import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';
import { requireRole } from '@/lib/auth';
import type { ImportCategory, ImportHistory } from '@/lib/import/types';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Rekonsiliasi — Anteraja Finance' };

export default async function ImportPage() {
  const user = await requireRole(['seller']);
  const supabase = await createClient();
  const [categoriesResult, historyResult] = await Promise.all([
    supabase.from('categories').select('id, name, type').eq('user_id', user.id).eq('is_archived', false).order('name'),
    supabase.from('bank_imports').select('id, file_name, bank, new_count, matched_count, error_count, status, cancelled_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ]);

  return (
    <>
      <SiteHeader userName={user.name || user.email} role={user.role} />
      <main id="main-content" className="app-main">
        <PageHeader eyebrow="Mutasi dan settlement" title="Rekonsiliasi bank" description="Cocokkan mutasi rekening dengan settlement pengiriman. Tidak ada data yang disimpan sebelum kamu meninjau hasilnya." />
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
  return <p className="text-sm text-destructive">Data rekonsiliasi belum dapat dimuat. Pastikan migrasi database sudah diterapkan, lalu muat ulang.</p>;
}
