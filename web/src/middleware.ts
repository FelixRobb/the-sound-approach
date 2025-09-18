import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { checkAdminAuth } from "@/lib/adminAuth";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Handle admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Allow access to login page
    if (
      request.nextUrl.pathname === "/admin/login" ||
      (request.nextUrl.pathname === "/api/admin/auth" && request.method === "POST")
    ) {
      return NextResponse.next();
    }

    // Check admin authentication for other admin routes
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // Handle regular user routes
  return await updateSession(request);
}

// Apply this middleware to every route except Next.js internals and static
// assets. We intentionally *do not* exclude the auth pages so we can redirect
// authenticated users away from them.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|service-worker.js).*)"],
};
