import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client using the service-role key.
 * ONLY for use in server-side API routes where we need to bypass RLS
 * (e.g., webhook handler writing subscription data to parents table).
 *
 * NEVER import this from client code. The service role key must stay
 * server-side only.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase admin credentials not configured');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
