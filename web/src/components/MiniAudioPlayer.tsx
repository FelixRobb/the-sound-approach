"use client";

import { Play, Pause, Loader2 } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";
import { MiniAudioPlayerProps } from "@/types";
import { cn } from "@/lib/utils";

export default function MiniAudioPlayer({ trackId, audioUri, size = 36 }: MiniAudioPlayerProps) {
  const { isPlaying, isLoading, currentTrackId, togglePlayPause } = useAudio();

  const isCurrentTrack = currentTrackId === trackId;
  const isCurrentlyPlaying = isPlaying && isCurrentTrack;
  const isCurrentlyLoading = isLoading && isCurrentTrack;

  const handlePress = async () => {
    await togglePlayPause(audioUri, trackId);
  };

  const buttonSize = size + 8;
  const iconSize = Math.max(16, size * 0.5);

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={handlePress}
        disabled={isCurrentlyLoading}
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-200",
          "bg-blue-600 hover:bg-blue-700 disabled:opacity-50",
          "shadow-lg hover:shadow-xl active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        )}
        style={{
          width: buttonSize,
          height: buttonSize,
          minWidth: buttonSize,
          minHeight: buttonSize,
        }}
      >
        {isCurrentlyLoading ? (
          <Loader2 size={iconSize} className="text-white animate-spin" />
        ) : isCurrentlyPlaying ? (
          <Pause size={iconSize} className="text-white" />
        ) : (
          <Play size={iconSize} className="text-white ml-0.5" />
        )}
      </button>
    </div>
  );
}
