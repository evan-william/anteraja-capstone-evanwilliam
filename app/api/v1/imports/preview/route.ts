import type { NextRequest } from 'next/server';

import { fail, forbidden, ok, serverError, unauthorized, validationError } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { matchImportRows, type MatchableTransaction } from '@/lib/import/matching';
import type { ImportCategory } from '@/lib/import/types';
import { previewImportSchema } from '@/lib/import/validation';
import { createClient } from '@/lib/supabase/server';
import { firstIssueMessage } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== 'seller') return forbidden();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return validationError('Body request harus berupa JSON.');
  }
  const parsed = previewImportSchema.safeParse(payload);
  if (!parsed.success) return validationError(firstIssueMessage(parsed.error));
  if (parsed.data.rows.length === 0) return validationError('File tidak berisi transaksi.');

  const validRows = parsed.data.rows.filter((row) => row.transaction_date);
  const dates = validRows.map((row) => row.transaction_date as string).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const supabase = await createClient();

  const [categoriesResult, rulesResult, transactionsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', user.id)
      .eq('is_archived', false),
    supabase
      .from('category_rules')
      .select('id, category_id, keyword, type, created_at')
      .eq('user_id', user.id),
    minDate && maxDate
      ? supabase
          .from('transactions')
          .select('id, transaction_date, amount, description, categories ( type )')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .gte('transaction_date', minDate)
          .lte('transaction_date', maxDate)
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoriesResult.error || rulesResult.error || transactionsResult.error) {
    return serverError('Gagal mencocokkan mutasi dengan data transaksi.');
  }
  const categories = (categoriesResult.data ?? []) as ImportCategory[];
  if (categories.length === 0) {
    return fail('CATEGORY_REQUIRED', 'Buat minimal satu kategori aktif sebelum mengimpor.', 409);
  }

  return ok({
    rows: matchImportRows(
      parsed.data.rows,
      (transactionsResult.data ?? []) as MatchableTransaction[],
      rulesResult.data ?? [],
      categories,
    ),
    categories,
  });
}
