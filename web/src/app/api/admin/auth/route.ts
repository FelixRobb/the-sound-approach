import { NextRequest, NextResponse } from "next/server";

import { setAdminSession, clearAdminSession } from "@/lib/adminAuth";
import {
  badRequestResponse,
  unauthorizedResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/apiResponse";
import { verifyAdminPassword } from "@/utils/supabase/admin";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { password } = (await request.json()) as { password: string };

    if (!password) {
      return badRequestResponse("Password is required");
    }

    if (!verifyAdminPassword(password)) {
      return unauthorizedResponse("Invalid password");
    }

    const response = successResponse({ success: true });
    setAdminSession(response);

    return response;
  } catch (error) {
    console.error("Admin auth error:", error);
    return serverErrorResponse("Authentication failed");
  }
}

export function DELETE() {
  try {
    const response = successResponse({ success: true });
    clearAdminSession(response);
    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return serverErrorResponse("Logout failed");
  }
}
