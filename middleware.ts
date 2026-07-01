import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function clean(value?: string) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "").trim();
}

/**
 * Refreshes the Supabase auth session on every request and writes the updated
 * cookies to the response. Server Components cannot set cookies, so without this
 * middleware a signed-in session is never refreshed and protected pages bounce
 * the user back to /login. This does not redirect — page-level requireAppRole
 * guards still handle authorization.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  // Touch the session so expired access tokens are refreshed and re-persisted.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on all routes except API endpoints (e.g. the WhatsApp webhook) and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};
