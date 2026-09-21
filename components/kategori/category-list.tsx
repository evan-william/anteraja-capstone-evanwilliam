'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ApiResponse } from '@/lib/api';
import type { CategoryRow } from '@/lib/supabase/types';

type CategoryListProps = {
  categories: CategoryRow[];
  onChanged: () => void;
  onError: (message: string) => void;
};

export function CategoryList({ categories, onChanged, onError }: CategoryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function patchCategory(id: string, payload: Record<string, unknown>) {
    setPendingId(id);
    const response = await fetch(`/api/v1/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as ApiResponse<CategoryRow>;
    setPendingId(null);

    if (!body.success) {
      onError(body.error.message);
      return;
    }

    setEditingId(null);
    onChanged();
  }

  if (categories.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">Belum ada kategori. Tambahkan melalui formulir.</p>;
  }

  return (
    <ul className="divide-y">
      {categories.map((category) => {
        const isEditing = editingId === category.id;
        const isPending = pendingId === category.id;

        return (
          <li key={category.id} className="flex items-center justify-between gap-3 py-3.5">
            {isEditing ? (
              <Input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={30}
                className="max-w-xs"
                aria-label={`Ubah nama ${category.name}`}
              />
            ) : (
              <span className={category.is_archived ? 'text-sm text-muted-foreground' : 'text-sm font-medium'}>
                {category.name}
                {category.is_archived ? ' (diarsipkan)' : ''}
              </span>
            )}

            <div className="flex shrink-0 items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => patchCategory(category.id, { name: draftName.trim() })}
                  >
                    Simpan
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Batal
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(category.id);
                      setDraftName(category.name);
                    }}
                  >
                    Ubah
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() =>
                      patchCategory(category.id, { is_archived: !category.is_archived })
                    }
                  >
                    {category.is_archived ? 'Buka arsip' : 'Arsipkan'}
                  </Button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
