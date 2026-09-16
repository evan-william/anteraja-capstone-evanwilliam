import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { ok, serverError, unauthorized, validationError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { createTransactionSchema, firstIssueMessage } from '@/lib/validation';

const TRANSACTION_FIELDS =
  'id, user_id, category_id, amount, description, transaction_date, is_deleted, created_at, updated_at';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const limitParam = Number(request.nextUrl.searchParams.get('limit') ?? '50');
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select(`${TRANSACTION_FIELDS}, categories ( id, name, type )`)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return serverError('Gagal mengambil daftar transaksi.');

  return ok(data);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return validationError('Body request harus berupa JSON.');
  }

  const parsed = createTransactionSchema.safeParse(payload);
  if (!parsed.success) return validationError(firstIssueMessage(parsed.error));

  const supabase = await createClient();

  // Kategori wajib milik user ini dan belum diarsipkan.
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, is_archived')
    .eq('id', parsed.data.category_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (categoryError) return serverError('Gagal memeriksa kategori.');
  if (!category) return validationError('Kategori tidak ditemukan.');
  if (category.is_archived) return validationError('Kategori itu sudah diarsipkan.');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      category_id: parsed.data.category_id,
      amount: parsed.data.amount,
      description: parsed.data.description ?? null,
      transaction_date: parsed.data.transaction_date,
    })
    .select(TRANSACTION_FIELDS)
    .single();

  if (error) return serverError('Gagal menyimpan transaksi.');

  return ok(data, 201);
}
