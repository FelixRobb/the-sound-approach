"use client";

import { Play, Pause, Loader2 } from "lucide-react";

import { Button } from "./ui/button";

import { useAudio } from "@/contexts/AudioContext";

type MiniAudioPlayerProps = {
  trackId: string;
  audioUri: string;
  size?: number;
};

export default function MiniAudioPlayer({ trackId, audioUri, size = 36 }: MiniAudioPlayerProps) {
  const { isPlaying, isLoading, currentTrackId, togglePlayPause } = useAudio();

  const isCurrentTrack = currentTrackId === trackId;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const isCurrentlyLoading = isCurrentTrack && isLoading;

  const handlePress = async () => {
    await togglePlayPause(audioUri, trackId);
  };

  return (
    <Button
      variant="default"
      size="icon"
      onClick={handlePress}
      disabled={isCurrentlyLoading}
      className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
      style={{ width: size, height: size }}
    >
      {isCurrentlyLoading ? (
        <Loader2 className="animate-spin" style={{ width: size * 0.5, height: size * 0.5 }} />
      ) : isCurrentlyPlaying ? (
        <Pause style={{ width: size * 0.5, height: size * 0.5 }} />
      ) : (
        <Play
          style={{
            width: size * 0.5,
            height: size * 0.5,
            marginLeft: size * 0.05, // Slight offset for visual centering
          }}
        />
      )}
    </Button>
  );
}
