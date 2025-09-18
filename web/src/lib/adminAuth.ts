import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/utils/supabase/admin";

export async function checkAdminAuth(_request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return false;
    }

    const [token, timestampStr] = sessionCookie.value.split("|");
    const timestamp = parseInt(timestampStr);

    if (!token || !timestamp || isNaN(timestamp)) {
      return false;
    }

    return isValidAdminSession(token, timestamp);
  } catch (error) {
    console.error("Admin auth check failed:", error);
    return false;
  }
}

export function createAdminSession(): string {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const timestamp = Date.now();
  return `${token}|${timestamp}`;
}

export function setAdminSession(response: NextResponse): void {
  const sessionValue = createAdminSession();
  response.cookies.set(ADMIN_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60, // 1 hour
  });
}

export function clearAdminSession(response: NextResponse): void {
  response.cookies.delete(ADMIN_SESSION_COOKIE);
}
