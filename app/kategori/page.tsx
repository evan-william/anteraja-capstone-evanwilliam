import { redirect } from 'next/navigation';

import { CategoryManager } from '@/components/kategori/category-manager';
import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Kategori — Anteraja Finance' };

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
      <main id="main-content" className="app-main max-w-5xl">
        <PageHeader eyebrow="Aturan pencatatan" title="Kelola kategori" description="Pisahkan COD, ongkir, retur, dan biaya layanan agar setiap settlement mudah ditelusuri." />

        {error ? (
          <p className="text-sm text-destructive">Kategori belum dapat dimuat. Periksa koneksi lalu muat ulang halaman.</p>
        ) : (
          <CategoryManager categories={data ?? []} />
        )}
      </main>
    </>
  );
}
