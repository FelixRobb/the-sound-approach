import type { PostgrestError } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { checkAdminAuth } from "@/lib/adminAuth";
import { Recording } from "@/types";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: recordings, error } = (await supabase
      .from("recordings")
      .select(
        `
        *,
        species:species_id (
          id,
          common_name,
          scientific_name
        )
      `
      )
      .order("rec_number")) as { data: Recording[]; error: PostgrestError | null };

    if (error) {
      throw error;
    }

    return NextResponse.json(recordings);
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { id: string; updateData: Partial<Recording> };
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Recording ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = (await supabase
      .from("recordings")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        species:species_id (
          id,
          common_name,
          scientific_name
        )
      `
      )
      .single()) as { data: Recording; error: PostgrestError | null };

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating recording:", error);
    return NextResponse.json({ error: "Failed to update recording" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { id: string; updateData: Partial<Recording> };
    const supabase = createAdminClient();
    const { id, ...updateData } = body;

    const { data, error } = (await supabase
      .from("recordings")
      .insert(updateData)
      .select(
        `
        *,
        species:species_id (
          id,
          common_name,
          scientific_name
        )
      `
      )
      .single()) as { data: Recording; error: PostgrestError | null };

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating recording:", error);
    return NextResponse.json({ error: "Failed to create recording" }, { status: 500 });
  }
}
