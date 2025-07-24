import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase";

// Paths that never require an authenticated session
const PUBLIC_PATHS = ["/favicon.ico", "/service-worker.js", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  console.log("Middleware running for:", request.nextUrl.pathname);

  try {
    // Create response object
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Bypass auth check for explicitly public paths
    const { pathname } = request.nextUrl;
    if (PUBLIC_PATHS.includes(pathname)) {
      console.log("Public path detected – skipping auth check");
      return response;
    }

    const supabase = createMiddlewareClient(request);

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

    // If an authenticated user somehow lands on auth pages, send them to the main dashboard
    if (isAuthenticatedUser && ["/login", "/signup"].includes(pathname)) {
      console.log("Authenticated user on auth page – redirecting to /");
      return NextResponse.redirect(new URL("/", request.url));
    }

    // For the root path, let it through - the page component will handle auth state
    if (pathname === "/") {
      console.log("Root path – allowing through");
      return response;
    }

    // Redirect unauthenticated users to root for protected routes
    if (!isAuthenticatedUser && !PUBLIC_PATHS.includes(pathname)) {
      console.log("Unauthenticated – redirecting to /");
      return NextResponse.redirect(new URL("/", request.url));
    }

    console.log("Allowing request to continue");
    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    const { pathname } = request.nextUrl;
    if (PUBLIC_PATHS.includes(pathname) || pathname === "/") {
      return NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
    }

    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|service-worker.js).*)"],
};
