import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase";

// Routes that should always be accessible without an authenticated session
const PUBLIC_PATHS = new Set([
  "/", // the welcome / landing page
  "/favicon.ico",
  "/service-worker.js",
  "/login",
  "/signup",
  "/welcome",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Prepare a response object so Supabase can attach refreshed auth cookies to it
  const response = NextResponse.next();

  // Initialise Supabase for the current middleware invocation
  const supabase = createMiddlewareClient(request, response);

  // Refresh the session if the access token has expired – this updates the cookies
  // on the `response` object. We purposely do *not* use the returned `session.user`
  // object, because it is not cryptographically verified.
  await supabase.auth.getSession();

  // Fetch the verified user object from Supabase Auth. This makes a network
  // request to securely validate the access token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  /*
   * 1. Public routes – allow through for everyone. If the user is *already*
   *    authenticated and tries to visit the auth pages (login / signup),
   *    redirect them to their dashboard instead.
   */
  if (PUBLIC_PATHS.has(pathname)) {
    if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  /*
   * 2. Protected routes – if the user is not authenticated, kick them back to
   *    the public landing page so the client-side logic can handle further
   *    routing (e.g. showing the welcome screen or the login form).
   */
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Authenticated user accessing a protected route – everything is good 🎉
  return response;
}

// Apply this middleware to every route except Next.js internals and static
// assets. We intentionally *do not* exclude the auth pages so we can redirect
// authenticated users away from them.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|service-worker.js).*)"],
};
