"use client";

import { createContext, useContext, useState, useRef, ReactNode, useCallback } from "react";

import { AudioPlayerState } from "@/types";

type AudioContextType = {
  isPlaying: boolean;
  isLoading: boolean;
  currentTrackId: string | null;
  error: string | null;
  togglePlayPause: (uri: string, trackId: string) => Promise<boolean>;
  stop: () => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const initialState: AudioPlayerState = {
  isPlaying: false,
  isLoading: false,
  currentTrackId: null,
  error: null,
};

export function AudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioPlayerState>(initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUriRef = useRef<string | null>(null);

  const updateState = useCallback((partialState: Partial<AudioPlayerState>) => {
    setState((prev) => ({ ...prev, ...partialState }));
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    currentUriRef.current = null;
    updateState({
      isPlaying: false,
      isLoading: false,
      currentTrackId: null,
      error: null,
    });
  }, [updateState]);

  const togglePlayPause = useCallback(
    async (uri: string, trackId: string): Promise<boolean> => {
      try {
        // If same track is playing, just toggle pause/play
        if (state.currentTrackId === trackId && audioRef.current) {
          if (state.isPlaying) {
            audioRef.current.pause();
            updateState({ isPlaying: false });
            return false;
          } else {
            await audioRef.current.play();
            updateState({ isPlaying: true });
            return true;
          }
        }

        // Stop current track if different track
        if (audioRef.current && state.currentTrackId !== trackId) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        // Load and play new track
        updateState({
          isLoading: true,
          currentTrackId: trackId,
          error: null,
        });

        const audio = new Audio(uri);
        audioRef.current = audio;
        currentUriRef.current = uri;

        // Set up event listeners
        audio.addEventListener("loadstart", () => {
          updateState({ isLoading: true });
        });

        audio.addEventListener("canplaythrough", () => {
          updateState({ isLoading: false });
        });

        audio.addEventListener("play", () => {
          updateState({ isPlaying: true, isLoading: false });
        });

        audio.addEventListener("pause", () => {
          updateState({ isPlaying: false });
        });

        audio.addEventListener("ended", () => {
          updateState({
            isPlaying: false,
            currentTrackId: null,
          });
          audioRef.current = null;
          currentUriRef.current = null;
        });

        audio.addEventListener("error", () => {
          const error = "Failed to load audio";
          updateState({
            error,
            isLoading: false,
            isPlaying: false,
            currentTrackId: null,
          });
          audioRef.current = null;
          currentUriRef.current = null;
        });

        // Start playing
        await audio.play();
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to play audio";
        updateState({
          error: errorMessage,
          isLoading: false,
          isPlaying: false,
          currentTrackId: null,
        });

        if (audioRef.current) {
          audioRef.current = null;
        }
        currentUriRef.current = null;
        return false;
      }
    },
    [state.currentTrackId, state.isPlaying, updateState]
  );

  return (
    <AudioContext.Provider
      value={{
        isPlaying: state.isPlaying,
        isLoading: state.isLoading,
        currentTrackId: state.currentTrackId,
        error: state.error,
        togglePlayPause,
        stop,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
