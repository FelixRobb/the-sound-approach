// Environment variables with fallbacks
export const ENV = {
  // Supabase bucket names
  AUDIO_HQ_BUCKET: process.env.AUDIO_HQ_BUCKET || "audio-hq",
  AUDIO_LQ_BUCKET: process.env.AUDIO_LQ_BUCKET || "audio-lq",
  SONOGRAMS_BUCKET: process.env.SONOGRAMS_BUCKET || "sonogramvideos",
  SONOGRAM_THUMBNAILS_BUCKET: process.env.SONOGRAM_THUMBNAILS_BUCKET || "sonogramthumbnails",
};
