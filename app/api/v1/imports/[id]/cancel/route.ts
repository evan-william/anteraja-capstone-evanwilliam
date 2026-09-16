import { ok, serverError, unauthorized, validationError } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return validationError('ID impor tidak valid.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('cancel_bank_import', { p_import_id: id });
  if (error) return serverError('Gagal membatalkan impor.');
  return ok(data);
}
