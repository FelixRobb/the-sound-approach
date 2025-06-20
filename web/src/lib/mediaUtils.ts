import { ENV } from "@/config/env";
import { Recording } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Get the best available audio URI for a recording
export const getBestAudioUri = (recording: Recording): string | null => {
  if (!recording) return null;

  // For web, we'll prefer high quality audio
  if (recording.audiohqid) {
    return `${supabaseUrl}/storage/v1/object/public/${ENV.AUDIO_HQ_BUCKET}/${recording.audiohqid}.wav`;
  }

  // Fallback to low quality if high quality not available
  if (recording.audiolqid) {
    return `${supabaseUrl}/storage/v1/object/public/${ENV.AUDIO_LQ_BUCKET}/${recording.audiolqid}.mp3`;
  }

  return null;
};

// Get sonogram video URI for a recording
export const getSonogramVideoUri = (recording: Recording): string | null => {
  if (!recording?.sonogramvideoid) return null;

  return `${supabaseUrl}/storage/v1/object/public/${ENV.SONOGRAMS_BUCKET}/${recording.sonogramvideoid}.mp4`;
};

// Format duration in seconds to MM:SS format
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Check if a URL is accessible
export const checkMediaAvailability = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};
