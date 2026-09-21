'use client';

import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { ApiResponse } from '@/lib/api';
import type { CategoryRow, CategoryType } from '@/lib/supabase/types';
import { createCategorySchema, firstIssueMessage } from '@/lib/validation';

type CategoryFormProps = {
  onCreated: () => void;
};

export function CategoryForm({ onCreated }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = createCategorySchema.safeParse({ name, type });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }

    setIsPending(true);
    const response = await fetch('/api/v1/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    const body = (await response.json()) as ApiResponse<CategoryRow>;
    setIsPending(false);

    if (!body.success) {
      setError(body.error.message);
      return;
    }

    setName('');
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="category-name">Nama kategori</Label>
          <Input
            id="category-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Makan & Minum"
            maxLength={30}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-type">Jenis</Label>
          <Select
            id="category-type"
            value={type}
            onChange={(event) => setType(event.target.value as CategoryType)}
            className="sm:w-40"
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </Select>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan…' : 'Tambah kategori'}
        </Button>
      </div>
    </form>
  );
}
