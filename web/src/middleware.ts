import type { NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Apply this middleware to every route except Next.js internals and static
// assets. We intentionally *do not* exclude the auth pages so we can redirect
// authenticated users away from them.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|service-worker.js).*)"],
};
