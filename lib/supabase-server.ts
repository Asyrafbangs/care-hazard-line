import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getRequiredEnv, getRequiredUrl } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = getRequiredUrl("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components cannot always set cookies. Middleware can refresh sessions later.
        }
      }
    }
  });
}
