import type { NextRequest } from 'next/server';

import { forbidden, ok, serverError, unauthorized, validationError } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { saveImportSchema } from '@/lib/import/validation';
import { createClient } from '@/lib/supabase/server';
import { firstIssueMessage } from '@/lib/validation';

const HISTORY_FIELDS =
  'id, file_name, bank, new_count, matched_count, error_count, status, cancelled_at, created_at';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== 'seller') return forbidden();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bank_imports')
    .select(HISTORY_FIELDS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return serverError('Gagal mengambil riwayat impor.');
  return ok(data);
}

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
  const parsed = saveImportSchema.safeParse(payload);
  if (!parsed.success) return validationError(firstIssueMessage(parsed.error));

  const missingCategory = parsed.data.rows.find(
    (row) => row.status === 'new' && !row.category_id,
  );
  if (missingCategory) {
    return validationError(`Pilih kategori untuk baris ${missingCategory.row_number}.`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_bank_import', {
    p_file_name: parsed.data.file_name,
    p_bank: parsed.data.bank,
    p_rows: parsed.data.rows,
    p_rules: parsed.data.rules,
  });
  if (error) return serverError('Impor gagal disimpan. Tidak ada perubahan yang diterapkan.');
  return ok({ id: data }, 201);
}
