import { PostgrestError } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

import { checkAdminAuth } from "@/lib/adminAuth";
import {
  unauthorizedResponse,
  serverErrorResponse,
  badRequestResponse,
  successResponse,
} from "@/lib/apiResponse";
import { Recording, Species } from "@/types";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return unauthorizedResponse();
    }

    const supabase = createAdminClient();
    const { data: species, error } = await supabase
      .from("species")
      .select("*")
      .order("common_name");

    if (error) {
      throw error;
    }

    return successResponse(species, { cache: "NO_CACHE" });
  } catch (error) {
    console.error("Error fetching species:", error);
    return serverErrorResponse("Failed to fetch species");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return unauthorizedResponse();
    }

    const body = (await request.json()) as { id: string; updateData: Partial<Species> };
    const { id, ...updateData } = body as { id: string; updateData: Partial<Species> };

    if (!id) {
      return badRequestResponse("Species ID is required");
    }

    const supabase = createAdminClient();
    const { data, error } = (await supabase
      .from("species")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()) as { data: Species; error: PostgrestError | null };

    if (error) {
      throw error;
    }

    return successResponse(data, { cache: "NO_CACHE" });
  } catch (error) {
    console.error("Error updating species:", error);
    return serverErrorResponse("Failed to update species");
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return unauthorizedResponse();
    }

    const body = (await request.json()) as Species;
    const supabase = createAdminClient();

    const { data, error } = (await supabase.from("species").insert(body).select().single()) as {
      data: Species;
      error: PostgrestError | null;
    };

    if (error) {
      throw error;
    }

    return successResponse(data, { cache: "NO_CACHE" });
  } catch (error) {
    console.error("Error creating species:", error);
    return serverErrorResponse("Failed to create species");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return unauthorizedResponse();
    }

    const { id } = (await request.json()) as { id: string };
    const supabase = createAdminClient();
    const { error: speciesError } = (await supabase.from("species").delete().eq("id", id)) as {
      data: Species | null;
      error: PostgrestError | null;
    };

    const { error: recordingsError } = (await supabase
      .from("recordings")
      .delete()
      .eq("species_id", id)) as { data: Recording[] | null; error: PostgrestError | null };

    if (recordingsError) {
      throw recordingsError;
    }

    if (speciesError) {
      throw speciesError;
    }

    return successResponse({ cache: "NO_CACHE" });
  } catch (error) {
    console.error("Error deleting species:", error);
    return serverErrorResponse("Failed to delete species");
  }
}
