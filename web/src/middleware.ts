import { NextResponse } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase";

import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("Middleware running for:", request.nextUrl.pathname);

  try {
    // Create response object
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createMiddlewareClient(request);

    // Get the current user (more secure than getSession)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isWelcomePage = request.nextUrl.pathname === "/welcome";
    const isAuthenticatedUser = !!user;

    console.log("Auth check:", {
      pathname: request.nextUrl.pathname,
      isWelcomePage,
      isAuthenticatedUser,
      hasUser: !!user,
      userId: user?.id || "none",
    });

    // If user is not authenticated and not on welcome page, redirect to welcome
    if (!isAuthenticatedUser && !isWelcomePage) {
      console.log("Redirecting to welcome page");
      return NextResponse.redirect(new URL("/welcome", request.url));
    }

    // If user is authenticated and on welcome page, redirect to home
    if (isAuthenticatedUser && isWelcomePage) {
      console.log("Redirecting authenticated user to home");
      return NextResponse.redirect(new URL("/", request.url));
    }

    console.log("Allowing request to continue");
    return response;
  } catch (error) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    console.error("Middleware error:", error);
    // Redirect to welcome page as fallback
    const isWelcomePage = request.nextUrl.pathname === "/welcome";
    if (!isWelcomePage) {
      console.log("Error occurred, redirecting to welcome");
      return NextResponse.redirect(new URL("/welcome", request.url));
    }

    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and API routes
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
