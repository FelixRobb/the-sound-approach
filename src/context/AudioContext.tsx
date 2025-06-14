import { useNavigationState } from "@react-navigation/native";
import type React from "react";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import AudioService, { type AudioPlayerState } from "../lib/AudioService";

import { NetworkContext } from "./NetworkContext";

// Context type definition
type AudioContextType = {
  // Current audio state
  isPlaying: boolean;
  isLoading: boolean;
  currentTrackId: string | null;
  error: string | null;

  // Actions
  togglePlayPause: (uri: string, trackId: string) => Promise<boolean>;
};

// Create the context with default values
const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  isLoading: false,
  currentTrackId: null,
  error: null,
  togglePlayPause: () => Promise.resolve(false),
});

// Provider component
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get audio service instance
  const audioService = AudioService.getInstance();

  // Get network status
  const { isConnected } = useContext(NetworkContext);

  // Create a unique ID for this component instance
  const listenerId = useRef(uuidv4()).current;

  // Track the audio state
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    trackId: null,
    playbackState: "idle",
    error: null,
  });

  // Track the current playing URI to check if it's a local file
  const [currentPlayingUri, setCurrentPlayingUri] = useState<string | null>(null);

  // Track navigation state to detect screen changes
  const currentRouteName = useNavigationState((state) => state?.routes[state.index]?.name);
  const previousRouteRef = useRef<string | null>(null);

  // Set up listener for audio state changes
  useEffect(() => {
    audioService.addListener(listenerId, setAudioState);

    // Cleanup function to ensure audio is stopped when provider unmounts
    return () => {
      audioService.removeListener(listenerId);
      audioService.stop().catch(console.error);
    };
  }, [listenerId, audioService]);

  // Stop playback when route changes - ALWAYS
  useEffect(() => {
    // Skip on first render
    if (previousRouteRef.current !== null && previousRouteRef.current !== currentRouteName) {
      // Stop any playing audio when screen changes
      audioService.stop().catch((error) => {
        console.error("Error stopping playback during navigation:", error);
      });
      setCurrentPlayingUri(null);
    }

    previousRouteRef.current = currentRouteName;
  }, [currentRouteName, audioService]);

  // Stop playback when going offline ONLY if the current track is NOT a downloaded file
  useEffect(() => {
    if (
      !isConnected &&
      audioState.playbackState === "playing" &&
      currentPlayingUri &&
      !currentPlayingUri.startsWith("file://")
    ) {
      // Only stop if it's not a local file
      audioService.stop().catch(console.error);
      setCurrentPlayingUri(null);
    }
  }, [isConnected, audioState.playbackState, currentPlayingUri, audioService]);

  // Toggle play/pause for a track
  const togglePlayPause = async (uri: string, trackId: string): Promise<boolean> => {
    try {
      // If offline and not a downloaded file (file:// URI), don't play
      if (!isConnected && !uri.startsWith("file://")) {
        return false;
      }

      // Store the current playing URI for offline checks
      setCurrentPlayingUri(uri);

      // Use the simplified playTrack method which handles all the logic
      const result = await audioService.playTrack(uri, trackId);

      // Clear the URI if playback failed
      if (!result) {
        setCurrentPlayingUri(null);
      }

      return result;
    } catch (error) {
      console.error("Error toggling playback:", error);
      setCurrentPlayingUri(null);
      return false;
    }
  };

  // Context value
  const contextValue: AudioContextType = {
    isPlaying: audioState.playbackState === "playing",
    isLoading: audioState.playbackState === "loading",
    currentTrackId: audioState.trackId,
    error: audioState.error,
    togglePlayPause,
  };

  return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>;
};

// Custom hook for using the audio context
export const useAudio = () => useContext(AudioContext);

export default AudioContext;
