'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiResponse } from '@/lib/api';
import type { CategoryRow, TransactionRow } from '@/lib/supabase/types';

import { TransactionForm } from './transaction-form';
import { TransactionList, type TransactionDayGroup } from './transaction-list';

export type TransactionWithCategory = TransactionRow & {
  categories: Pick<CategoryRow, 'id' | 'name' | 'type'> | null;
};

type TransactionManagerProps = {
  transactions: TransactionWithCategory[];
  categories: CategoryRow[];
};

export function TransactionManager({ transactions, categories }: TransactionManagerProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<HTMLElement>(null);

  function refresh() {
    setError(null);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    const response = await fetch(`/api/v1/transactions/${id}`, { method: 'DELETE' });
    const body = (await response.json()) as ApiResponse<{ id: string }>;
    setPendingId(null);

    if (!body.success) {
      setError(body.error.message);
      return;
    }

    refresh();
  }

  /** Form ada di atas daftar, jadi gulirkan ke sana supaya mode ubah tidak terlewat. */
  function handleEdit(transaction: TransactionWithCategory) {
    setEditing(transaction);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Server sudah mengurutkan dari tanggal terbaru, jadi transaksi dengan tanggal sama
  // pasti berurutan dan cukup dikumpulkan sambil jalan.
  const groups: TransactionDayGroup[] = [];
  for (const transaction of transactions) {
    const isIncome = transaction.categories?.type === 'income';
    const amount = isIncome ? transaction.amount : -transaction.amount;
    const lastGroup = groups.at(-1);

    if (lastGroup?.date === transaction.transaction_date) {
      lastGroup.items.push(transaction);
      lastGroup.net += amount;
    } else {
      groups.push({ date: transaction.transaction_date, items: [transaction], net: amount });
    }
  }

  return (
    <section aria-label="Pengelolaan transaksi" className="page-enter reveal-1 grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card ref={formRef} className="scroll-mt-24 lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>{editing ? 'Ubah transaksi' : 'Transaksi baru'}</CardTitle>
          <p className="text-sm leading-5 text-muted-foreground">Catat settlement masuk atau biaya operasional.</p>
        </CardHeader>
        <CardContent>
          <TransactionForm
            key={editing?.id ?? 'baru'}
            categories={categories}
            initial={
              editing
                ? {
                    id: editing.id,
                    category_id: editing.category_id,
                    amount: editing.amount,
                    description: editing.description,
                    transaction_date: editing.transaction_date,
                  }
                : undefined
            }
            onSaved={refresh}
            onCancel={editing ? () => setEditing(null) : undefined}
          />
        </CardContent>
      </Card>

      <section aria-label="Daftar aktivitas transaksi" className="space-y-4">
        {error ? <Alert variant="destructive">{error}</Alert> : null}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div><CardTitle>Aktivitas terbaru</CardTitle><p className="mt-1 text-xs text-muted-foreground">Maksimal 100 transaksi</p></div>
            <span className="text-sm font-semibold tabular">{transactions.length}</span>
          </CardHeader>
          <CardContent>
            <TransactionList groups={groups} pendingId={pendingId} onEdit={handleEdit} onDelete={handleDelete} />
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
