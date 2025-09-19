import { NextRequest } from "next/server";

import { checkAdminAuth } from "@/lib/adminAuth";
import {
  unauthorizedResponse,
  serverErrorResponse,
  badRequestResponse,
  successResponse,
} from "@/lib/apiResponse";
import { MediaType } from "@/types";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return unauthorizedResponse();
    }

    const { recordingId, recNumber, mediaType } = (await request.json()) as {
      recordingId: string;
      recNumber: number;
      mediaType: MediaType;
    };

    if (!recordingId || !recNumber || !mediaType) {
      return badRequestResponse("Missing required fields: recordingId, recNumber, mediaType");
    }

    // Validate media type
    const allowedMediaTypes = ["audiohqid", "audiolqid", "sonagramvideoid"];
    if (!allowedMediaTypes.includes(mediaType)) {
      return badRequestResponse("Invalid media type");
    }

    const supabase = createAdminClient();
    const paddedRecNumber = recNumber.toString().padStart(4, "0");

    // Determine bucket and filename based on media type
    let fileName = "";
    let bucketName = "";
    let allowedMimeTypes: string[] = [];

    switch (mediaType) {
      case "audiohqid":
        fileName = `${paddedRecNumber}.wav`;
        bucketName = process.env.AUDIO_HQ_BUCKET || "audio-hq";
        allowedMimeTypes = ["audio/wav", "audio/mp3", "audio/mpeg"];
        break;
      case "audiolqid":
        fileName = `${paddedRecNumber}.mp3`;
        bucketName = process.env.AUDIO_LQ_BUCKET || "audio-lq";
        allowedMimeTypes = ["audio/mp3", "audio/wav", "audio/mpeg"];
        break;
      case "sonagramvideoid":
        fileName = `${paddedRecNumber}.mp4`;
        bucketName = process.env.SONAGRAMS_BUCKET || "sonogramvideos";
        allowedMimeTypes = ["video/mp4"];
        break;
    }

    // Generate a signed upload URL that expires in 10 minutes
    const { data: signedUrl, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(fileName, {
        upsert: true,
      });

    if (error) {
      console.error("Error creating signed upload URL:", error);
      return serverErrorResponse("Failed to create upload token");
    }

    // Create a temporary admin token for the client to use
    // This token will be used to verify the upload on completion
    const uploadToken = `admin_${recordingId}_${mediaType}_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    return successResponse({
      uploadUrl: signedUrl.signedUrl,
      token: uploadToken,
      fileName,
      bucketName,
      recordingId,
      mediaType,
      allowedMimeTypes,
      expiresIn: 600, // 10 minutes
    });
  } catch (error) {
    console.error("Error generating upload token:", error);
    return serverErrorResponse("Failed to generate upload token");
  }
}
