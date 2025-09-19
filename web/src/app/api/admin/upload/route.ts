import { PostgrestError } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { checkAdminAuth } from "@/lib/adminAuth";
import { MediaType, Recording } from "@/types";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  const isAuthorized = await checkAdminAuth(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { recording, mediaType } = (await request.json()) as {
    recording: Recording;
    mediaType: MediaType;
  };
  if (!mediaType || !recording) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }
  let fileName = "";
  let bucketName = "";

  switch (mediaType) {
    case "audiohqid":
      fileName = `${recording.audiohqid}.wav`;
      bucketName = process.env.AUDIO_HQ_BUCKET || "audio-hq";
      break;
    case "audiolqid":
      fileName = `${recording.audiolqid}.mp3`;
      bucketName = process.env.AUDIO_LQ_BUCKET || "audio-lq";
      break;
    case "sonagramvideoid":
      fileName = `${recording.sonagramvideoid}.mp4`;
      bucketName = process.env.SONAGRAMS_BUCKET || "sonogramvideos";
      break;
  }
  const supabase = createAdminClient();

  const { data, error } = (await supabase.storage
    .from(bucketName)
    .createSignedUrl(fileName, 60 * 60 * 24 * 30)) as {
    data: { signedUrl: string };
    error: PostgrestError | null;
  };
  if (error) {
    return NextResponse.json({ error: "Error fetching recording" }, { status: 500 });
  }
  return NextResponse.json({
    mediaType,
    recordingId: recording.id,
    recNumber: recording.rec_number,
    signedUrl: data.signedUrl,
  });
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
