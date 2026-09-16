import { redirect } from 'next/navigation';

import { CategoryManager } from '@/components/kategori/category-manager';
import { SiteHeader } from '@/components/ui/site-header';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Kategori — Expense Tracker' };

export default async function KategoriPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/masuk');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, user_id, name, type, is_archived, created_at, updated_at')
    .eq('user_id', user.id)
    .order('is_archived', { ascending: true })
    .order('name', { ascending: true });

  return (
    <>
      <SiteHeader userName={user.name || user.email} />
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-semibold">Kelola Kategori</h1>

        {error ? (
          <p className="text-sm text-destructive">Gagal memuat kategori. Coba muat ulang halaman.</p>
        ) : (
          <CategoryManager categories={data ?? []} />
        )}
      </main>
    </>
  );
}
