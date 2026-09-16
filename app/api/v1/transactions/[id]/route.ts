import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { notFound, ok, serverError, unauthorized, validationError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { firstIssueMessage, updateTransactionSchema } from '@/lib/validation';

const TRANSACTION_FIELDS =
  'id, user_id, category_id, amount, description, transaction_date, is_deleted, created_at, updated_at';

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

  const parsed = updateTransactionSchema.safeParse(payload);
  if (!parsed.success) return validationError(firstIssueMessage(parsed.error));

  const supabase = await createClient();

  if (parsed.data.category_id) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, is_archived')
      .eq('id', parsed.data.category_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (categoryError) return serverError('Gagal memeriksa kategori.');
    if (!category) return validationError('Kategori tidak ditemukan.');
    if (category.is_archived) return validationError('Kategori itu sudah diarsipkan.');
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({
      ...parsed.data,
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select(TRANSACTION_FIELDS)
    .maybeSingle();

  if (error) return serverError('Gagal mengubah transaksi.');
  if (!data) return notFound('Transaksi tidak ditemukan.');

  return ok(data);
}

/** Hapus transaksi = soft delete (is_deleted = true). */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .update({ is_deleted: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) return serverError('Gagal menghapus transaksi.');
  if (!data) return notFound('Transaksi tidak ditemukan.');

  return ok({ id: data.id });
}
