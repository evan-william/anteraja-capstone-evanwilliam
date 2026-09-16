import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { supabasePublishableKey, supabaseUrl } from './env';
import type { Database } from './types';

/** Klien Supabase untuk server component, route handler, dan server action. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Dipanggil dari server component: cookie sudah diperbarui middleware.
        }
      },
    },
  });
}
