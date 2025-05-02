import type React from "react"
import { createContext, useState, useEffect, useRef, useCallback } from "react"
import { Audio, type AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"
import { AppState, type AppStateStatus } from "react-native"

// Types
type PlaybackSpeed = 0.5 | 1 | 1.5 | 2

type AudioState = {
  isPlaying: boolean
  isLoaded: boolean
  duration: number
  position: number
  playbackSpeed: PlaybackSpeed
  isLooping: boolean
  currentAudioId: string | null
  loadError: string | null
  isBuffering: boolean
  loadProgress: number // Added to track download progress
}

type AudioContextType = {
  audioState: AudioState
  loadAudio: (uri: string, audioId: string, autoPlay?: boolean) => Promise<boolean>
  playAudio: () => Promise<boolean>
  pauseAudio: () => Promise<boolean>
  stopAudio: () => Promise<boolean>
  seekAudio: (position: number) => Promise<boolean>
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<boolean>
  toggleLooping: () => Promise<boolean>
  resetAudio: () => void
}

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
  loadProgress: 0
}

// Create context
export const AudioContext = createContext<AudioContextType>({
  audioState: initialAudioState,
  loadAudio: async () => false,
  playAudio: async () => false,
  pauseAudio: async () => false,
  stopAudio: async () => false,
  seekAudio: async () => false,
  setPlaybackSpeed: async () => false,
  toggleLooping: async () => false,
  resetAudio: () => {}
})

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioState, setAudioState] = useState<AudioState>(initialAudioState)
  const soundRef = useRef<Audio.Sound | null>(null)
  const isMountedRef = useRef(true)
  const isLoadingRef = useRef(false)
  const lastPositionUpdateRef = useRef(0)
  const appState = useRef(AppState.currentState)
  const loadCancelTokenRef = useRef<number>(0)

  const cleanupAudio = useCallback(async () => {
    try {
      if (soundRef.current) {
        // Make sure to stop first to prevent lingering audio
        await soundRef.current.stopAsync().catch(() => {})
        await soundRef.current.unloadAsync().catch(() => {})
        soundRef.current = null
      }
    } catch (e) {
      console.error("Error cleaning up audio:", e)
    }
  }, []);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
      if (audioState.isPlaying && soundRef.current) {
        try {
          // Just pause without updating state immediately to prevent UI flicker
          await soundRef.current.pauseAsync()
        } catch (error) {
          console.error("Error pausing audio on background:", error)
        }
      }
    } else if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      // App came back to foreground, update status from sound object
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync()
          if (status.isLoaded) {
            setAudioState(prev => ({
              ...prev,
              isPlaying: status.isPlaying,
              position: status.positionMillis,
              duration: status.durationMillis || prev.duration
            }))
          }
        } catch (error) {
          console.error("Error updating audio state on foreground:", error)
        }
      }
    }
    
    appState.current = nextAppState
  }, [audioState.isPlaying]);

  useEffect(() => {
    isMountedRef.current = true

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
        })
      } catch (error) {
        console.error("Error setting audio mode:", error)
      }
    }

    setupAudio()

    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      isMountedRef.current = false
      subscription.remove()
      cleanupAudio()
    }
  }, [handleAppStateChange, cleanupAudio])

  const resetAudio = useCallback(async () => {
    // Cancel any ongoing load operation
    loadCancelTokenRef.current++
    
    await cleanupAudio()
    setAudioState(initialAudioState)
  }, [cleanupAudio]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!isMountedRef.current || !status.isLoaded) return
    
    // Much simpler logic for status updates
    const now = Date.now();
    
    // Only update position every 500ms to prevent feedback loops
    const shouldUpdatePosition = now - lastPositionUpdateRef.current > 500;
    
    if (shouldUpdatePosition) {
      lastPositionUpdateRef.current = now;
    }
    
    setAudioState(prev => ({
      ...prev,
      isPlaying: status.isPlaying,
      duration: status.durationMillis || prev.duration,
      isBuffering: status.isBuffering || false,
      position: shouldUpdatePosition ? status.positionMillis : prev.position
    }));
  
    if (status.didJustFinish && !status.isLooping) {
      soundRef.current?.setPositionAsync(0).catch(() => {})
    }
  }

  const loadAudio = async (uri: string, audioId: string, autoPlay: boolean = false): Promise<boolean> => {
    // Clean up properly before loading new audio
    await cleanupAudio();
    isLoadingRef.current = true;
    
    try {
      // Reset state before loading
      setAudioState({
        ...initialAudioState,
        isBuffering: true,
        loadProgress: 0
      });
  
      console.log("Creating sound from URI:", uri);
      
      // Simplified creation with fewer options
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false, // Always load paused first for reliability
          progressUpdateIntervalMillis: 500, // Less frequent updates
        },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = sound;
      
      if (!status.isLoaded) {
        throw new Error("Sound loaded but not ready");
      }
      
      // Set state after successful load
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
        loadProgress: 1.0
      });
      
      // Start playback after successful loading if autoPlay is true
      if (autoPlay && soundRef.current) {
        // Short delay to ensure audio is ready
        setTimeout(() => {
          soundRef.current?.playAsync().catch(err => 
            console.error("Error auto-playing after load:", err)
          );
        }, 200);
      }
      
      return true;
    } catch (error) {
      console.error("Error loading audio:", error);
      
      setAudioState({
        ...initialAudioState,
        loadError: error instanceof Error ? error.message : "Unknown error"
      });
      
      return false;
    } finally {
      isLoadingRef.current = false;
    }
  }

  const playAudio = async (): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false;
    
    try {
      console.log("Playing audio");
      
      // Reset audio mode on each play for better reliability
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
      
      // Play the audio
      const result = await soundRef.current.playAsync();
      return result.isLoaded && result.isPlaying;
    } catch (error) {
      console.error("Error playing audio:", error);
      return false;
    }
  }

  const pauseAudio = async (): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false
    
    try {
      console.log("Pausing audio")
      const result = await soundRef.current.pauseAsync()
      return result.isLoaded && !result.isPlaying
    } catch (error) {
      console.error("Error pausing audio:", error)
      return false
    }
  }

  const stopAudio = async (): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false
    
    try {
      console.log("Stopping audio")
      await soundRef.current.stopAsync()
      await soundRef.current.setPositionAsync(0)
      return true
    } catch (error) {
      console.error("Error stopping audio:", error)
      return false
    }
  }

  const seekAudio = async (position: number): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false;
    
    try {
      console.log("Seeking to position:", position);
      
      // Ensure position is within bounds
      const safePosition = Math.max(0, Math.min(position, audioState.duration));
      
      // Update state immediately for responsive UI
      setAudioState(prev => ({ 
        ...prev, 
        position: safePosition,
        isBuffering: true 
      }));
      
      // Perform the actual seek
      await soundRef.current.setPositionAsync(safePosition);
      
      // Prevent position updates for a moment to avoid flicker
      lastPositionUpdateRef.current = Date.now();
      
      return true;
    } catch (error) {
      console.error("Seek operation failed", error);
      setAudioState(prev => ({ ...prev, isBuffering: false }));
      return false;
    }
  }

  const setPlaybackSpeed = async (speed: PlaybackSpeed): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false
    
    try {
      console.log("Setting playback speed:", speed)
      const result = await soundRef.current.setRateAsync(speed, true)
      
      setAudioState(prev => ({ 
        ...prev, 
        playbackSpeed: speed 
      }))
      
      return result.isLoaded
    } catch (error) {
      console.error("Error setting speed:", error)
      return false
    }
  }

  const toggleLooping = async (): Promise<boolean> => {
    if (!soundRef.current || !audioState.isLoaded) return false
    
    try {
      const newLoop = !audioState.isLooping
      console.log("Setting loop state:", newLoop)
      
      const result = await soundRef.current.setIsLoopingAsync(newLoop)
      
      setAudioState(prev => ({ 
        ...prev, 
        isLooping: newLoop 
      }))
      
      return result.isLoaded
    } catch (error) {
      console.error("Error toggling loop:", error)
      return false
    }
  }

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
            soundRef.current.stopAsync()
              .then(() => {
                if (audioState.isPlaying) {
                  return soundRef.current?.playFromPositionAsync(audioState.position);
                }
              })
              .catch(err => {
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
      }, 2000);  // Check every 2 seconds
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
        loadAudio,
        playAudio,
        pauseAudio,
        stopAudio,
        seekAudio,
        setPlaybackSpeed,
        toggleLooping,
        resetAudio
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}