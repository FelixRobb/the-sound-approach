import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase";

// Paths that never require an authenticated session. Add any new publicly
// accessible paths here so that they bypass the Supabase lookup completely.
const PUBLIC_PATHS = ["/favicon.ico", "/service-worker.js"];

export async function middleware(request: NextRequest) {
  console.log("Middleware running for:", request.nextUrl.pathname);

  try {
    // Create response object
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Bypass auth check for explicitly public paths to avoid unnecessary
    // Supabase calls (which log errors when no refresh token exists).
    const { pathname } = request.nextUrl;
    if (PUBLIC_PATHS.includes(pathname)) {
      console.log("Public path detected – skipping auth check");
      return response;
    }

    const supabase = createMiddlewareClient(request);

    // Prefer getSession over getUser. getSession() returns null without
    // throwing when there is no valid session, avoiding noisy "Invalid
    // Refresh Token" errors.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    const isAuthenticatedUser = !!user;

    console.log("Auth check:", {
      pathname,
      isAuthenticatedUser,
      userId: user?.id || "none",
    });

    // If an authenticated user somehow lands on the public welcome page,
    // send them to the main dashboard instead.
    if (isAuthenticatedUser && pathname === "/welcome") {
      console.log("Authenticated user on /welcome – redirecting to /");
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Redirect unauthenticated users to the welcome page **except** when they
    // are already on /welcome to avoid an infinite redirect loop.
    if (!isAuthenticatedUser && pathname !== "/welcome") {
      console.log("Unauthenticated – redirecting to /welcome");
      return NextResponse.redirect(new URL("/welcome", request.url));
    }

    // User is authenticated – allow the request.
    console.log("Allowing request to continue");
    return response;
  } catch (error) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    console.error("Middleware error:", error);
    // On any unexpected error, fall back to letting the request through for
    // public paths or redirecting to the welcome page for protected paths.
    const { pathname } = request.nextUrl;
    if (PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
    }

    return NextResponse.redirect(new URL("/welcome", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and API routes
     */
    "/((?!_next/static|_next/image|favicon.ico|service-worker.js).*)",
  ],
};
