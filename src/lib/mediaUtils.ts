import { ENV } from "../config/env";
import type { Recording } from "../types";

import { supabase } from "./supabase";

export const getBestAudioUri = (
  recording: Recording,
  isDownloaded: (recordingId: string) => boolean,
  getDownloadPath: (fileId: string, isAudio: boolean) => string | null,
  isConnected: boolean
): string | null => {
  if (!recording) return null;

  // First try to use downloaded audio if available
  if (recording.audiolqid && isDownloaded(recording.id)) {
    const localPath = getDownloadPath(recording.audiolqid, true);
    if (localPath) return localPath;
  }

  // If not downloaded or download path not available, use high-quality streaming
  if (isConnected && recording.audiohqid) {
    // Use public URL from Supabase for high-quality audio (WAV)
    const { data } = supabase.storage
      .from(ENV.AUDIO_HQ_BUCKET)
      .getPublicUrl(`${recording.audiohqid}.wav`);
    return data?.publicUrl || null;
  }

  return null;
};

/**
 * Gets the sonogram video URI for a recording
 * @param recording The recording to get the sonogram video URI for
 * @param isConnected Boolean indicating if there's an internet connection
 * @returns The URI to the sonogram video or null if not available
 */
export const getSonogramVideoUri = (recording: Recording): string | null => {
  if (!recording || !recording.sonogramvideoid) return null;

  // Use public URL from Supabase for sonogram video
  const { data } = supabase.storage
    .from(ENV.SONOGRAMS_BUCKET)
    .getPublicUrl(`${recording.sonogramvideoid}.mp4`);
  return data?.publicUrl || null;
};
