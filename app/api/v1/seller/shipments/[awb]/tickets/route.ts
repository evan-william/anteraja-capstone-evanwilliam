import type { NextRequest } from 'next/server';

import { forbidden, notFound, ok, serverError, unauthorized, validationError } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { awbSchema, issueMessage, ticketSchema } from '@/lib/tracking/validation';

type RouteContext = { params: Promise<{ awb: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== 'seller') return forbidden();

  const { awb: rawAwb } = await params;
  const awb = awbSchema.safeParse(decodeURIComponent(rawAwb));
  if (!awb.success) return validationError(issueMessage(awb.error));
  let body: unknown;
  try { body = await request.json(); } catch { return validationError('Body request harus berupa JSON.'); }
  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) return validationError(issueMessage(parsed.error));

  const supabase = await createClient();
  const { data: shipment, error: shipmentError } = await supabase.from('shipments')
    .select('id').eq('tracking_number', awb.data).eq('user_id', user.id).maybeSingle();
  if (shipmentError) return serverError('Kiriman belum dapat diperiksa. Coba lagi.');
  if (!shipment) return notFound('Kiriman tidak ditemukan di akun Seller ini.');

  const { data, error } = await supabase.rpc('create_seller_ticket', {
    p_shipment_id: shipment.id,
    p_note: parsed.data.note,
  });
  if (error) return serverError('Tiket belum dapat dibuat. Coba lagi.');
  return ok(data, 201);
}
