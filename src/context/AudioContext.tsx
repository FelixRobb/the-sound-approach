"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import AudioService, { type AudioPlayerState, type PlaybackSpeed } from "../lib/AudioService";

// Context type definition
type AudioContextType = {
  // Current audio state
  isPlaying: boolean;
  isLoaded: boolean;
  duration: number;
  position: number;
  currentTrackId: string | null;
  playbackSpeed: PlaybackSpeed;
  isLooping: boolean;
  error: string | null;

  // Actions
  playTrack: (uri: string, trackId: string) => Promise<boolean>;
  togglePlayPause: (uri: string, trackId: string) => Promise<boolean>;
  stopPlayback: () => Promise<boolean>;
  seekTo: (position: number) => Promise<boolean>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<boolean>;
  toggleLooping: () => Promise<boolean>;
  loadTrackOnly: (uri: string, trackId: string) => Promise<boolean>;
};

// Create the context with default values
const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  isLoaded: false,
  duration: 0,
  position: 0,
  currentTrackId: null,
  playbackSpeed: 1,
  isLooping: false,
  error: null,

  playTrack: async () => false,
  togglePlayPause: async () => false,
  stopPlayback: async () => false,
  seekTo: async () => false,
  setPlaybackSpeed: async () => false,
  toggleLooping: async () => false,
  loadTrackOnly: async () => false,
});

// Provider component
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get audio service instance
  const audioService = AudioService.getInstance();

  // Create a unique ID for this component instance
  const listenerId = useRef(uuidv4()).current;

  // Track the audio state
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    trackId: null,
    playbackState: "idle",
    position: 0,
    duration: 0,
    speed: 1,
    isLooping: false,
    error: null,
  });

  // Set up listener for audio state changes
  useEffect(() => {
    audioService.addListener(listenerId, setAudioState);

    return () => {
      audioService.removeListener(listenerId);
    };
  }, [listenerId, audioService]);

  // Play a track
  const playTrack = useCallback(
    async (uri: string, trackId: string): Promise<boolean> => {
      try {
        // If it's already the current track and loaded, just play it
        if (
          audioState.trackId === trackId &&
          audioState.playbackState !== "idle" &&
          audioState.playbackState !== "error"
        ) {
          return audioService.play();
        }

        // Otherwise load and play the track
        const loadSuccess = await audioService.loadTrack(uri, trackId);
        if (loadSuccess) {
          return audioService.play();
        }
        return false;
      } catch (error) {
        console.error("Error playing track:", error);
        return false;
      }
    },
    [audioService, audioState.trackId, audioState.playbackState]
  );

  // Toggle play/pause for a track
  const togglePlayPause = useCallback(
    async (uri: string, trackId: string): Promise<boolean> => {
      try {
        // If it's the current track, toggle play/pause
        if (audioState.trackId === trackId) {
          if (audioState.playbackState === "playing") {
            return audioService.pause();
          } else if (audioState.playbackState === "paused") {
            return audioService.play();
          } else if (audioState.playbackState === "error") {
            // If there was an error, try loading again
            const loadSuccess = await audioService.loadTrack(uri, trackId);
            if (loadSuccess) {
              return audioService.play();
            }
            return false;
          }
        }

        // If it's a different track or not loaded, load and play it
        return playTrack(uri, trackId);
      } catch (error) {
        console.error("Error toggling playback:", error);
        return false;
      }
    },
    [audioService, audioState.trackId, audioState.playbackState, playTrack]
  );

  // Stop playback
  const stopPlayback = useCallback(async (): Promise<boolean> => {
    return audioService.unloadTrack();
  }, [audioService]);

  // Seek to position
  const seekTo = useCallback(
    async (position: number): Promise<boolean> => {
      return audioService.seekTo(position);
    },
    [audioService]
  );

  // Set playback speed
  const setPlaybackSpeed = useCallback(
    async (speed: PlaybackSpeed): Promise<boolean> => {
      return audioService.setSpeed(speed);
    },
    [audioService]
  );

  // Toggle looping
  const toggleLooping = useCallback(async (): Promise<boolean> => {
    return audioService.setLooping(!audioState.isLooping);
  }, [audioService, audioState.isLooping]);

  // Load a track without playing it
  const loadTrackOnly = useCallback(
    async (uri: string, trackId: string): Promise<boolean> => {
      try {
        // If it's already the current track and loaded, return true
        if (
          audioState.trackId === trackId &&
          audioState.playbackState !== "idle" &&
          audioState.playbackState !== "error"
        ) {
          return true;
        }

        // Otherwise load the track without playing
        return await audioService.loadTrack(uri, trackId);
      } catch (error) {
        console.error("Error loading track:", error);
        return false;
      }
    },
    [audioService, audioState.trackId, audioState.playbackState]
  );

  // Context value
  const contextValue: AudioContextType = {
    isPlaying: audioState.playbackState === "playing",
    isLoaded: audioState.playbackState === "playing" || audioState.playbackState === "paused",
    duration: audioState.duration,
    position: audioState.position,
    currentTrackId: audioState.trackId,
    playbackSpeed: audioState.speed,
    isLooping: audioState.isLooping,
    error: audioState.error,

    playTrack,
    togglePlayPause,
    stopPlayback,
    seekTo,
    setPlaybackSpeed,
    toggleLooping,
    loadTrackOnly,
  };

  return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>;
};

// Custom hook for using the audio context
export const useAudio = () => useContext(AudioContext);

export default AudioContext;
