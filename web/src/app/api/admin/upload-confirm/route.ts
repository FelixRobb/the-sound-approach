import { PostgrestError } from "@supabase/supabase-js";
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

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return unauthorizedResponse();
    }

    const { recordingId, mediaType, token, fileName } = (await request.json()) as {
      recordingId: string;
      mediaType: "audiohqid" | "audiolqid" | "sonagramvideoid";
      token: string;
      fileName: string;
    };

    if (!recordingId || !mediaType || !token || !fileName) {
      return badRequestResponse("Missing required fields: recordingId, mediaType, token, fileName");
    }

    // Validate token format (basic security check)
    if (!token.startsWith(`admin_${recordingId}_${mediaType}_`)) {
      return badRequestResponse("Invalid upload token");
    }

    // Validate media type
    const allowedMediaTypes = ["audiohqid", "audiolqid", "sonagramvideoid"];
    if (!allowedMediaTypes.includes(mediaType)) {
      return badRequestResponse("Invalid media type");
    }

    const supabase = createAdminClient();

    // Verify the file exists in storage
    const bucketName = getBucketName(mediaType);
    const { data: fileExists, error: checkError } = await supabase.storage
      .from(bucketName)
      .list("", { search: fileName.split(".")[0] });

    if (checkError || !fileExists?.length) {
      return badRequestResponse("File not found in storage");
    }

    // Update the database record with the filename (without extension)
    const fileNameWithoutExt = fileName.split(".")[0];
    const { data: updatedRecording, error: updateError } = (await supabase
      .from("recordings")
      .update({ [mediaType]: fileNameWithoutExt })
      .eq("id", recordingId)
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

    if (updateError) {
      console.error("Error updating recording:", updateError);
      return serverErrorResponse("Failed to update recording");
    }

    return successResponse({
      success: true,
      recording: updatedRecording,
      fileName,
    });
  } catch (error) {
    console.error("Error confirming upload:", error);
    return serverErrorResponse("Failed to confirm upload");
  }
}

function getBucketName(mediaType: "audiohqid" | "audiolqid" | "sonagramvideoid"): string {
  switch (mediaType) {
    case "audiohqid":
      return process.env.AUDIO_HQ_BUCKET || "audio-hq";
    case "audiolqid":
      return process.env.AUDIO_LQ_BUCKET || "audio-lq";
    case "sonagramvideoid":
      return process.env.SONAGRAMS_BUCKET || "sonogramvideos";
    default:
      throw new Error("Invalid media type");
  }
}
