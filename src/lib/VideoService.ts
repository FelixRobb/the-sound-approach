import { Video as ExpoVideo, AVPlaybackStatus, InterruptionModeIOS, Audio } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";

// Types
export type VideoPlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

export type VideoListenerCallback = (state: VideoPlayerState) => void;

export interface VideoPlayerState {
  videoId: string | null;
  playbackState: VideoPlaybackState;
  position: number;
  duration: number;
  isFullscreen: boolean;
  error: string | null;
}

// Initial state
const initialState: VideoPlayerState = {
  videoId: null,
  playbackState: "idle",
  position: 0,
  duration: 0,
  isFullscreen: false,
  error: null,
};

class VideoService {
  private static instance: VideoService;
  private video: ExpoVideo | null = null;
  private videoRef: React.RefObject<ExpoVideo> | null = null;
  private state: VideoPlayerState = { ...initialState };
  private listeners: Map<string, VideoListenerCallback> = new Map();
  private lastPositionUpdate = 0;
  private updateIntervalId: NodeJS.Timeout | null = null;

  // Private constructor for singleton pattern
  private constructor() {
    this.setupVideo();
  }

  // Get VideoService instance
  public static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }

  // Setup video config
  private async setupVideo() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      });
    } catch (error) {
      console.error("Failed to set video mode:", error);
    }
  }

  // Set video ref
  public setVideoRef(ref: React.RefObject<ExpoVideo>) {
    this.videoRef = ref;
    if (ref.current) {
      this.video = ref.current;
    }
  }

  // Load a video
  public async loadVideo(uri: string, videoId: string): Promise<boolean> {
    try {
      // Unload any existing video first
      await this.unloadVideo();

      // Update state to loading
      this.updateState({
        videoId,
        playbackState: "loading",
        position: 0,
        duration: 0,
        error: null,
      });

      if (!this.videoRef?.current) {
        this.updateState({
          playbackState: "error",
          error: "Video reference not set",
        });
        return false;
      }

      this.video = this.videoRef.current;

      // Load the video
      await this.video.loadAsync(
        { uri },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 200,
        },
        false
      );

      // Set up status update listener
      this.video.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);

      // Get initial status
      const status = await this.video.getStatusAsync();

      if (status.isLoaded) {
        this.updateState({
          duration: status.durationMillis || 0,
          playbackState: "paused",
        });
        return true;
      } else {
        this.updateState({
          playbackState: "error",
          error: "Failed to load video",
        });
        return false;
      }
    } catch (error) {
      this.updateState({
        playbackState: "error",
        error: error instanceof Error ? error.message : "Unknown error loading video",
      });
      return false;
    }
  }

  // Play the loaded video
  public async play(): Promise<boolean> {
    if (!this.video || this.state.playbackState === "loading") {
      return false;
    }

    try {
      // Start position updates
      this.startPositionUpdates();

      await this.video.playAsync();
      this.updateState({ playbackState: "playing" });
      return true;
    } catch (error) {
      this.updateState({
        playbackState: "error",
        error: error instanceof Error ? error.message : "Unknown error playing video",
      });
      return false;
    }
  }

  // Pause the current video
  public async pause(): Promise<boolean> {
    if (!this.video || this.state.playbackState !== "playing") {
      return false;
    }

    try {
      await this.video.pauseAsync();
      this.updateState({ playbackState: "paused" });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Stop and unload the current video
  public async unloadVideo(): Promise<boolean> {
    this.stopPositionUpdates();

    if (!this.video) {
      return true;
    }

    try {
      await this.video.stopAsync();
      await this.video.unloadAsync();

      // Reset state
      this.updateState({
        ...initialState,
      });

      return true;
    } catch (error) {
      // Still reset the state even if unloading fails
      this.updateState({
        ...initialState,
      });
      return false;
    }
  }

  // Seek to a specific position
  public async seekTo(position: number): Promise<boolean> {
    if (!this.video || this.state.playbackState === "loading") {
      return false;
    }

    try {
      await this.video.setPositionAsync(position);
      this.updateState({ position });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Toggle fullscreen mode
  public async toggleFullscreen(): Promise<boolean> {
    try {
      if (this.state.isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        this.updateState({ isFullscreen: false });
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        this.updateState({ isFullscreen: true });
      }
      return true;
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
      return false;
    }
  }

  // Exit fullscreen
  public async exitFullscreen(): Promise<boolean> {
    if (!this.state.isFullscreen) return true;

    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      this.updateState({ isFullscreen: false });
      return true;
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
      return false;
    }
  }

  // Get current state
  public getState(): VideoPlayerState {
    return { ...this.state };
  }

  // Add listener
  public addListener(id: string, callback: VideoListenerCallback): void {
    this.listeners.set(id, callback);
    // Immediately call with current state
    callback(this.state);
  }

  // Remove listener
  public removeListener(id: string): void {
    this.listeners.delete(id);
  }

  // Update state and notify listeners
  private updateState(partialState: Partial<VideoPlayerState>): void {
    this.state = {
      ...this.state,
      ...partialState,
    };

    // Notify all listeners
    this.listeners.forEach((callback) => callback(this.state));
  }

  // Start position updates
  private startPositionUpdates(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    this.updateIntervalId = setInterval(async () => {
      if (this.video && this.state.playbackState === "playing") {
        try {
          const status = await this.video.getStatusAsync();
          if (status.isLoaded) {
            // Only update if position has changed significantly
            if (Math.abs(status.positionMillis - this.lastPositionUpdate) > 200) {
              this.updateState({ position: status.positionMillis });
              this.lastPositionUpdate = status.positionMillis;
            }
          }
        } catch (error) {
          console.error("Error getting video position:", error);
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

  // Playback status update handler
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      // Video has been unloaded or encountered an error
      if (status.error) {
        this.updateState({
          playbackState: "error",
          error: status.error,
        });
      }
      return;
    }

    // Update position and duration
    this.updateState({
      position: status.positionMillis,
      duration: status.durationMillis || 0,
    });

    // Update playback state
    if (status.isPlaying) {
      this.updateState({ playbackState: "playing" });
    } else if (this.state.playbackState !== "loading") {
      this.updateState({ playbackState: "paused" });
    }

    // Handle playback completion
    if (status.didJustFinish && !status.isLooping) {
      this.updateState({ playbackState: "paused" });
      this.seekTo(0).catch(console.error);
    }
  };
}

export default VideoService;
