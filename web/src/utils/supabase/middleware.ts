import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes that should always be accessible without an authenticated session
  const PUBLIC_PATHS = new Set([
    "/", // the welcome / landing page
    "/favicon.ico",
    "/service-worker.js",
    "/login",
    "/signup",
    "/welcome",
    "/auth/confirm", // Add the auth confirmation route
  ]);

  /*
   * 1. Public routes – allow through for everyone. If the user is *already*
   *    authenticated and tries to visit the auth pages (login / signup),
   *    redirect them to their dashboard instead.
   */
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) {
    if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  /*
   * 2. Protected routes – if the user is not authenticated, kick them back to
   *    the public landing page so the client-side logic can handle further
   *    routing (e.g. showing the welcome screen or the login form).
   */
  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Authenticated user accessing a protected route – everything is good 🎉
  return supabaseResponse;
}
