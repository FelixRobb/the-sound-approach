import { PostgrestError } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { checkAdminAuth } from "@/lib/adminAuth";
import { Recording } from "@/types";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const recordingId = formData.get("recordingId") as string;
    const mediaType = formData.get("mediaType") as string; // 'audiohqid', 'audiolqid', 'sonagramvideoid'
    const recNumber = formData.get("recNumber") as string;

    if (!file || !recordingId || !mediaType || !recNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Validate file type
    const allowedTypes = {
      audiohqid: ["audio/mp3", "audio/wav", "audio/mpeg"],
      audiolqid: ["audio/mp3", "audio/wav", "audio/mpeg"],
      sonagramvideoid: ["video/mp4"],
    };

    if (!allowedTypes[mediaType as keyof typeof allowedTypes]?.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
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

    const supabase = createAdminClient();

    // Generate filename based on rec_number (4 digits)
    const paddedRecNumber = recNumber.padStart(4, "0");
    let fileName = "";
    let bucketName = "";

    switch (mediaType) {
      case "audiohqid":
        fileName = `${paddedRecNumber}.mp3`;
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
        return NextResponse.json(
          { error: "Invalid media type" },
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

    // Delete existing file if it exists
    const { error: deleteError } = await supabase.storage.from(bucketName).remove([fileName]);
    if (deleteError) {
      throw deleteError;
    }
    // Note: We don't throw on delete error as the file might not exist

    // Upload new file
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (uploadError) {
      throw uploadError;
    }

    // Update database record with filename (without extension)
    const { data: recordingData, error: updateError } = (await supabase
      .from("recordings")
      .update({ [mediaType]: paddedRecNumber })
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
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      fileName,
      recording: recordingData,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
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

export async function DELETE(request: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get("recordingId");
    const mediaType = searchParams.get("mediaType");
    const recNumber = searchParams.get("recNumber");

    if (!recordingId || !mediaType || !recNumber) {
      return NextResponse.json(
        { error: "Missing required parameters" },
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

    const supabase = createAdminClient();
    const paddedRecNumber = recNumber.padStart(4, "0");

    let fileName = "";
    let bucketName = "";

    switch (mediaType) {
      case "audiohqid":
        fileName = `${paddedRecNumber}.mp3`;
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
        return NextResponse.json(
          { error: "Invalid media type" },
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

    // Delete file from storage
    const { error: deleteError } = await supabase.storage.from(bucketName).remove([fileName]);

    if (deleteError) {
      throw deleteError;
    }

    // Clear database reference
    const { data: recordingData, error: updateError } = (await supabase
      .from("recordings")
      .update({ [mediaType]: null })
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
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      recording: recordingData,
    });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
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
