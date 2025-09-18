import { NextRequest, NextResponse } from "next/server";

import { checkAdminAuth } from "@/lib/adminAuth";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: species, error } = await supabase
      .from("species")
      .select("*")
      .order("common_name");

    if (error) {
      throw error;
    }

    return NextResponse.json(species);
  } catch (error) {
    console.error("Error fetching species:", error);
    return NextResponse.json({ error: "Failed to fetch species" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Species ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("species")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating species:", error);
    return NextResponse.json({ error: "Failed to update species" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase.from("species").insert(body).select().single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating species:", error);
    return NextResponse.json({ error: "Failed to create species" }, { status: 500 });
  }
}
