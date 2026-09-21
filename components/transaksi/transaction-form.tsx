'use client';

import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { todayInJakarta } from '@/lib/date';
import { formatAmountInput, parseRupiah } from '@/lib/format';
import type { ApiResponse } from '@/lib/api';
import type { CategoryRow, TransactionRow } from '@/lib/supabase/types';
import { createTransactionSchema, firstIssueMessage } from '@/lib/validation';

export type TransactionDraft = {
  id: string;
  category_id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
};

type TransactionFormProps = {
  categories: CategoryRow[];
  initial?: TransactionDraft;
  onSaved: () => void;
  onCancel?: () => void;
};

export function TransactionForm({
  categories,
  initial,
  onSaved,
  onCancel,
}: TransactionFormProps) {
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? categories[0]?.id ?? '');
  const [amount, setAmount] = useState(initial ? formatAmountInput(initial.amount) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.transaction_date ?? todayInJakarta());
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = createTransactionSchema.safeParse({
      category_id: categoryId,
      amount: parseRupiah(amount) ?? Number.NaN,
      description,
      transaction_date: date,
    });

    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }

    setIsPending(true);
    const response = await fetch(
      initial ? `/api/v1/transactions/${initial.id}` : '/api/v1/transactions',
      {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, description: parsed.data.description ?? null }),
      },
    );
    const body = (await response.json()) as ApiResponse<TransactionRow>;
    setIsPending(false);

    if (!body.success) {
      setError(body.error.message);
      return;
    }

    if (!initial) {
      setAmount('');
      setDescription('');
    }
    onSaved();
  }

  if (categories.length === 0) {
    return (
      <Alert>
        Belum ada kategori aktif. Buat dulu di halaman <strong>Kategori</strong>.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="transaction-category">Kategori</Label>
          <Select
            id="transaction-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type === 'expense' ? 'pengeluaran' : 'pemasukan'})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-amount">Nominal (Rp)</Label>
          <Input
            id="transaction-amount"
            inputMode="numeric"
            value={amount}
            onChange={(event) => {
              const parsedAmount = parseRupiah(event.target.value);
              setAmount(parsedAmount === null ? '' : formatAmountInput(parsedAmount));
            }}
            placeholder="50.000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-date">Tanggal</Label>
          <Input
            id="transaction-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-description">Deskripsi (opsional)</Label>
          <Input
            id="transaction-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={200}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan…' : initial ? 'Simpan perubahan' : 'Simpan transaksi'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  );
}
