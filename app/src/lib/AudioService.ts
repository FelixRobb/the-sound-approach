import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioSource,
  type AudioStatus,
  type InterruptionMode,
} from "expo-audio";

import { Recording } from "../types";

export type PlaybackState = "idle" | "loading" | "playing" | "paused";

export type AudioListenerCallback = (state: AudioPlayerState) => void;

export interface AudioPlayerState {
  uri: string | null;
  playbackState: PlaybackState;
  error: string | null;
  /** current playback position in seconds */
  position: number;
  /** total duration of the loaded track in seconds */
  duration: number;
  /** the recording that is currently playing */
  recording: Recording | null;
}

// Initial state
const initialState: AudioPlayerState = {
  uri: null,
  playbackState: "idle",
  error: null,
  position: 0,
  duration: 0,
  recording: null,
};

class AudioService {
  private static instance: AudioService;
  private player: AudioPlayer | null = null;
  private state: AudioPlayerState = { ...initialState };
  private listeners: Map<string, AudioListenerCallback> = new Map();
  private isDestroyed = false;
  private statusUpdateListener: ((status: AudioStatus) => void) | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private statusUpdateInterval: NodeJS.Timeout | null = null;

  // Private constructor for singleton pattern
  private constructor() {
    this.setupAudio().catch((error) => {
      console.error("Failed to initialize AudioService:", error);
    });
  }

  // Get AudioService instance
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // Setup audio config with comprehensive error handling
  private async setupAudio(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error("AudioService has been destroyed");
    }

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: "doNotMix" as InterruptionMode,
        allowsRecording: false,
        shouldRouteThroughEarpiece: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown audio setup error";
      console.error("Failed to set audio mode:", errorMessage);
      this.updateState({
        error: `Audio setup failed: ${errorMessage}`,
      });
      throw error;
    }
  }

  // Cleanup method to prevent memory leaks
  private async cleanup(): Promise<void> {
    try {
      if (this.cleanupTimer) {
        clearTimeout(this.cleanupTimer);
        this.cleanupTimer = null;
      }

      if (this.statusUpdateInterval) {
        clearInterval(this.statusUpdateInterval);
        this.statusUpdateInterval = null;
      }

      if (this.statusUpdateListener && this.player) {
        this.player.removeListener("playbackStatusUpdate", this.statusUpdateListener);
        this.statusUpdateListener = null;
      }

      if (this.player) {
        this.player.remove();
        this.player = null;
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  // Destroy the service instance (for testing or complete cleanup)
  public async destroy(): Promise<void> {
    this.isDestroyed = true;
    await this.cleanup();
    this.listeners.clear();
    this.state = { ...initialState };
  }

  // Load and play an audio track with comprehensive error handling
  public async playTrack(uri: string, recording: Recording): Promise<boolean> {
    if (this.isDestroyed) {
      console.error("Cannot play track: AudioService has been destroyed");
      return false;
    }
    if (!uri || !recording) {
      console.error("Invalid parameters provided to playTrack:", { uri, recording });
      this.updateState({
        error: "Invalid audio URI or recording data",
        playbackState: "idle",
      });
      return false;
    }

    try {
      // If same track is already playing, just pause it
      if (this.state.recording?.id === recording.id && this.state.playbackState === "playing") {
        return this.pause();
      }

      // If same track is paused, resume it
      if (this.state.recording?.id === recording.id && this.state.playbackState === "paused") {
        return this.play();
      }

      // Stop any current track and clean up
      await this.stop();

      // Update state to loading
      this.updateState({
        recording,
        uri,
        playbackState: "loading",
        error: null,
        position: 0,
        duration: 0,
      });

      // Create new audio player with expo-audio
      const audioSource: AudioSource = { uri };
      this.player = createAudioPlayer(audioSource, 100); // 100ms update interval

      // Set up status update listener
      this.statusUpdateListener = (status: AudioStatus) => {
        this.handlePlaybackStatusUpdate(status);
      };

      this.player.addListener("playbackStatusUpdate", this.statusUpdateListener);

      // Start playing immediately
      this.player.play();

      this.updateState({
        playbackState: "playing",
        error: null,
      });

      // Set up cleanup timer as a safety measure
      this.cleanupTimer = setTimeout(() => {
        if (this.state.playbackState === "loading") {
          console.warn("Audio loading timeout, stopping playback");
          this.stop().catch(console.error);
        }
      }, 30000); // 30 second timeout

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown playback error";
      console.error("Error in playTrack:", errorMessage, error);

      // Clean up on error
      await this.cleanup();

      this.updateState({
        uri: null,
        playbackState: "idle",
        recording: null,
        error: `Playback failed: ${errorMessage}`,
        position: 0,
        duration: 0,
      });
      return false;
    }
  }

  // Play the loaded track
  private async play(): Promise<boolean> {
    if (this.isDestroyed) {
      console.error("Cannot play: AudioService has been destroyed");
      return false;
    }

    if (!this.player) {
      console.error("No player loaded to play");
      return false;
    }

    try {
      this.player.play();
      this.updateState({
        playbackState: "playing",
        error: null,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error playing audio";
      console.error("Error playing audio:", errorMessage);

      this.updateState({
        playbackState: "idle",
        error: `Play failed: ${errorMessage}`,
      });
      return false;
    }
  }

  // Pause the current track without unloading player
  public async pause(): Promise<boolean> {
    if (this.isDestroyed) {
      console.error("Cannot pause: AudioService has been destroyed");
      return false;
    }

    if (!this.player) {
      console.warn("No player loaded to pause");
      return false;
    }

    if (this.state.playbackState !== "playing") {
      console.warn("Audio is not currently playing");
      return false;
    }

    try {
      this.player.pause();
      this.updateState({
        playbackState: "paused",
        error: null,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error pausing audio";
      console.error("Error pausing audio:", errorMessage);

      this.updateState({
        error: `Pause failed: ${errorMessage}`,
      });
      return false;
    }
  }

  // Stop and unload the current track
  public async stop(): Promise<boolean> {
    if (this.isDestroyed) {
      console.warn("AudioService already destroyed");
      return true;
    }

    try {
      // Clear cleanup timer
      if (this.cleanupTimer) {
        clearTimeout(this.cleanupTimer);
        this.cleanupTimer = null;
      }

      // Clear status update interval
      if (this.statusUpdateInterval) {
        clearInterval(this.statusUpdateInterval);
        this.statusUpdateInterval = null;
      }

      // Stop and remove player if it exists
      if (this.player) {
        try {
          this.player.pause(); // Stop playback
        } catch (stopError) {
          console.warn("Error stopping player:", stopError);
        }

        // Remove listener before removing player
        if (this.statusUpdateListener) {
          this.player.removeListener("playbackStatusUpdate", this.statusUpdateListener);
          this.statusUpdateListener = null;
        }

        try {
          this.player.remove();
        } catch (removeError) {
          console.warn("Error removing player:", removeError);
        }

        this.player = null;
      }

      // Reset state
      this.updateState({
        ...initialState,
      });

      return true;
    } catch (error) {
      console.error("Error in stop method:", error);

      // Force cleanup even if there were errors
      this.player = null;
      this.statusUpdateListener = null;
      if (this.cleanupTimer) {
        clearTimeout(this.cleanupTimer);
        this.cleanupTimer = null;
      }
      if (this.statusUpdateInterval) {
        clearInterval(this.statusUpdateInterval);
        this.statusUpdateInterval = null;
      }

      this.updateState({
        ...initialState,
      });
      return false;
    }
  }

  // Get current state
  public getState(): AudioPlayerState {
    return { ...this.state };
  }

  // Add listener for state changes
  public addListener(id: string, callback: AudioListenerCallback): void {
    this.listeners.set(id, callback);
    // Immediately send current state to new listener
    callback(this.state);
  }

  // Remove listener
  public removeListener(id: string): void {
    this.listeners.delete(id);
  }

  // Update state and notify listeners
  private updateState(partialState: Partial<AudioPlayerState>): void {
    this.state = { ...this.state, ...partialState };

    // Notify all listeners
    this.listeners.forEach((callback) => {
      callback(this.state);
    });
  }

  // Handle playback status updates for expo-audio
  private handlePlaybackStatusUpdate(status: AudioStatus): void {
    if (this.isDestroyed || !this.player) {
      return;
    }

    try {
      if (!status.isLoaded) {
        // Audio is not loaded, might be loading or error state
        if (this.state.playbackState !== "loading") {
          this.updateState({
            playbackState: "loading",
            error: null,
          });
        }
        return;
      }

      // Update position & duration continuously for UI components that require it
      const positionSeconds = status.currentTime || 0;
      const durationSeconds = status.duration || this.state.duration;

      // Determine playback state based on status
      let newPlaybackState: PlaybackState = this.state.playbackState;

      if (status.didJustFinish) {
        newPlaybackState = "idle";
        // Auto-cleanup when finished
        setTimeout(() => {
          this.stop().catch((error) => {
            console.error("Error auto-stopping after finish:", error);
          });
        }, 100);
      } else if (status.playing) {
        newPlaybackState = "playing";
      } else if (status.currentTime > 0) {
        newPlaybackState = "paused";
      }

      this.updateState({
        position: positionSeconds,
        duration: durationSeconds,
        playbackState: newPlaybackState,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown status update error";
      console.error("Error handling playback status:", errorMessage);

      // Don't update state on status errors unless it's critical
      if (this.state.playbackState !== "idle") {
        this.updateState({
          error: `Status update failed: ${errorMessage}`,
        });
      }
    }
  }

  /**
   * Seek the current track to a given position in **seconds**
   */
  public async seekTo(positionSeconds: number): Promise<boolean> {
    if (this.isDestroyed) {
      console.error("Cannot seek: AudioService has been destroyed");
      return false;
    }

    if (!this.player) {
      console.error("No player loaded to seek");
      return false;
    }

    if (typeof positionSeconds !== "number" || positionSeconds < 0) {
      console.error("Invalid seek position:", positionSeconds);
      return false;
    }

    try {
      // Clamp position to valid range
      const clampedPosition = Math.max(0, Math.min(this.state.duration, positionSeconds));

      await this.player.seekTo(clampedPosition);
      this.updateState({
        position: clampedPosition,
        error: null,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown seek error";
      console.error("AudioService seek error:", errorMessage);

      this.updateState({
        error: `Seek failed: ${errorMessage}`,
      });
      return false;
    }
  }

  /** Convenience: skip backward by given seconds (default 10s) */
  public async skipBackward(seconds = 10): Promise<boolean> {
    if (typeof seconds !== "number" || seconds <= 0) {
      console.error("Invalid skip backward seconds:", seconds);
      return false;
    }

    const newPosition = Math.max(0, this.state.position - seconds);
    return this.seekTo(newPosition);
  }

  /** Convenience: skip forward by given seconds (default 10s) */
  public async skipForward(seconds = 10): Promise<boolean> {
    if (typeof seconds !== "number" || seconds <= 0) {
      console.error("Invalid skip forward seconds:", seconds);
      return false;
    }

    const newPosition = Math.min(this.state.duration, this.state.position + seconds);
    return this.seekTo(newPosition);
  }
}

export default AudioService;
