'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function updateTicketStatus(ticketId: string, status: 'in_progress' | 'resolved') {
  await requireRole(['admin']);
  if (!/^[0-9a-f-]{36}$/i.test(ticketId) || !['in_progress', 'resolved'].includes(status)) {
    throw new Error('Permintaan tidak valid.');
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_update_ticket_status', { p_ticket_id: ticketId, p_status: status });
  if (error || !data) throw new Error('Status tiket gagal diperbarui. Muat ulang lalu coba lagi.');
  revalidatePath('/admin');
  revalidatePath('/admin/tiket');
  revalidatePath('/admin/pengiriman/[awb]', 'page');
}
