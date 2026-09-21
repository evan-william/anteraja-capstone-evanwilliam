import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

import { fail } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

export async function enforceTrackingRateLimit(request: NextRequest) {
  const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'local';
  const clientKey = createHash('sha256').update(`tracking:${rawIp}`).digest('hex');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('consume_tracking_rate_limit', { p_client_key: clientKey });
  if (error) return fail('RATE_LIMIT_UNAVAILABLE', 'Pengamanan akses sedang tidak tersedia.', 503);
  if (!data) return fail('RATE_LIMITED', 'Terlalu banyak percobaan. Coba lagi dalam satu menit.', 429);
  return null;
}
