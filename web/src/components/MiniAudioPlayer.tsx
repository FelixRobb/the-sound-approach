"use client";

import { Play, Pause, Loader2 } from "lucide-react";

import { Button } from "./ui/button";

import { useAudio } from "@/contexts/AudioContext";
import { MiniAudioPlayerProps } from "@/types";

export default function MiniAudioPlayer({
  trackId,
  audioUri,
  title,
  size = 36,
}: MiniAudioPlayerProps) {
  const { isPlaying, isLoading, currentTrackId, togglePlayPause } = useAudio();

  const isCurrentTrack = currentTrackId === trackId;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const isCurrentlyLoading = isCurrentTrack && isLoading;

  const handlePress = async (): Promise<void> => {
    await togglePlayPause(audioUri, trackId, title);
  };

  return (
    <Button
      variant="default"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        if (isCurrentlyLoading) return;
        void handlePress();
      }}
      className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
      style={{ width: size, height: size }}
      onPointerDown={(e) => e.preventDefault()}
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
            marginLeft: size * 0.05,
          }}
        />
      )}
    </Button>
  );
}
