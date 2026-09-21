import type { NextRequest } from 'next/server';

import { ok, serverError, validationError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { enforceTrackingRateLimit } from '@/lib/tracking/request';
import { accessCodeSchema, awbSchema, issueMessage, notificationSchema } from '@/lib/tracking/validation';

type RouteContext = { params: Promise<{ awb: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const limited = await enforceTrackingRateLimit(request);
  if (limited) return limited;
  const { awb: rawAwb } = await params;
  const awb = awbSchema.safeParse(decodeURIComponent(rawAwb));
  if (!awb.success) return validationError(issueMessage(awb.error));
  let body: unknown;
  try { body = await request.json(); } catch { return validationError('Body request harus berupa JSON.'); }
  const parsed = notificationSchema.safeParse(body);
  const code = accessCodeSchema.safeParse(request.headers.get('x-tracking-code') ?? '');
  if (!parsed.success) return validationError(issueMessage(parsed.error));
  if (!code.success) return validationError(issueMessage(code.error));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('set_tracking_notifications', {
    p_awb: awb.data,
    p_access_code: code.data,
    p_whatsapp: parsed.data.whatsapp,
    p_email: parsed.data.email,
    p_push: parsed.data.push,
  });
  if (error?.message.includes('access invalid')) return validationError('Resi atau kode akses tidak cocok.');
  if (error) return serverError('Preferensi notifikasi belum dapat disimpan.');
  return ok(data);
}
