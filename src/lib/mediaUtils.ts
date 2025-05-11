import { ENV } from "../config/env";
import type { Recording } from "../types";

import { supabase } from "./supabase";

/**
 * Gets the high-quality audio URI for a recording for streaming
 * @param recording The recording to get the high-quality audio URI for
 * @param isConnected Boolean indicating if there's an internet connection
 * @returns The URI to the high-quality audio file or null if not available
 */
export const getHighQualityAudioUri = (
  recording: Recording,
  isConnected: boolean
): string | null => {
  if (!recording || !recording.audiohqid || !isConnected) return null;

  // Use public URL from Supabase for high-quality audio (WAV)
  const { data } = supabase.storage
    .from(ENV.AUDIO_HQ_BUCKET)
    .getPublicUrl(`${recording.audiohqid}.wav`);
  return data?.publicUrl || null;
};

/**
 * Gets the low-quality audio URI for a recording
 * Will return the local file URI if downloaded, otherwise returns the public URL
 * @param recording The recording to get the low-quality audio URI for
 * @param isDownloaded Function to check if a recording is downloaded
 * @param getDownloadPath Function to get the path to a downloaded file
 * @param isConnected Boolean indicating if there's an internet connection
 * @returns The URI to the low-quality audio file or null if not available
 */
export const getLowQualityAudioUri = (
  recording: Recording,
  isDownloaded: (recordingId: string) => boolean,
  getDownloadPath: (fileId: string, isAudio: boolean) => string | null,
  isConnected: boolean
): string | null => {
  if (!recording || !recording.audiolqid) return null;

  if (isDownloaded(recording.id)) {
    // Use local file
    return getDownloadPath(recording.audiolqid, true);
  } else if (isConnected) {
    // Use public URL from Supabase for low-quality audio (MP3)
    const { data } = supabase.storage
      .from(ENV.AUDIO_LQ_BUCKET)
      .getPublicUrl(`${recording.audiolqid}.mp3`);
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
export const getSonogramVideoUri = (recording: Recording, isConnected: boolean): string | null => {
  if (!recording || !recording.sonogramvideoid || !isConnected) return null;

  // Use public URL from Supabase for sonogram video
  const { data } = supabase.storage
    .from(ENV.SONOGRAMS_BUCKET)
    .getPublicUrl(`${recording.sonogramvideoid}.mp4`);
  return data?.publicUrl || null;
};

/**
 * Gets the sonogram thumbnail URI for a recording
 * Will return the local file URI if downloaded, otherwise returns the public URL
 * @param recording The recording to get the sonogram thumbnail URI for
 * @param isDownloaded Function to check if a recording is downloaded
 * @param getDownloadPath Function to get the path to a downloaded file
 * @param isConnected Boolean indicating if there's an internet connection
 * @returns The URI to the sonogram thumbnail image or null if not available
 */
export const getSonogramThumbnailUri = (
  recording: Recording,
  isDownloaded: (recordingId: string) => boolean,
  getDownloadPath: (fileId: string, isAudio: boolean) => string | null,
  isConnected: boolean
): string | null => {
  if (!recording || !recording.sonogramvideoid) return null;

  if (isDownloaded(recording.id)) {
    // Use local file
    return getDownloadPath(recording.sonogramvideoid, false);
  } else if (isConnected) {
    // Use public URL from Supabase for sonogram thumbnail
    const { data } = supabase.storage
      .from(ENV.SONOGRAM_THUMBNAILS_BUCKET)
      .getPublicUrl(`${recording.sonogramvideoid}.png`);
    return data?.publicUrl || null;
  }

  return null;
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getLowQualityAudioUri instead
 */
export const getAudioUri = getLowQualityAudioUri;

/**
 * Legacy function for backward compatibility
 * @deprecated Use getSonogramThumbnailUri instead
 */
export const getSonogramUri = getSonogramThumbnailUri;
