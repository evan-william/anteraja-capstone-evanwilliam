import type { NextRequest } from 'next/server';

import { notFound, ok, serverError, validationError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { enforceTrackingRateLimit } from '@/lib/tracking/request';
import { accessCodeSchema, awbSchema, issueMessage } from '@/lib/tracking/validation';

type RouteContext = { params: Promise<{ awb: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const limited = await enforceTrackingRateLimit(request);
  if (limited) return limited;

  const { awb: rawAwb } = await params;
  const awb = awbSchema.safeParse(decodeURIComponent(rawAwb));
  const accessCode = accessCodeSchema.safeParse(request.nextUrl.searchParams.get('code') ?? '');
  if (!awb.success) return validationError(issueMessage(awb.error));
  if (!accessCode.success) return validationError(issueMessage(accessCode.error));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_public_tracking', {
    p_awb: awb.data,
    p_access_code: accessCode.data,
  });
  if (error) return serverError('Status kiriman belum dapat dimuat.');
  if (!data) return notFound('Resi atau kode akses tidak cocok. Periksa kembali data pada pesan pengiriman.');
  return ok(data);
}
