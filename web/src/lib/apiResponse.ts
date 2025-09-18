import { NextResponse } from "next/server";

/**
 * Standard API response headers for different scenarios
 */
const HEADERS = {
  // For responses that should never be cached (auth, user-specific data)
  NO_CACHE: {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
  // For responses that can be cached briefly (public data)
  SHORT_CACHE: {
    "Cache-Control": "public, max-age=300", // 5 minutes
  },
  // For responses that can be cached longer (static-ish data)
  LONG_CACHE: {
    "Cache-Control": "public, max-age=3600", // 1 hour
  },
} as const;

/**
 * Create a successful JSON response
 */
export function successResponse<T>(data: T, options?: { cache?: keyof typeof HEADERS }) {
  const headers = options?.cache ? HEADERS[options.cache] : undefined;
  return NextResponse.json(data, { headers });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  options?: { cache?: keyof typeof HEADERS }
) {
  const headers = options?.cache ? HEADERS[options.cache] : HEADERS.NO_CACHE;
  return NextResponse.json({ error: message }, { status, headers });
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized") {
  return errorResponse(message, 401, { cache: "NO_CACHE" });
}

/**
 * Create a bad request response
 */
export function badRequestResponse(message: string) {
  return errorResponse(message, 400, { cache: "NO_CACHE" });
}

/**
 * Create an internal server error response
 */
export function serverErrorResponse(message: string = "Internal server error") {
  return errorResponse(message, 500, { cache: "NO_CACHE" });
}
