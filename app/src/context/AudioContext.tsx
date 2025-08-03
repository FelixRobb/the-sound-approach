import type React from "react";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import AudioService, { type AudioPlayerState } from "../lib/AudioService";
import { Recording } from "../types";

import { NetworkContext } from "./NetworkContext";

// Context type definition
type AudioContextType = {
  // Current audio state
  isPlaying: boolean;
  isLoading: boolean;
  currentRecording: Recording | null;
  error: string | null;

  // Position state
  position: number;
  duration: number;

  // Seeking helpers
  seekTo: (seconds: number) => Promise<boolean>;
  skipForward: (seconds?: number) => Promise<boolean>;
  skipBackward: (seconds?: number) => Promise<boolean>;

  // Preload
  loadTrack: (uri: string, recording: Recording) => Promise<boolean>;

  // Actions
  togglePlayPause: (uri: string, recording: Recording) => Promise<boolean>;
  stopPlayback: () => Promise<void>;
};

// Create the context with default values
const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  isLoading: false,
  currentRecording: null,
  error: null,
  position: 0,
  duration: 0,
  seekTo: () => Promise.resolve(false),
  skipForward: () => Promise.resolve(false),
  skipBackward: () => Promise.resolve(false),
  loadTrack: () => Promise.resolve(false),
  togglePlayPause: () => Promise.resolve(false),
  stopPlayback: () => Promise.resolve(),
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
    playbackState: "idle",
    error: null,
    position: 0,
    duration: 0,
    recording: null,
  });

  // Track the currently loaded/playing sound by its URI (no longer needed after offline-stop removal)

  // Set up listener for audio state changes
  useEffect(() => {
    audioService.addListener(listenerId, setAudioState);

    // Cleanup function to ensure audio is stopped when provider unmounts
    return () => {
      audioService.removeListener(listenerId);
      audioService.stop().catch(console.error);
    };
  }, [listenerId, audioService]);

  /**
   * Previous implementation stopped any remote-streamed audio as soon as
   * the connection status briefly reported "offline".  Because NetInfo can
   * fluctuate for a few milliseconds when a request starts, this resulted in
   * playback being halted almost immediately after the user pressed the
   * play-button.  We rely on the existing guard inside `togglePlayPause`
   * (which simply refuses to start a remote track when the device is truly
   * offline) and therefore no longer force-stop playback here – downloaded
   * files can continue playing even if the user moves out of coverage.
   */

  // Toggle play/pause for a track
  const togglePlayPause = async (uri: string, recording: Recording): Promise<boolean> => {
    try {
      // If offline and not a downloaded file (file:// URI), don't play
      if (!isConnected && !uri.startsWith("file://")) {
        return false;
      }
      // Use the simplified playTrack method which handles all the logic
      const result = await audioService.playTrack(uri, recording);

      // Nothing else to clear – AudioService handles its own state

      return result;
    } catch (error) {
      console.error("Error toggling playback:", error);
      return false;
    }
  };

  // Stop playback method
  const stopPlayback = async (): Promise<void> => {
    try {
      await audioService.stop();
    } catch (error) {
      console.error("Error stopping playback:", error);
    }
  };

  // Seek helpers – simply proxy to AudioService
  const seekTo = (seconds: number) => audioService.seekTo(seconds);
  const skipForward = (seconds = 10) => audioService.skipForward(seconds);
  const skipBackward = (seconds = 10) => audioService.skipBackward(seconds);

  // Preload helper
  const loadTrack = async (uri: string, recording: Recording): Promise<boolean> => {
    try {
      if (!isConnected && !uri.startsWith("file://")) return false;
      return await audioService.loadTrack(uri, recording);
    } catch (e) {
      console.error("Error loading track:", e);
      return false;
    }
  };

  // Context value
  const contextValue: AudioContextType = {
    isPlaying: audioState.playbackState === "playing",
    isLoading: audioState.playbackState === "loading",
    currentRecording: audioState.recording,
    error: audioState.error,
    position: audioState.position ?? 0,
    duration: audioState.duration ?? 0,
    seekTo,
    skipForward,
    skipBackward,
    loadTrack,
    togglePlayPause,
    stopPlayback,
  };

  return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>;
};

// Custom hook for using the audio context
export const useAudio = () => useContext(AudioContext);

export default AudioContext;
