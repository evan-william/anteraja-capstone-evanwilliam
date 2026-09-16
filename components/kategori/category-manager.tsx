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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm onCreated={refresh} />
        </CardContent>
      </Card>

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryList categories={expense} onChanged={refresh} onError={setError} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pemasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryList categories={income} onChanged={refresh} onError={setError} />
        </CardContent>
      </Card>
    </div>
  );
}
