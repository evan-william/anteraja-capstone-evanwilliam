'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryRow } from '@/lib/supabase/types';

import { CategoryForm } from './category-form';
import { CategoryList } from './category-list';

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const expense = categories.filter((category) => category.type === 'expense');
  const income = categories.filter((category) => category.type === 'income');

  function refresh() {
    setError(null);
    router.refresh();
  }

  return (
    <section aria-label="Pengelolaan kategori" className="page-enter reveal-1 space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Tambah kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm onCreated={refresh} />
        </CardContent>
      </Card>

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <section aria-label="Daftar kategori" className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>Pengeluaran</CardTitle><span className="text-xs text-muted-foreground">{expense.length} kategori</span></CardHeader><CardContent><CategoryList categories={expense} onChanged={refresh} onError={setError} /></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>Pemasukan</CardTitle><span className="text-xs text-muted-foreground">{income.length} kategori</span></CardHeader><CardContent><CategoryList categories={income} onChanged={refresh} onError={setError} /></CardContent></Card>
      </section>
    </section>
  );
}
