import {
  Audio,
  type AVPlaybackStatus,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";

export type PlaybackState = "idle" | "loading" | "playing" | "paused";

export type AudioListenerCallback = (state: AudioPlayerState) => void;

export interface AudioPlayerState {
  trackId: string | null;
  playbackState: PlaybackState;
  error: string | null;
}

// Initial state
const initialState: AudioPlayerState = {
  trackId: null,
  playbackState: "idle",
  error: null,
};

class AudioService {
  private static instance: AudioService;
  private sound: Audio.Sound | null = null;
  private state: AudioPlayerState = { ...initialState };
  private listeners: Map<string, AudioListenerCallback> = new Map();
  private isProcessing: boolean = false; // Add processing lock

  // Private constructor for singleton pattern
  private constructor() {
    this.setupAudio();
  }

  // Get AudioService instance
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // Setup audio config
  private async setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
    } catch (error) {
      console.error("Failed to set audio mode:", error);
    }
  }

  // Load and play an audio track
  public async playTrack(uri: string, trackId: string): Promise<boolean> {
    // Prevent multiple simultaneous operations
    if (this.isProcessing) {
      return false;
    }

    try {
      this.isProcessing = true;

      // If same track is already playing, pause it
      if (this.state.trackId === trackId && this.state.playbackState === "playing") {
        const success = await this.pauseCurrentTrack();
        return success;
      }

      // If same track is paused, resume it (restart from beginning)
      if (this.state.trackId === trackId && this.state.playbackState === "paused") {
        const success = await this.resumeCurrentTrack();
        return success;
      }

      // Stop any current track
      await this.stop();

      // Update state to loading
      this.updateState({
        trackId,
        playbackState: "loading",
        error: null,
      });

      // Create new sound object
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;

      // Check if loaded successfully
      if (status.isLoaded) {
        // Start playing immediately
        await this.sound.playAsync();
        this.updateState({ playbackState: "playing" });
        return true;
      } else {
        this.updateState({
          playbackState: "idle",
          trackId: null,
          error: "Failed to load audio",
        });
        return false;
      }
    } catch (error) {
      console.error("Error in playTrack:", error);
      this.updateState({
        playbackState: "idle",
        trackId: null,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    } finally {
      this.isProcessing = false;
    }
  }

  // Pause the current track
  private async pauseCurrentTrack(): Promise<boolean> {
    if (!this.sound || this.state.playbackState !== "playing") {
      return false;
    }

    try {
      await this.sound.pauseAsync();
      // Reset to beginning when paused
      await this.sound.setPositionAsync(0);
      this.updateState({ playbackState: "paused" });
      return true;
    } catch (error) {
      console.error("Error pausing track:", error);
      this.updateState({
        playbackState: "idle",
        error: "Error pausing playback",
      });
      return false;
    }
  }

  // Resume the current track (restart from beginning)
  private async resumeCurrentTrack(): Promise<boolean> {
    if (!this.sound) {
      return false;
    }

    try {
      // Reset to beginning and play
      await this.sound.setPositionAsync(0);
      await this.sound.playAsync();
      this.updateState({ playbackState: "playing" });
      return true;
    } catch (error) {
      console.error("Error resuming track:", error);
      this.updateState({
        playbackState: "idle",
        error: error instanceof Error ? error.message : "Unknown error playing audio",
      });
      return false;
    }
  }

  // Stop and unload the current track
  public async stop(): Promise<boolean> {
    if (!this.sound) {
      return true;
    }

    try {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;

      // Reset state
      this.updateState({
        ...initialState,
      });

      return true;
    } catch (error) {
      console.error("Error stopping audio:", error);
      this.sound = null;
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
      try {
        callback(this.state);
      } catch (error) {
        console.error("Error notifying listener:", error);
      }
    });
  }

  // Handle playback status updates
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      if (status.error) {
        this.updateState({
          playbackState: "idle",
          trackId: null,
          error: `Playback error: ${status.error}`,
        });
      }
      return;
    }

    // Check if playback finished
    if (status.didJustFinish) {
      this.updateState({
        playbackState: "idle",
        trackId: null,
      });
    }
  };
}

export default AudioService;
