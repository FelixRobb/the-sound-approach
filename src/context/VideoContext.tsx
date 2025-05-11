"use client";

import { Video } from "expo-av";
import type React from "react";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import VideoService, { type VideoPlayerState } from "../lib/VideoService";

import { NetworkContext } from "./NetworkContext";

// Context type definition
type VideoContextType = {
  // Current video state
  isPlaying: boolean;
  isLoaded: boolean;
  duration: number;
  position: number;
  currentVideoId: string | null;
  isFullscreen: boolean;
  error: string | null;

  // Actions
  playVideo: (uri: string, videoId: string) => Promise<boolean>;
  togglePlayPause: (uri: string, videoId: string) => Promise<boolean>;
  stopPlayback: () => Promise<boolean>;
  seekTo: (position: number) => Promise<boolean>;
  toggleFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<boolean>;
  setVideoRef: (ref: React.RefObject<Video>) => void;
};

// Create the context with default values
const VideoContext = createContext<VideoContextType>({
  isPlaying: false,
  isLoaded: false,
  duration: 0,
  position: 0,
  currentVideoId: null,
  isFullscreen: false,
  error: null,

  playVideo: async () => false,
  togglePlayPause: async () => false,
  stopPlayback: async () => false,
  seekTo: async () => false,
  toggleFullscreen: async () => false,
  exitFullscreen: async () => false,
  setVideoRef: () => {},
});

// Provider component
export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get video service instance
  const videoService = VideoService.getInstance();

  // Get network status
  const { isConnected } = useContext(NetworkContext);

  // Create a unique ID for this component instance
  const listenerId = useRef(uuidv4()).current;

  // Track the video state
  const [videoState, setVideoState] = useState<VideoPlayerState>({
    videoId: null,
    playbackState: "idle",
    position: 0,
    duration: 0,
    isFullscreen: false,
    error: null,
  });

  // Keep track of the current video URI
  const currentVideoUri = useRef<string | null>(null);

  // Set up listener for video state changes
  useEffect(() => {
    videoService.addListener(listenerId, setVideoState);

    return () => {
      videoService.removeListener(listenerId);
      // Ensure we unload video when provider is unmounted
      videoService.unloadVideo().catch(console.error);
    };
  }, [listenerId, videoService]);

  // Stop playback when going offline if the current video is not downloaded
  useEffect(() => {
    if (!isConnected && videoState.playbackState === "playing") {
      // Only pause playback if the current video is not a local file
      const videoUri = currentVideoUri.current;
      if (!videoUri || !videoUri.startsWith("file://")) {
        videoService.pause().catch(console.error);
      }
    }
  }, [isConnected, videoState.playbackState, videoService]);

  // Set video ref
  const setVideoRef = useCallback(
    (ref: React.RefObject<Video>) => {
      if (ref && ref.current) {
        videoService.setVideoRef(ref);
      }
    },
    [videoService]
  );

  // Play a video
  const playVideo = useCallback(
    async (uri: string, videoId: string): Promise<boolean> => {
      try {
        if (!uri || uri === "") {
          console.error("Invalid video URI provided");
          return false;
        }

        // If offline and not a downloaded file (file:// URI), don't play
        if (!isConnected && !uri.startsWith("file://")) {
          console.warn("Cannot play online video when offline");
          return false;
        }

        // Store the current URI for later reference
        currentVideoUri.current = uri;

        // If it's already the current video and loaded, just play it
        if (
          videoState.videoId === videoId &&
          videoState.playbackState !== "idle" &&
          videoState.playbackState !== "error"
        ) {
          return videoService.play();
        }

        // Otherwise load and play the video
        console.log(`Loading video: ${videoId} from ${uri}`);
        const loadSuccess = await videoService.loadVideo(uri, videoId);
        if (loadSuccess) {
          return videoService.play();
        }
        return false;
      } catch (error) {
        console.error("Error playing video:", error);
        return false;
      }
    },
    [videoService, videoState.videoId, videoState.playbackState, isConnected]
  );

  // Toggle play/pause for a video
  const togglePlayPause = useCallback(
    async (uri: string, videoId: string): Promise<boolean> => {
      try {
        if (!uri || uri === "") {
          console.error("Invalid video URI provided");
          return false;
        }

        // If offline and not a downloaded file (file:// URI), don't play
        if (!isConnected && !uri.startsWith("file://")) {
          console.warn("Cannot play online video when offline");
          return false;
        }

        // Store the current URI for later reference
        currentVideoUri.current = uri;

        // If it's the current video, toggle play/pause
        if (videoState.videoId === videoId) {
          if (videoState.playbackState === "playing") {
            return videoService.pause();
          } else if (videoState.playbackState === "paused") {
            return videoService.play();
          } else if (videoState.playbackState === "error") {
            // If there was an error, try loading again
            console.log(`Retrying video: ${videoId} from ${uri} after error`);
            const loadSuccess = await videoService.loadVideo(uri, videoId);
            if (loadSuccess) {
              return videoService.play();
            }
            return false;
          }
        }

        // If it's a different video or not loaded, load and play it
        return playVideo(uri, videoId);
      } catch (error) {
        console.error("Error toggling playback:", error);
        return false;
      }
    },
    [videoService, videoState.videoId, videoState.playbackState, playVideo, isConnected]
  );

  // Stop playback
  const stopPlayback = useCallback(async (): Promise<boolean> => {
    currentVideoUri.current = null;
    return videoService.unloadVideo();
  }, [videoService]);

  // Seek to position
  const seekTo = useCallback(
    async (position: number): Promise<boolean> => {
      return videoService.seekTo(position);
    },
    [videoService]
  );

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async (): Promise<boolean> => {
    return videoService.toggleFullscreen();
  }, [videoService]);

  // Exit fullscreen
  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    return videoService.exitFullscreen();
  }, [videoService]);

  // Context value
  const contextValue: VideoContextType = {
    isPlaying: videoState.playbackState === "playing",
    isLoaded: videoState.playbackState === "playing" || videoState.playbackState === "paused",
    duration: videoState.duration,
    position: videoState.position,
    currentVideoId: videoState.videoId,
    isFullscreen: videoState.isFullscreen,
    error: videoState.error,

    playVideo,
    togglePlayPause,
    stopPlayback,
    seekTo,
    toggleFullscreen,
    exitFullscreen,
    setVideoRef,
  };

  return <VideoContext.Provider value={contextValue}>{children}</VideoContext.Provider>;
};

export const useVideo = () => useContext(VideoContext);
