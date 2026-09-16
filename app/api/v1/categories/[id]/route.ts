import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { conflict, notFound, ok, serverError, unauthorized, validationError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { firstIssueMessage, updateCategorySchema } from '@/lib/validation';

const UNIQUE_VIOLATION = '23505';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return validationError('Body request harus berupa JSON.');
  }

  const parsed = updateCategorySchema.safeParse(payload);
  if (!parsed.success) return validationError(firstIssueMessage(parsed.error));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, name, type, is_archived, created_at, updated_at')
    .maybeSingle();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return conflict('Kategori dengan nama itu sudah ada.');
    }
    return serverError('Gagal mengubah kategori.');
  }

  if (!data) return notFound('Kategori tidak ditemukan.');

  return ok(data);
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const supabase = await createClient();

  // Kategori yang sudah dipakai transaksi tidak boleh dihapus permanen.
  const { count, error: countError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('category_id', id);

  if (countError) return serverError('Gagal memeriksa pemakaian kategori.');

  if ((count ?? 0) > 0) {
    return conflict('Kategori ini sudah dipakai transaksi. Arsipkan saja, jangan dihapus.');
  }

  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) return serverError('Gagal menghapus kategori.');
  if (!data) return notFound('Kategori tidak ditemukan.');

  return ok({ id: data.id });
}
