import type { Recording } from "../types";

import { supabase } from "./supabase";

/**
 * Gets the audio URI for a recording
 * Will return the local file URI if downloaded, otherwise returns the public URL
 * @param recording The recording to get the audio URI for
 * @param isDownloaded Function to check if a recording is downloaded
 * @param getDownloadPath Function to get the path to a downloaded file
 * @param isConnected Boolean indicating if there's an internet connection
 * @returns The URI to the audio file or null if not available
 */
export const getAudioUri = (
  recording: Recording,
  isDownloaded: (recordingId: string) => boolean,
  getDownloadPath: (fileId: string, isAudio: boolean) => string | null,
  isConnected: boolean
): string | null => {
  if (!recording || !recording.audio_id) return null;

  if (isDownloaded(recording.id)) {
    // Use local file
    return getDownloadPath(recording.audio_id, true);
  } else if (isConnected) {
    // Use public URL from Supabase
    const { data } = supabase.storage.from("audio").getPublicUrl(`${recording.audio_id}.mp3`);
    return data?.publicUrl || null;
  }

  return null;
};

/**
 * Gets the sonogram URI for a recording
 * Will return the local file URI if downloaded, otherwise returns the public URL
 * @param recording The recording to get the sonogram URI for
 * @param isDownloaded Function to check if a recording is downloaded
 * @param getDownloadPath Function to get the path to a downloaded file
 * @param isConnected Boolean indicating if there's an internet connection
 * @returns The URI to the sonogram image or null if not available
 */
export const getSonogramUri = (
  recording: Recording,
  isDownloaded: (recordingId: string) => boolean,
  getDownloadPath: (fileId: string, isAudio: boolean) => string | null,
  isConnected: boolean
): string | null => {
  if (!recording || !recording.sonogram_id) return null;

  if (isDownloaded(recording.id)) {
    // Use local file
    return getDownloadPath(recording.sonogram_id, false);
  } else if (isConnected) {
    // Use public URL from Supabase
    const { data } = supabase.storage
      .from("sonograms")
      .getPublicUrl(`${recording.sonogram_id}.png`);
    return data?.publicUrl || null;
  }

  return null;
};
