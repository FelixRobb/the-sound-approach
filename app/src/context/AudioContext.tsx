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
  stopPlayback: () => Promise<void>;
};

// Create the context with default values
const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  isLoading: false,
  currentTrackId: null,
  error: null,
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
    trackId: null,
    playbackState: "idle",
    error: null,
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
  const togglePlayPause = async (uri: string, trackId: string): Promise<boolean> => {
    try {
      // If offline and not a downloaded file (file:// URI), don't play
      if (!isConnected && !uri.startsWith("file://")) {
        return false;
      }
      // Use the simplified playTrack method which handles all the logic
      const result = await audioService.playTrack(uri, trackId);

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

  // Context value
  const contextValue: AudioContextType = {
    isPlaying: audioState.playbackState === "playing",
    isLoading: audioState.playbackState === "loading",
    currentTrackId: audioState.trackId,
    error: audioState.error,
    togglePlayPause,
    stopPlayback,
  };

  return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>;
};

// Custom hook for using the audio context
export const useAudio = () => useContext(AudioContext);

export default AudioContext;
