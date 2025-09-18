import type { PostgrestError } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

import { checkAdminAuth } from "@/lib/adminAuth";
import {
  unauthorizedResponse,
  serverErrorResponse,
  badRequestResponse,
  successResponse,
} from "@/lib/apiResponse";
import { Recording } from "@/types";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return unauthorizedResponse();
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
      .order("rec_number", { ascending: true, nullsFirst: false })) as {
      data: Recording[];
      error: PostgrestError | null;
    };

    if (error) {
      throw error;
    }

    return successResponse(recordings, { cache: "SHORT_CACHE" });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return serverErrorResponse("Failed to fetch recordings");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return unauthorizedResponse();
    }

    const body = (await request.json()) as Partial<Recording> & { id: string };
    const { id, species, ...updateData } = body;

    if (!id) {
      return badRequestResponse("Recording ID is required");
    }

    // Remove any undefined values and the species relation data
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const supabase = createAdminClient();
    const { data, error } = (await supabase
      .from("recordings")
      .update(cleanUpdateData)
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

    return successResponse(data);
  } catch (error) {
    console.error("Error updating recording:", error);
    return serverErrorResponse("Failed to update recording");
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return unauthorizedResponse();
    }

    const body = (await request.json()) as Partial<Recording>;
    const supabase = createAdminClient();

    // Remove any undefined values and the species relation data
    const { species, ...insertData } = body;
    const cleanInsertData = Object.fromEntries(
      Object.entries(insertData).filter(([_, value]) => value !== undefined && value !== "")
    );

    const { data, error } = (await supabase
      .from("recordings")
      .insert(cleanInsertData)
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

    return successResponse(data);
  } catch (error) {
    console.error("Error creating recording:", error);
    return serverErrorResponse("Failed to create recording");
  }
}
