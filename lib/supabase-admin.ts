import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv, getRequiredUrl } from "@/lib/env";

export function createSupabaseAdmin() {
  const supabaseUrl = getRequiredUrl("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
