import { NextRequest, NextResponse } from "next/server";

import { setAdminSession, clearAdminSession } from "@/lib/adminAuth";
import { verifyAdminPassword } from "@/utils/supabase/admin";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Admin auth route hit");
    const { password } = (await request.json()) as { password: string };

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            "Surrogate-Control": "no-store",
          },
        }
      );
    }

    if (!verifyAdminPassword(password)) {
      console.log("Invalid password");
      return NextResponse.json(
        { error: "Invalid password" },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            "Surrogate-Control": "no-store",
          },
        }
      );
    }

    console.log("Valid password");
    const response = NextResponse.json({ success: true });
    setAdminSession(response);

    return response;
  } catch (error) {
    console.error("Admin auth error:", error);
    console.log("Admin auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  }
}

export function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    clearAdminSession(response);
    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  }
}
