import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side client con service role: bypassa RLS.
// Usare solo lato server (route handlers, cron, script).
export function createServiceClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
