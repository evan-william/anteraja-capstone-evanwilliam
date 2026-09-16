import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { conflict, ok, serverError, unauthorized, validationError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { createCategorySchema, firstIssueMessage } from '@/lib/validation';

const UNIQUE_VIOLATION = '23505';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const status = request.nextUrl.searchParams.get('status');
  const supabase = await createClient();

  let query = supabase
    .from('categories')
    .select('id, user_id, name, type, is_archived, created_at, updated_at')
    .eq('user_id', user.id)
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  if (status === 'active') query = query.eq('is_archived', false);
  if (status === 'archived') query = query.eq('is_archived', true);

  const { data, error } = await query;
  if (error) return serverError('Gagal mengambil daftar kategori.');

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

  const parsed = createCategorySchema.safeParse(payload);
  if (!parsed.success) return validationError(firstIssueMessage(parsed.error));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, name: parsed.data.name, type: parsed.data.type })
    .select('id, user_id, name, type, is_archived, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return conflict('Kategori dengan nama itu sudah ada.');
    }
    return serverError('Gagal membuat kategori.');
  }

  return ok(data, 201);
}
