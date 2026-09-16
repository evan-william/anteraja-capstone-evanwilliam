import { createBrowserClient } from '@supabase/ssr';

import { supabasePublishableKey, supabaseUrl } from './env';
import type { Database } from './types';

/** Klien Supabase untuk komponen client. */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabasePublishableKey());
}
