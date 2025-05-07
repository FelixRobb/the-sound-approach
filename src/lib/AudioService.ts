import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

// Types
export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

export type AudioListenerCallback = (state: AudioPlayerState) => void;

export interface AudioPlayerState {
  trackId: string | null;
  playbackState: PlaybackState;
  position: number;
  duration: number;
  speed: PlaybackSpeed;
  isLooping: boolean;
  error: string | null;
}

// Initial state
const initialState: AudioPlayerState = {
  trackId: null,
  playbackState: "idle",
  position: 0,
  duration: 0,
  speed: 1,
  isLooping: false,
  error: null,
};

class AudioService {
  private static instance: AudioService;
  private sound: Audio.Sound | null = null;
  private state: AudioPlayerState = { ...initialState };
  private listeners: Map<string, AudioListenerCallback> = new Map();
  private lastPositionUpdate: number = 0;
  private updateIntervalId: NodeJS.Timeout | null = null;

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
        staysActiveInBackground: false, // No background playback
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
    } catch (error) {
      console.error("Failed to set audio mode:", error);
    }
  }

  // Load an audio track
  public async loadTrack(uri: string, trackId: string): Promise<boolean> {
    try {
      // Unload any existing audio first
      await this.unloadTrack();

      // Update state to loading
      this.updateState({
        trackId,
        playbackState: "loading",
        position: 0,
        duration: 0,
        error: null,
      });

      // Create new sound object
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 200,
        },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;

      // Update state based on loaded status
      if (status.isLoaded) {
        this.updateState({
          duration: status.durationMillis || 0,
          playbackState: "paused",
        });
        return true;
      } else {
        this.updateState({
          playbackState: "error",
          error: "Failed to load audio",
        });
        return false;
      }
    } catch (error) {
      this.updateState({
        playbackState: "error",
        error: error instanceof Error ? error.message : "Unknown error loading audio",
      });
      return false;
    }
  }

  // Play the loaded track
  public async play(): Promise<boolean> {
    if (!this.sound || this.state.playbackState === "loading") {
      return false;
    }

    try {
      // Start position updates
      this.startPositionUpdates();

      await this.sound.playAsync();
      this.updateState({ playbackState: "playing" });
      return true;
    } catch (error) {
      this.updateState({
        playbackState: "error",
        error: error instanceof Error ? error.message : "Unknown error playing audio",
      });
      return false;
    }
  }

  // Pause the current track
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
  public async unloadTrack(): Promise<boolean> {
    this.stopPositionUpdates();

    if (!this.sound) {
      return true;
    }

    try {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.updateState({ ...initialState });
      return true;
    } catch (error) {
      // Still reset the state even if unloading fails
      this.sound = null;
      this.updateState({ ...initialState });
      return false;
    }
  }

  // Seek to a specific position
  public async seekTo(position: number): Promise<boolean> {
    if (!this.sound || this.state.playbackState === "loading") {
      return false;
    }

    try {
      await this.sound.setPositionAsync(position);
      this.updateState({ position });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Set playback speed
  public async setSpeed(speed: PlaybackSpeed): Promise<boolean> {
    if (!this.sound) {
      return false;
    }

    try {
      await this.sound.setRateAsync(speed, true);
      this.updateState({ speed });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Toggle looping
  public async setLooping(isLooping: boolean): Promise<boolean> {
    if (!this.sound) {
      return false;
    }

    try {
      await this.sound.setIsLoopingAsync(isLooping);
      this.updateState({ isLooping });
      return true;
    } catch (error) {
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

  // Start regular position updates for smooth UI
  private startPositionUpdates(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    // Update position every 200ms for smooth UI updates
    this.updateIntervalId = setInterval(async () => {
      if (this.sound && this.state.playbackState === "playing") {
        try {
          const status = await this.sound.getStatusAsync();
          if (status.isLoaded) {
            this.updateState({ position: status.positionMillis });
          }
        } catch (error) {
          // Ignore errors during position updates
        }
      }
    }, 200);
  }

  // Stop position updates
  private stopPositionUpdates(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  // Handle playback status updates
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      // Handle error or unloaded state
      if (status.error) {
        this.updateState({
          playbackState: "error",
          error: `Playback error: ${status.error}`,
        });
      }
      return;
    }

    // Only update position occasionally to avoid too many state updates
    const now = Date.now();
    if (now - this.lastPositionUpdate > 500) {
      this.lastPositionUpdate = now;
      this.updateState({
        position: status.positionMillis,
        duration: status.durationMillis || this.state.duration,
      });
    }

    // Handle playback completion
    if (status.didJustFinish && !status.isLooping) {
      this.updateState({
        playbackState: "paused",
        position: 0,
      });
      this.sound?.setPositionAsync(0).catch(() => {});
    }
  };
}

export default AudioService;
