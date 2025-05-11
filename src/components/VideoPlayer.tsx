import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Video, ResizeMode } from "expo-av";
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
  ActivityIndicator,
} from "react-native";

import { useVideo } from "../context/VideoContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

// Format time in mm:ss
const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

interface VideoPlayerProps {
  videoId: string;
  videoUri: string; // Added videoUri prop
  hasNetworkConnection: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, videoUri, hasNetworkConnection }) => {
  const videoRef = useRef<Video>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    isPlaying,
    isLoaded,
    duration,
    position,
    currentVideoId,
    isFullscreen,
    error,
    togglePlayPause,
    seekTo,
    toggleFullscreen,
    exitFullscreen,
    setVideoRef,
  } = useVideo();

  const { theme } = useThemedStyles();

  // Set video ref when component mounts
  useEffect(() => {
    if (videoRef.current) {
      setVideoRef(videoRef);
    }
  }, [setVideoRef]);

  // Auto-hide controls after a delay
  useEffect(() => {
    if (isPlaying && controlsVisible) {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      const timeout = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
      setControlsTimeout(timeout);
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [isPlaying, controlsVisible, controlsTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isFullscreen) {
        exitFullscreen().catch(console.error);
      }
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout, exitFullscreen, isFullscreen]);

  const isCurrentVideo = currentVideoId === videoId;
  const isCurrentlyPlaying = isPlaying && isCurrentVideo;
  const hasAnyError = error !== null || localError !== null;
  const errorMessage = error || localError;
  const isVideoReady = isLoaded && isCurrentVideo;

  // Handle play/pause
  const handlePlayPause = async () => {
    setLocalError(null); // Reset local error state when attempting to play
    try {
      if (!videoUri) {
        setLocalError("No video source provided");
        return;
      }
      await togglePlayPause(videoUri, videoId);
      setControlsVisible(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to play video");
    }
  };

  // Handle seek
  const handleSeek = async (value: number) => {
    if (!isVideoReady) return;
    await seekTo(value);
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = async () => {
    await toggleFullscreen();
    setControlsVisible(true);
  };

  // Show/hide controls
  const handleVideoPress = () => {
    setControlsVisible(!controlsVisible);
  };

  // Handle skip forward/backward
  const handleSkip = async (seconds: number) => {
    if (!isVideoReady) return;
    const newPosition = Math.max(0, Math.min(position + seconds * 1000, duration));
    await seekTo(newPosition);
    setControlsVisible(true);
  };

  // Calculate progress percentage for the progress bar
  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  // Calculate dimensions based on fullscreen state
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  // For fullscreen, swap width/height because we're in landscape
  const videoWidth = isFullscreen ? screenHeight : screenWidth - 40; // Account for padding
  const videoHeight = isFullscreen ? screenWidth : Math.min((videoWidth * 456) / 2436, 200); // Maintain aspect ratio of 2436 × 456, max height 200

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: isFullscreen ? 0 : 16,
      elevation: isFullscreen ? 0 : 4,
      overflow: "hidden",
      position: "relative",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      width: isFullscreen ? "100%" : "100%",
    },
    controlsContainer: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      bottom: 0,
      justifyContent: "center",
      left: 0,
      opacity: controlsVisible ? 1 : 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    errorContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 12,
      justifyContent: "center",
      padding: 20,
      width: "100%",
    },
    errorText: {
      color: theme.colors.onErrorContainer,
      fontSize: 15,
      marginTop: 10,
      textAlign: "center",
    },
    fullscreenButton: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      position: "absolute",
      right: 10,
      top: 10,
      width: 40,
      zIndex: 10,
    },
    fullscreenContainer: {
      backgroundColor: theme.colors.surface,
      height: "100%",
      position: "absolute",
      width: "100%",
      zIndex: 1000,
    },
    loadingContainer: {
      alignItems: "center",
      height: videoHeight,
      justifyContent: "center",
      width: videoWidth,
    },
    offlineText: {
      color: theme.colors.onErrorContainer,
      fontSize: 13,
      marginLeft: 8,
    },
    offlineWarning: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 8,
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    playButton: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderRadius: 30,
      height: 60,
      justifyContent: "center",
      width: 60,
    },
    playIcon: {
      marginLeft: 4,
    },
    progressBarContainer: {
      bottom: 10,
      left: 0,
      position: "absolute",
      right: 0,
      width: "100%",
    },
    progressBarFill: {
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
      height: "100%",
      position: "absolute",
      width: `${progressPercentage}%`,
    },
    progressBarOutline: {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: 3,
      height: 6,
      marginHorizontal: 20,
      overflow: "hidden",
      position: "relative",
    },
    retryButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 25,
      flexDirection: "row",
      marginTop: 15,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    retryText: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 8,
    },
    skipButton: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderRadius: 25,
      height: 50,
      justifyContent: "center",
      width: 50,
    },
    slider: {
      height: 40,
      marginHorizontal: 10,
      width: isFullscreen ? screenHeight - 80 : screenWidth - 80,
    },
    timeContainer: {
      bottom: 40,
      flexDirection: "row",
      justifyContent: "space-between",
      left: 20,
      position: "absolute",
      right: 20,
    },
    timeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "500",
    },
    video: {
      borderRadius: isFullscreen ? 0 : 8,
      height: videoHeight,
      width: videoWidth,
    },
  });

  // Show error if no videoUri is provided
  if (!videoUri) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={28} color={theme.colors.error} />
        <Text style={styles.errorText}>Video source not available</Text>
      </View>
    );
  }

  // Show error if not connected and not current video
  if (!hasNetworkConnection && !videoUri.startsWith("file://") && !isCurrentVideo) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline" size={28} color={theme.colors.error} />
        <Text style={styles.errorText}>
          No internet connection. Video is not available offline.
        </Text>
      </View>
    );
  }

  // Show error if there was an error loading the video
  if (isCurrentVideo && hasAnyError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color={theme.colors.error} />
        <Text style={styles.errorText}>Failed to load video: {errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => handlePlayPause()}>
          <Ionicons name="refresh" size={18} color={theme.colors.onPrimary} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading state
  if (isCurrentVideo && !isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}>
          Loading video...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <TouchableOpacity activeOpacity={1} onPress={handleVideoPress}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode={isFullscreen ? ResizeMode.CONTAIN : ResizeMode.COVER}
          useNativeControls={false}
        />
      </TouchableOpacity>

      {/* Controls overlay */}
      {controlsVisible && (
        <View style={styles.controlsContainer}>
          {/* Play/Pause button */}
          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
            <Ionicons
              name={isCurrentlyPlaying ? "pause" : "play"}
              size={30}
              color="#fff"
              style={!isCurrentlyPlaying ? styles.playIcon : undefined}
            />
          </TouchableOpacity>

          {/* Skip backward button */}
          <TouchableOpacity
            style={[styles.skipButton, { position: "absolute", left: "25%" }]}
            onPress={() => handleSkip(-10)}
          >
            <Ionicons name="play-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Skip forward button */}
          <TouchableOpacity
            style={[styles.skipButton, { position: "absolute", right: "25%" }]}
            onPress={() => handleSkip(10)}
          >
            <Ionicons name="play-forward" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Progress bar and time */}
          <View style={styles.progressBarContainer}>
            {isVideoReady ? (
              <Slider
                value={position}
                minimumValue={0}
                maximumValue={duration || 1}
                onSlidingComplete={(value) => {
                  handleSeek(value);
                }}
                disabled={!isVideoReady}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor={theme.colors.primary}
                style={styles.slider}
              />
            ) : (
              <View style={styles.progressBarOutline}>
                <View style={styles.progressBarFill} />
              </View>
            )}

            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Fullscreen button */}
          <TouchableOpacity
            style={[styles.fullscreenButton, { top: 10, right: 10 }]}
            onPress={handleFullscreenToggle}
          >
            <Ionicons name={isFullscreen ? "contract" : "expand"} size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Always visible fullscreen button when controls are hidden */}
      {!controlsVisible && (
        <TouchableOpacity style={styles.fullscreenButton} onPress={handleFullscreenToggle}>
          <Ionicons name={isFullscreen ? "contract" : "expand"} size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Show offline warning if no connection */}
      {!hasNetworkConnection && !isFullscreen && (
        <View style={styles.offlineWarning}>
          <Ionicons name="cloud-offline" size={16} color={theme.colors.onErrorContainer} />
          <Text style={styles.offlineText}>You&apos;re offline. Some features may be limited.</Text>
        </View>
      )}
    </View>
  );
};

export default VideoPlayer;
