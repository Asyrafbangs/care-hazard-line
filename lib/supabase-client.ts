import { createBrowserClient } from "@supabase/ssr";

// NEXT_PUBLIC_* variables are inlined into the browser bundle ONLY when accessed
// via a static `process.env.NEXT_PUBLIC_...` reference. A dynamic lookup like
// `process.env[name]` (as in lib/env.ts) is NOT inlined and reads as undefined
// in the browser, so read them statically here and just trim stray whitespace.
function clean(value?: string) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "").trim();
}

export function createClient() {
  const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
