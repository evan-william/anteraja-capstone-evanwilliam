import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { conflict, fail, forbidden, notFound, ok, serverError, unauthorized, validationError } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { assistantRateLimited } from '@/lib/admin-assistant/rate-limit';
import { createClient } from '@/lib/supabase/server';

const requestSchema = z.object({ ticketId: z.string().uuid(), status: z.enum(['in_progress', 'resolved']) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();
  if (assistantRateLimited(user.id)) return fail('RATE_LIMITED', 'Terlalu banyak tindakan. Tunggu sebentar lalu coba lagi.', 429);
  let input: unknown;
  try { input = await request.json(); } catch { return validationError('Permintaan harus berupa JSON.'); }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return validationError('Pilihan tindakan tidak valid.');

  const client = await createClient();
  const { data: ticket, error: readError } = await client.from('support_tickets')
    .select('id,ticket_number,status').eq('id', parsed.data.ticketId).maybeSingle();
  if (readError) return serverError('Tiket belum dapat diperiksa. Coba lagi.');
  if (!ticket) return notFound('Tiket tidak ditemukan.');
  if (parsed.data.status === 'in_progress' && ticket.status !== 'open') return conflict('Status tiket sudah berubah. Muat ulang percakapan sebelum bertindak.');
  if (parsed.data.status === 'resolved' && ticket.status !== 'in_progress') return conflict('Tiket belum berada dalam status Sedang ditangani.');

  const { error } = await client.rpc('admin_update_ticket_status', { p_ticket_id: ticket.id, p_status: parsed.data.status });
  if (error) return conflict('Status tiket tidak berubah. Periksa tiket di daftar lalu coba lagi.');
  revalidatePath('/admin/tiket');
  revalidatePath('/admin');
  return ok({ ticketNumber: ticket.ticket_number, status: parsed.data.status });
}
