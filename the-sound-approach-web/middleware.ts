import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/favicon.ico",
  "/_next",
  "/assets",
  "/api",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check Supabase auth cookie
  const supabaseToken = request.cookies.get("sb-access-token")?.value;
  if (!supabaseToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|assets|api|manifest.json|robots.txt|sitemap.xml).*)"],
};
