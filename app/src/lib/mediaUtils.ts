import { ENV } from "../config/env";
import type { Recording } from "../types";

import { supabase } from "./supabase";

export const getBestAudioUri = async (
  recording: Recording,
  isDownloaded: (recordingId: string) => boolean,
  getDownloadPath: (fileId: string, isAudio: boolean) => string | null,
  isConnected: boolean
): Promise<string | null> => {
  if (!recording) return null;
  // First try to use downloaded audio if available
  if (recording.audiolqid && isDownloaded(recording.id)) {
    const localPath = getDownloadPath(recording.audiolqid, true);
    if (localPath) return localPath;
  }

  // If not downloaded or download path not available, use high-quality streaming
  if (isConnected && recording.audiohqid) {
    // Use public URL from Supabase for high-quality audio (WAV)
    const { data, error } = await supabase.storage
      .from(ENV.AUDIO_HQ_BUCKET)
      .createSignedUrl(`${recording.audiohqid}.wav`, 60 * 60 * 24 * 30);
    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }
    return data?.signedUrl || null;
  }

  return null;
};

/**
 * Gets the sonogram video URI for a recording
 * @param recording The recording to get the sonogram video URI for
 * @param isConnected Boolean indicating if there's an internet connection
 * @returns The URI to the sonogram video or null if not available
 */
export const getSonogramVideoUri = async (recording: Recording): Promise<string | null> => {
  if (!recording || !recording.sonogramvideoid) return null;

  // Use public URL from Supabase for sonogram video
  const { data, error } = await supabase.storage
    .from(ENV.SONOGRAMS_BUCKET)
    .createSignedUrl(`${recording.sonogramvideoid}.mp4`, 60 * 60 * 24 * 30);
  if (error) {
    console.error("Error creating signed URL:", error);
    throw error;
  }
  return data?.signedUrl as string | null;
};
