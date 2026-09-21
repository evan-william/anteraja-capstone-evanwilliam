import type { NextRequest } from 'next/server';

import { conflict, ok, serverError, validationError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { enforceTrackingRateLimit } from '@/lib/tracking/request';
import { accessCodeSchema, awbSchema, issueMessage, resolutionSchema } from '@/lib/tracking/validation';

type RouteContext = { params: Promise<{ awb: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const limited = await enforceTrackingRateLimit(request);
  if (limited) return limited;
  const { awb: rawAwb } = await params;
  const awb = awbSchema.safeParse(decodeURIComponent(rawAwb));
  if (!awb.success) return validationError(issueMessage(awb.error));

  let body: unknown;
  try { body = await request.json(); } catch { return validationError('Body request harus berupa JSON.'); }
  const parsed = resolutionSchema.safeParse(body);
  if (!parsed.success) return validationError(issueMessage(parsed.error));
  const code = accessCodeSchema.safeParse(request.headers.get('x-tracking-code') ?? '');
  if (!code.success) return validationError(issueMessage(code.error));

  const { type, ...payload } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('submit_tracking_resolution', {
    p_awb: awb.data,
    p_access_code: code.data,
    p_resolution_type: type,
    p_payload: payload,
  });
  if (error?.message.includes('already submitted')) return conflict('Instruksi untuk resi ini sudah dikirim hari ini.');
  if (error?.message.includes('does not require')) return conflict('Kiriman ini tidak lagi membutuhkan instruksi tambahan.');
  if (error?.message.includes('access invalid')) return validationError('Resi atau kode akses tidak cocok.');
  if (error) return serverError('Instruksi belum dapat disimpan. Coba lagi.');
  return ok(data, 201);
}
