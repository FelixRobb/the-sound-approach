import type React from "react"
import { createContext, useState, useEffect, useRef } from "react"
import { Audio, type AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"
import { AppState, type AppStateStatus, Platform } from "react-native"

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
  const statusUpdateCountRef = useRef(0)
  const appState = useRef(AppState.currentState)
  const loadCancelTokenRef = useRef<number>(0)
  const isSeekingRef = useRef<boolean>(false);
  const lastSeekTimeRef = useRef<number>(0);

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
  }, [])

  const cleanupAudio = async () => {
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
  }

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
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
  }

  const resetAudio = async () => {
    // Cancel any ongoing load operation
    loadCancelTokenRef.current++
    
    await cleanupAudio()
    setAudioState(initialAudioState)
  }

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!isMountedRef.current || !status.isLoaded) return
    
    // Don't process updates during active seeking or shortly after
    if (isSeekingRef.current || (Date.now() - lastSeekTimeRef.current < 500)) return;
    
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
      
      setAudioState(prev => ({
        ...prev,
        isPlaying: status.isPlaying,
        duration: status.durationMillis || prev.duration,
        isBuffering: status.isBuffering || false,
        position: shouldUpdatePosition ? status.positionMillis : prev.position
      }));
    }
  
    if (status.didJustFinish && !status.isLooping) {
      soundRef.current?.setPositionAsync(0).catch(() => {})
    }
  }

  const loadAudio = async (uri: string, audioId: string, autoPlay: boolean = false): Promise<boolean> => {
    if (isLoadingRef.current) {
      // Don't start a new load if one is in progress
      console.log("Already loading audio, ignoring request")
      return false
    }
    
    isLoadingRef.current = true
    const currentLoadToken = ++loadCancelTokenRef.current
  
    try {
      // Reset state before loading
      setAudioState({
        ...initialAudioState,
        isBuffering: true,
        loadProgress: 0
      })
  
      await cleanupAudio()
      
      // Check if loading was cancelled
      if (currentLoadToken !== loadCancelTokenRef.current) {
        console.log("Audio loading cancelled")
        return false
      }
  
      console.log("Creating sound from URI:", uri)
      
      // Set appropriate buffering strategy based on platform
      const bufferConfig = Platform.OS === 'ios' 
        ? { iosPreferredBufferSize: 20 * 1024 }  // 20KB buffer for iOS
        : { androidMaxBufferSize: 500 * 1024 }   // 500KB buffer for Android
  
      const initialStatus = {
        shouldPlay: autoPlay,
        rate: 1.0,
        shouldCorrectPitch: true,
        volume: 1.0,
        isMuted: false,
        isLooping: false,
        progressUpdateIntervalMillis: 100,
        ...bufferConfig
      }

  
      // Create the sound with properly typed parameters
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        initialStatus,
        onPlaybackStatusUpdate,
        true // Enable download progress updates instead of passing the callback directly
      )
      
      // Set the download progress listener separately after creation
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate)
      
      // Check if loading was cancelled during creation
      if (currentLoadToken !== loadCancelTokenRef.current) {
        await sound.unloadAsync();
        console.log("Audio loading cancelled after creation")
        return false
      }
  
      soundRef.current = sound
  
      if (!status.isLoaded) {
        throw new Error("Sound loaded but not ready")
      }
  
      // Pre-buffer some audio before allowing playback
      await new Promise<void>((resolve) => {
        const bufferTimeout = setTimeout(() => {
          resolve() // Resolve anyway after timeout to prevent hanging
        }, 1500)
        
        // Wait for buffering to complete or timeout
        const bufferStatusCallback = (newStatus: AVPlaybackStatus) => {
          if (!newStatus.isLoaded) return
          
          const hasBuffered = Platform.OS === 'ios' ? 
            !newStatus.isBuffering || newStatus.positionMillis > 0 :
            true // Android buffers differently
            
          if (hasBuffered) {
            clearTimeout(bufferTimeout)
            sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate)
            resolve()
          }
        }
  
        sound.setOnPlaybackStatusUpdate(bufferStatusCallback)
        
        // Start buffering by setting position to beginning
        sound.setPositionAsync(0).catch(() => {})
      })
  
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
      })
  
      return true
    } catch (error) {
      console.error("Error loading audio:", error)
      
      // Only update state if this is still the current load operation
      if (currentLoadToken === loadCancelTokenRef.current) {
        setAudioState({
          ...initialAudioState,
          loadError: error instanceof Error ? error.message : "Unknown error"
        })
      }
      
      return false
    } finally {
      if (currentLoadToken === loadCancelTokenRef.current) {
        isLoadingRef.current = false
      }
    }
  }

  const playAudio = async (): Promise<boolean> => {
  if (!soundRef.current || !audioState.isLoaded) return false
  
  try {
    console.log("Playing audio")
    
    // Set audio active again in case it was deactivated
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    })
    
    // Mark current time to prevent position updates for a moment
    lastPositionUpdateRef.current = Date.now()
    
    const result = await soundRef.current.playAsync()
    return result.isLoaded && result.isPlaying
  } catch (error) {
    console.error("Error playing audio:", error)
    return false
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
    if (!soundRef.current || !audioState.isLoaded) return false
    
    try {
      console.log("Seeking to position:", position)
      
      // Add stronger debounce/throttle
      const seekTimeNow = Date.now()
      
      // Ignore very rapid seek requests
      if (isSeekingRef.current || seekTimeNow - lastSeekTimeRef.current < 300) {
        console.log("Ignoring rapid seek request")
        return false
      }
      
      // Set flag to prevent feedback loops
      isSeekingRef.current = true;
      lastSeekTimeRef.current = seekTimeNow;
      
      // Ensure position is within bounds
      const safePosition = Math.max(0, Math.min(position, audioState.duration));
      
      // Manually update state first to provide immediate visual feedback
      setAudioState(prev => ({ 
        ...prev, 
        position: safePosition,
        isBuffering: true 
      }));
      
      // Perform the actual seek
      const result = await soundRef.current.setPositionAsync(safePosition);
      
      // Update last position timestamp to prevent immediate position updates
      lastPositionUpdateRef.current = Date.now() + 500; // Add 500ms buffer
      
      // Clear seeking flag with a small delay to ensure any pending updates have completed
      setTimeout(() => {
        isSeekingRef.current = false;
        
        // Update final state after seek is complete and delay has passed
        if (isMountedRef.current) {
          setAudioState(prev => ({ 
            ...prev, 
            position: safePosition,
            isBuffering: false 
          }));
        }
      }, 300);
      
      return result.isLoaded;
    } catch (error) {
      console.error("Seek operation failed", error);
      isSeekingRef.current = false;
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
  }, [audioState.isBuffering]);

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