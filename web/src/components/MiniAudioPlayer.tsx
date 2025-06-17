"use client";

import { Play, Pause, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "./ui/button";

type MiniAudioPlayerProps = {
  trackId: string;
  audioUri: string;
  size?: number;
};

export default function MiniAudioPlayer({
  trackId: _trackId,
  audioUri: _audioUri,
  size = 36,
}: MiniAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    // TODO: Implement audio playback logic
    setIsLoading(true);
    setTimeout(() => {
      setIsPlaying(!isPlaying);
      setIsLoading(false);
    }, 500);
  };

  return (
    <Button
      variant="default"
      size="icon"
      onClick={handlePress}
      disabled={isLoading}
      className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
      style={{ width: size, height: size }}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" style={{ width: size * 0.5, height: size * 0.5 }} />
      ) : isPlaying ? (
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
