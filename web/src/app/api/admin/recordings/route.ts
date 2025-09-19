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

    const contentType = request.headers.get("content-type") || "";
    let recordingData: Partial<Recording>;
    const files: { [key: string]: File } = {};

    // Handle both JSON and FormData requests
    if (contentType.includes("multipart/form-data")) {
      // Handle FormData with files
      const formData = await request.formData();

      // Extract recording data
      const recordingDataStr = formData.get("recordingData") as string;
      recordingData = JSON.parse(recordingDataStr) as Partial<Recording>;

      // Extract files
      const audiohqFile = formData.get("audiohqid") as File | null;
      const audiolqFile = formData.get("audiolqid") as File | null;
      const sonagramFile = formData.get("sonagramvideoid") as File | null;

      if (audiohqFile) files.audiohqid = audiohqFile;
      if (audiolqFile) files.audiolqid = audiolqFile;
      if (sonagramFile) files.sonagramvideoid = sonagramFile;
    } else {
      // Handle JSON request (backwards compatibility)
      recordingData = (await request.json()) as Partial<Recording>;
    }

    const supabase = createAdminClient();

    // Remove any undefined values and the species relation data
    const { species, ...insertData } = recordingData;
    const cleanInsertData = Object.fromEntries(
      Object.entries(insertData).filter(([_, value]) => value !== undefined && value !== "")
    );

    // Create the recording first
    const { data: createdRecording, error } = (await supabase
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

    let finalRecording = createdRecording;

    // Upload files if any are provided
    if (Object.keys(files).length > 0) {
      const paddedRecNumber = createdRecording.rec_number.toString().padStart(4, "0");

      for (const [mediaType, file] of Object.entries(files)) {
        try {
          // Validate file type
          const allowedTypes = {
            audiohqid: ["audio/mp3", "audio/wav", "audio/mpeg"],
            audiolqid: ["audio/mp3", "audio/wav", "audio/mpeg"],
            sonagramvideoid: ["video/mp4"],
          };

          if (!allowedTypes[mediaType as keyof typeof allowedTypes]?.includes(file.type)) {
            console.warn(`Invalid file type for ${mediaType}: ${file.type}`);
            continue;
          }

          // Determine bucket and filename
          let fileName = "";
          let bucketName = "";

          switch (mediaType) {
            case "audiohqid":
              fileName = `${paddedRecNumber}.wav`;
              bucketName = process.env.AUDIO_HQ_BUCKET || "audio-hq";
              break;
            case "audiolqid":
              fileName = `${paddedRecNumber}.mp3`;
              bucketName = process.env.AUDIO_LQ_BUCKET || "audio-lq";
              break;
            case "sonagramvideoid":
              fileName = `${paddedRecNumber}.mp4`;
              bucketName = process.env.SONAGRAMS_BUCKET || "sonogramvideos";
              break;
            default:
              continue;
          }

          // Delete existing file if it exists
          await supabase.storage.from(bucketName).remove([fileName]);

          // Upload new file
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: true,
            });

          if (uploadError) {
            console.warn(`Failed to upload ${mediaType}:`, uploadError);
            continue;
          }

          // Update database record with filename (without extension)
          const { data: updatedRecording, error: updateError } = (await supabase
            .from("recordings")
            .update({ [mediaType]: paddedRecNumber })
            .eq("id", createdRecording.id)
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

          if (!updateError && updatedRecording) {
            finalRecording = updatedRecording;
          }
        } catch (fileError) {
          console.warn(`Error processing file ${mediaType}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    return successResponse(finalRecording);
  } catch (error) {
    console.error("Error creating recording:", error);
    return serverErrorResponse("Failed to create recording");
  }
}
