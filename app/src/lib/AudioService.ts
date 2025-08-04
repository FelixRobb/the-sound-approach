import {
  Audio,
  type AVPlaybackStatus,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";

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
  public async playTrack(uri: string, recording: Recording): Promise<boolean> {
    try {
      // If same track is already playing, just pause it
      if (this.state.recording?.id === recording.id && this.state.playbackState === "playing") {
        return this.pause();
      }

      // If same track is paused, resume from beginning
      if (this.state.recording?.id === recording.id && this.state.playbackState === "paused") {
        return this.play();
      }

      // Stop any current track
      await this.stop();

      // Update state to loading
      this.updateState({
        recording,
        uri,
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
        uri: null,
        playbackState: "idle",
        recording: null,
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
      await this.sound.playAsync();
      this.updateState({ playbackState: "playing" });
      return true;
    } catch (error) {
      this.updateState({
        uri: null,
        playbackState: "idle",
        error: error instanceof Error ? error.message : "Unknown error playing audio",
      });
      return false;
    }
  }

  // Pause the current track without unloading sound
  public async pause(): Promise<boolean> {
    if (!this.sound || this.state.playbackState !== "playing") {
      return false;
    }

    try {
      await this.sound.pauseAsync();
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
          uri: null,
          playbackState: "idle",
          error: `Playback error: ${status.error}`,
        });
      } else {
        // Still loading, keep the loading state
        this.updateState({ playbackState: "loading" });
      }
      return;
    }

    // Update position & duration continuously for UI components that require it
    const positionSeconds =
      "positionMillis" in status && typeof status.positionMillis === "number"
        ? status.positionMillis / 1000
        : 0;
    const durationSeconds =
      "durationMillis" in status && typeof status.durationMillis === "number"
        ? status.durationMillis / 1000
        : this.state.duration;

    this.updateState({ position: positionSeconds, duration: durationSeconds });

    // Check if playback finished
    if ("didJustFinish" in status && status.didJustFinish) {
      this.updateState({
        uri: null,
        playbackState: "idle",
        recording: null,
        position: 0,
      });
    }
  };

  /**
   * Seek the current track to a given position in **seconds**
   */
  public async seekTo(positionSeconds: number): Promise<boolean> {
    if (!this.sound) return false;

    try {
      await this.sound.setPositionAsync(positionSeconds * 1000);
      this.updateState({ position: positionSeconds });
      return true;
    } catch (error) {
      console.error("AudioService seek error", error);
      return false;
    }
  }

  /** Convenience: skip backward by given seconds (default 10s) */
  public async skipBackward(seconds = 10): Promise<boolean> {
    return this.seekTo(Math.max(0, this.state.position - seconds));
  }

  /** Convenience: skip forward by given seconds (default 10s) */
  public async skipForward(seconds = 10): Promise<boolean> {
    return this.seekTo(Math.min(this.state.duration, this.state.position + seconds));
  }
}

export default AudioService;
