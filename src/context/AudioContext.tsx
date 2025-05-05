import {
  Audio,
  type AVPlaybackStatus,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import type React from "react";
import { createContext, useState, useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";

// Types
export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export type AudioState = {
  isPlaying: boolean;
  isLoaded: boolean;
  duration: number;
  position: number;
  playbackSpeed: PlaybackSpeed;
  isLooping: boolean;
  currentAudioId: string | null;
  loadError: string | null;
  isBuffering: boolean;
  loadProgress: number;
};

type AudioContextType = {
  audioState: AudioState;
  setAudioState: React.Dispatch<React.SetStateAction<AudioState>>;
  loadAudio: (uri: string, audioId: string, autoPlay?: boolean) => Promise<boolean>;
  playAudio: () => Promise<boolean>;
  pauseAudio: () => Promise<boolean>;
  stopAudio: () => Promise<boolean>;
  seekAudio: (position: number) => Promise<boolean>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<boolean>;
  toggleLooping: () => Promise<boolean>;
  resetAudio: () => void;
};

// Initial state
const initialAudioState: AudioState = {
  isPlaying: false,
  isLoaded: false,
  duration: 0,
  position: 0,
  playbackSpeed: 1,
  isLooping: false,
  currentAudioId: null,
  loadError: null,
  isBuffering: false,
  loadProgress: 0,
};

// Create context
export const AudioContext = createContext<AudioContextType>({
  audioState: initialAudioState,
  setAudioState: () => {},
  loadAudio: async () => false,
  playAudio: async () => false,
  pauseAudio: async () => false,
  stopAudio: async () => false,
  seekAudio: async () => false,
  setPlaybackSpeed: async () => false,
  toggleLooping: async () => false,
  resetAudio: () => {},
});

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioState, setAudioState] = useState<AudioState>(initialAudioState);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const lastPositionUpdateRef = useRef(0);
  const appState = useRef(AppState.currentState);
  const loadCancelTokenRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const lastSeekTimeRef = useRef<number>(0);
  // Add a lock to prevent concurrent cleanup operations
  const isCleaningUpRef = useRef<boolean>(false);

  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (audioState.isPlaying && soundRef.current) {
          try {
            await soundRef.current.pauseAsync();
          } catch (error) {
            console.error("Error pausing audio on background:", error);
          }
        }
      } else if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        if (soundRef.current) {
          try {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded) {
              setAudioState((prev) => ({
                ...prev,
                isPlaying: status.isPlaying,
                position: status.positionMillis,
                duration: status.durationMillis || prev.duration,
              }));
            }
          } catch (error) {
            console.error("Error updating audio state on foreground:", error);
          }
        }
      }

      appState.current = nextAppState;
    },
    [audioState.isPlaying]
  );

  const cleanupAudio = useCallback(async () => {
    // Add a guard to prevent concurrent cleanup operations
    if (isCleaningUpRef.current) {
      console.log("🧹 [AudioContext] Cleanup already in progress, skipping");
      return;
    }

    try {
      isCleaningUpRef.current = true;
      console.log("🧹 [AudioContext] Starting cleanup");

      if (soundRef.current) {
        // Make sure to stop first to prevent lingering audio
        try {
          if (audioState.isPlaying) {
            console.log("🧹 [AudioContext] Stopping playback before cleanup");
            await soundRef.current.stopAsync();
          }
          console.log("🧹 [AudioContext] Unloading sound");
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        } catch (e) {
          // Ignore errors during cleanup, just ensure the reference is cleared
          console.error("❌ [AudioContext] Error cleaning up audio:", e);
          soundRef.current = null;
        }
      }
    } finally {
      isCleaningUpRef.current = false;
    }
  }, [audioState.isPlaying]);

  useEffect(() => {
    isMountedRef.current = true;

    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          // Add these important audio mode settings
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        });
      } catch (error) {
        console.error("Error setting audio mode:", error);
      }
    };

    setupAudio();

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      cleanupAudio();
    };
  }, [cleanupAudio, handleAppStateChange]);

  const resetAudio = useCallback(async () => {
    // Cancel any ongoing load operation
    loadCancelTokenRef.current++;

    await cleanupAudio();
    if (isMountedRef.current) {
      setAudioState(initialAudioState);
    }
  }, [cleanupAudio]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!isMountedRef.current || !status.isLoaded) return;

    // Don't process updates during active seeking or shortly after
    if (isSeekingRef.current || Date.now() - lastSeekTimeRef.current < 500) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastPositionUpdateRef.current;

    // Important state changes that should always be reflected
    const isStateChange =
      status.isPlaying !== audioState.isPlaying ||
      status.isBuffering !== audioState.isBuffering ||
      status.didJustFinish;

    // Throttle position updates heavily to avoid feedback loops
    const shouldUpdatePosition =
      timeSinceLastUpdate > 1000 || // Only update position once per second at most
      Math.abs(status.positionMillis - audioState.position) > 3000; // Unless there's a big jump

    if (isStateChange || shouldUpdatePosition) {
      if (shouldUpdatePosition) {
        lastPositionUpdateRef.current = now;
      }

      if (isMountedRef.current) {
        setAudioState((prev) => ({
          ...prev,
          isPlaying: status.isPlaying,
          duration: status.durationMillis || prev.duration,
          isBuffering: status.isBuffering || false,
          position: shouldUpdatePosition ? status.positionMillis : prev.position,
        }));
      }
    }

    if (status.didJustFinish && !status.isLooping) {
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  };

  const loadAudio = async (
    uri: string,
    audioId: string,
    autoPlay: boolean = false
  ): Promise<boolean> => {
    console.log("🎵 [AudioContext] Starting loadAudio:", { uri, audioId, autoPlay });

    // Increment token immediately to cancel any in-progress loads
    loadCancelTokenRef.current++;
    const currentLoadToken = loadCancelTokenRef.current;

    if (isLoadingRef.current) {
      console.log("⚠️ [AudioContext] Already loading audio, cancelling previous load");
    }

    isLoadingRef.current = true;

    try {
      // Reset state before loading
      if (isMountedRef.current) {
        console.log("🎵 [AudioContext] Resetting state before loading");
        setAudioState((prev) => ({
          ...prev,
          isBuffering: true,
          loadProgress: 0,
          loadError: null,
        }));
      }

      // Clean up previous audio first, but only once
      await cleanupAudio();

      // Check if loading was cancelled during cleanup
      if (currentLoadToken !== loadCancelTokenRef.current || !isMountedRef.current) {
        console.log("⚠️ [AudioContext] Loading cancelled during cleanup");
        return false;
      }

      console.log("🎵 [AudioContext] Creating sound object");

      // Set up audio mode first
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      // Check again if loading was cancelled or component unmounted
      if (currentLoadToken !== loadCancelTokenRef.current || !isMountedRef.current) {
        console.log("⚠️ [AudioContext] Loading cancelled after setting audio mode");
        return false;
      }

      // Create the audio object with a timeout
      let createAudioTimedOut = false;
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          createAudioTimedOut = true;
          resolve(null);
        }, 15000); // 15 second timeout
      });

      const createAudioPromise = Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          positionMillis: 0,
          progressUpdateIntervalMillis: 100,
          rate: 1.0,
          shouldCorrectPitch: true,
          volume: 1.0,
          isMuted: false,
          isLooping: false,
        },
        (status) => {
          // Only process callback if this is still the current load operation
          if (currentLoadToken === loadCancelTokenRef.current) {
            onPlaybackStatusUpdate(status);
          }
        },
        true
      );

      // Race the audio loading against a timeout
      const result = await Promise.race([createAudioPromise, timeoutPromise]);

      if (createAudioTimedOut || !result) {
        throw new Error("Audio loading timed out");
      }

      const { sound, status } = result;

      console.log("🎵 [AudioContext] Sound created, status:", status);

      // Check if loading was cancelled during creation or component unmounted
      if (currentLoadToken !== loadCancelTokenRef.current || !isMountedRef.current) {
        console.log("⚠️ [AudioContext] Loading cancelled during creation");
        await sound.unloadAsync().catch(() => {});
        return false;
      }

      soundRef.current = sound;

      if (!status.isLoaded) {
        throw new Error("Sound loaded but not ready");
      }

      console.log("🎵 [AudioContext] Setting final audio state");
      if (isMountedRef.current) {
        setAudioState({
          isLoaded: true,
          isPlaying: false,
          position: 0,
          duration: status.durationMillis || 0,
          playbackSpeed: 1,
          isLooping: false,
          currentAudioId: audioId,
          loadError: null,
          isBuffering: false,
          loadProgress: 1.0,
        });
      }

      console.log("🎵 [AudioContext] Audio loaded successfully");

      // Auto-play if requested and we're still the current loading operation
      if (autoPlay && currentLoadToken === loadCancelTokenRef.current && isMountedRef.current) {
        await playAudio();
      }

      return true;
    } catch (error) {
      console.error("❌ [AudioContext] Error loading audio:", error);

      // Only update state if this is still the current load operation and component is mounted
      if (currentLoadToken === loadCancelTokenRef.current && isMountedRef.current) {
        setAudioState((prev) => ({
          ...prev,
          isLoaded: false,
          isPlaying: false,
          loadError: error instanceof Error ? error.message : "Unknown error",
          isBuffering: false,
          loadProgress: 0,
        }));
      }

      return false;
    } finally {
      // Only clear loading flag if this is still the current load operation
      if (currentLoadToken === loadCancelTokenRef.current) {
        isLoadingRef.current = false;
      }
    }
  };

  const playAudio = async (): Promise<boolean> => {
    console.log("▶️ [AudioContext] Attempting to play audio");
    if (!soundRef.current || !audioState.isLoaded) {
      console.log("⚠️ [AudioContext] Cannot play - sound not loaded");
      return false;
    }

    try {
      console.log("▶️ [AudioContext] Setting audio mode");
      // Set audio active again in case it was deactivated
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      // Mark current time to prevent position updates for a moment
      lastPositionUpdateRef.current = Date.now();

      console.log("▶️ [AudioContext] Calling playAsync");
      const result = await soundRef.current.playAsync();
      console.log("▶️ [AudioContext] Play result:", result);
      return result.isLoaded && result.isPlaying;
    } catch (error) {
      console.error("❌ [AudioContext] Error playing audio:", error);
      return false;
    }
  };

  const pauseAudio = async (): Promise<boolean> => {
    console.log("⏸️ [AudioContext] Attempting to pause audio");
    if (!soundRef.current || !audioState.isLoaded) {
      console.log("⚠️ [AudioContext] Cannot pause - sound not loaded");
      return false;
    }

    try {
      const result = await soundRef.current.pauseAsync();
      console.log("⏸️ [AudioContext] Pause result:", result);
      return result.isLoaded && !result.isPlaying;
    } catch (error) {
      console.error("❌ [AudioContext] Error pausing audio:", error);
      return false;
    }
  };

  const stopAudio = async (): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false;

    try {
      await soundRef.current.stopAsync();
      await soundRef.current.setPositionAsync(0);
      return true;
    } catch (error) {
      console.error("Error stopping audio:", error);
      return false;
    }
  };

  const seekAudio = async (position: number): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false;

    try {
      // Add stronger debounce/throttle
      const seekTimeNow = Date.now();

      // Ignore very rapid seek requests
      if (isSeekingRef.current || seekTimeNow - lastSeekTimeRef.current < 300) {
        return false;
      }

      // Set flag to prevent feedback loops
      isSeekingRef.current = true;
      lastSeekTimeRef.current = seekTimeNow;

      // Ensure position is within bounds
      const safePosition = Math.max(0, Math.min(position, audioState.duration));

      // Manually update state first to provide immediate visual feedback
      if (isMountedRef.current) {
        setAudioState((prev) => ({
          ...prev,
          position: safePosition,
          isBuffering: true,
        }));
      }

      // Perform the actual seek
      const result = await soundRef.current.setPositionAsync(safePosition);

      // Update last position timestamp to prevent immediate position updates
      lastPositionUpdateRef.current = Date.now() + 500; // Add 500ms buffer

      // Clear seeking flag with a small delay to ensure any pending updates have completed
      setTimeout(() => {
        isSeekingRef.current = false;

        // Update final state after seek is complete and delay has passed
        if (isMountedRef.current) {
          setAudioState((prev) => ({
            ...prev,
            position: safePosition,
            isBuffering: false,
          }));
        }
      }, 300);

      return result.isLoaded;
    } catch (error) {
      console.error("Seek operation failed", error);
      isSeekingRef.current = false;
      if (isMountedRef.current) {
        setAudioState((prev) => ({ ...prev, isBuffering: false }));
      }
      return false;
    }
  };

  const setPlaybackSpeed = async (speed: PlaybackSpeed): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false;

    try {
      const result = await soundRef.current.setRateAsync(speed, true);

      if (isMountedRef.current) {
        setAudioState((prev) => ({
          ...prev,
          playbackSpeed: speed,
        }));
      }

      return result.isLoaded;
    } catch (error) {
      console.error("Error setting speed:", error);
      return false;
    }
  };

  const toggleLooping = async (): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false;

    try {
      const newLoop = !audioState.isLooping;

      const result = await soundRef.current.setIsLoopingAsync(newLoop);

      if (isMountedRef.current) {
        setAudioState((prev) => ({
          ...prev,
          isLooping: newLoop,
        }));
      }

      return result.isLoaded;
    } catch (error) {
      console.error("Error toggling loop:", error);
      return false;
    }
  };

  // Watchdog for stuck buffering - more robust implementation
  useEffect(() => {
    let watchdogTimer: NodeJS.Timeout | null = null;

    if (audioState.isBuffering) {
      const bufferingStartTime = Date.now();

      watchdogTimer = setInterval(() => {
        const bufferingDuration = Date.now() - bufferingStartTime;

        // If buffering for too long (8 seconds)
        if (bufferingDuration > 8000) {
          console.warn("Watchdog: Audio stuck buffering for too long, resetting");

          // Try to recover by stopping and starting playback
          if (soundRef.current) {
            soundRef.current
              .stopAsync()
              .then(() => {
                if (audioState.isPlaying) {
                  return soundRef.current?.playFromPositionAsync(audioState.position);
                }
              })
              .catch((err) => {
                console.error("Error in buffering recovery:", err);
                // If recovery fails, reset the audio completely
                if (bufferingDuration > 15000) {
                  resetAudio();
                }
              });
          }

          // Clear the watchdog after taking action
          if (watchdogTimer) {
            clearInterval(watchdogTimer);
            watchdogTimer = null;
          }
        }
      }, 2000); // Check every 2 seconds
    }

    return () => {
      if (watchdogTimer) {
        clearInterval(watchdogTimer);
      }
    };
  }, [audioState.isBuffering, audioState.isPlaying, audioState.position, resetAudio]);

  return (
    <AudioContext.Provider
      value={{
        audioState,
        setAudioState,
        loadAudio,
        playAudio,
        pauseAudio,
        stopAudio,
        seekAudio,
        setPlaybackSpeed,
        toggleLooping,
        resetAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
