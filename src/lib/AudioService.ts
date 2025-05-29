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
    try {
      // If same track is already playing, just pause it
      if (this.state.trackId === trackId && this.state.playbackState === "playing") {
        return this.pause();
      }

      // If same track is paused, resume from beginning
      if (this.state.trackId === trackId && this.state.playbackState === "paused") {
        return this.play();
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
          error: "Failed to load audio",
        });
        return false;
      }
    } catch (error) {
      this.updateState({
        playbackState: "idle",
        trackId: null,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  // Play the loaded track
  private async play(): Promise<boolean> {
    if (!this.sound) {
      return false;
    }

    try {
      // Reset to beginning
      await this.sound.setPositionAsync(0);
      await this.sound.playAsync();
      this.updateState({ playbackState: "playing" });
      return true;
    } catch (error) {
      this.updateState({
        playbackState: "idle",
        error: error instanceof Error ? error.message : "Unknown error playing audio",
      });
      return false;
    }
  }

  // Pause the current track
  private async pause(): Promise<boolean> {
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
      callback(this.state);
    });
  }

  // Handle playback status updates
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      if (status.error) {
        this.updateState({
          playbackState: "idle",
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
