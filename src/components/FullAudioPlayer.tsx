"use client";

import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import type React from "react";
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";

import { useAudio } from "../context/AudioContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { PlaybackSpeed } from "../lib/AudioService";

interface FullAudioPlayerProps {
  trackId: string;
  audioUri: string | null;
  hasNetworkConnection: boolean;
}

// Format time in mm:ss
const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const FullAudioPlayer: React.FC<FullAudioPlayerProps> = ({
  trackId,
  audioUri,
  hasNetworkConnection,
}) => {
  const [_isSliding, setIsSliding] = useState(false);
  const [speedMenuVisible, setSpeedMenuVisible] = useState(false);
  const { theme } = useThemedStyles();

  const {
    isPlaying,
    isLoaded,
    duration,
    position,
    currentTrackId,
    playbackSpeed,
    isLooping,
    error,
    togglePlayPause,
    seekTo,
    setPlaybackSpeed,
    toggleLooping,
    loadTrackOnly,
  } = useAudio();

  const isCurrentTrack = currentTrackId === trackId;
  const hasError = error !== null;
  const isAudioReady = isLoaded && isCurrentTrack;

  // Close speed menu when clicking outside
  useEffect(() => {
    if (speedMenuVisible) {
      const _closeMenu = () => setSpeedMenuVisible(false);
      // This would be implemented differently in a real app
      return () => {};
    }
  }, [speedMenuVisible]);

  // Load audio track when component mounts
  useEffect(() => {
    const loadAudio = async () => {
      if (audioUri && hasNetworkConnection && (!isCurrentTrack || !isLoaded)) {
        await loadTrackOnly(audioUri, trackId);
      }
    };

    loadAudio();
  }, [audioUri, trackId, loadTrackOnly, hasNetworkConnection, isCurrentTrack, isLoaded]);

  // Handle play/pause button press
  const handlePlayPause = async () => {
    if (!audioUri) return;
    await togglePlayPause(audioUri, trackId);
  };

  // Handle seek with slider
  const handleSeek = async (value: number) => {
    if (!isAudioReady) return;
    await seekTo(value);
  };

  // Handle speed change
  const handleSpeedChange = async (speed: PlaybackSpeed) => {
    if (!isAudioReady) return;
    await setPlaybackSpeed(speed);
    setSpeedMenuVisible(false);
  };

  // Handle loop toggle
  const handleLoopToggle = async () => {
    if (!isAudioReady) return;
    await toggleLooping();
  };

  // Handle skip forward/backward
  const handleSkip = async (seconds: number) => {
    if (!isAudioReady) return;
    const newPosition = Math.max(0, Math.min(position + seconds * 1000, duration));
    await seekTo(newPosition);
  };

  // Calculate progress percentage for the progress bar
  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  const styles = StyleSheet.create({
    activeSecondaryButton: {
      backgroundColor: theme.colors.primary,
    },
    activeSpeedText: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    audioErrorContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    audioErrorText: {
      color: theme.colors.onErrorContainer,
      fontSize: 15,
      marginBottom: 15,
      marginTop: 10,
      textAlign: "center",
    },
    controlsContainer: {
      marginTop: 10,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
    },
    loadingText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 12,
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
    pauseButtonIcon: {
      marginLeft: 0,
    },
    playButtonIcon: {
      marginLeft: 4,
    },
    playPauseButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 35,
      elevation: 5,
      height: 70,
      justifyContent: "center",
      marginHorizontal: 30,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      width: 70,
    },
    playPauseButtonDisabled: {
      opacity: 0.6,
    },
    playerContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 4,
      marginHorizontal: 2,
      padding: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    primaryControls: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginVertical: 10,
    },
    progressBarFill: {
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
      height: "100%",
      width: `${progressPercentage}%`,
    },
    progressBarOutline: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 3,
      height: 6,
      overflow: "hidden",
      position: "relative",
    },

    progressContainer: {
      marginBottom: 20,
    },
    retryButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 25,
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    retryText: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 8,
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 21,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    secondaryButtonDisabled: {
      opacity: 0.5,
    },
    secondaryControls: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 15,
      paddingHorizontal: 10,
    },

    skipButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 24,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    skipButtonDisabled: {
      opacity: 0.5,
    },
    skipButtonIcon: {
      marginLeft: 3,
    },
    skipForwardIcon: {
      marginLeft: -3,
    },
    skipIndicator: {
      alignItems: "center",
      position: "absolute",
      right: 0,
      top: 52,
      width: 48,
    },
    skipIndicatorLeft: {
      left: 0,
      right: undefined,
    },

    skipText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      opacity: 0.9,
    },
    slider: {
      height: 40,
      marginHorizontal: -10,
    },
    speedActiveOptionText: {
      color: theme.colors.primary,
      fontWeight: "bold",
    },
    speedMenuContainer: {
      position: "relative",
    },
    speedMenuDropdown: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      bottom: 50,
      elevation: 6,
      left: -20,
      paddingHorizontal: 4,
      paddingVertical: 8,
      position: "absolute",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      width: 80,
      zIndex: 100,
    },
    speedOption: {
      alignItems: "center",
      borderRadius: 8,
      flexDirection: "row",
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    speedOptionActive: {
      backgroundColor: theme.colors.primaryContainer,
    },
    speedOptionText: {
      color: theme.colors.onSurface,
      fontSize: 14,
      marginLeft: 8,
    },

    speedText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: "600",
    },
    timeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    timeText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: "500",
    },
  });

  // Show error if no audioUri is provided
  if (!audioUri) {
    return (
      <View style={styles.audioErrorContainer}>
        <Ionicons name="alert-circle" size={28} color={theme.colors.error} />
        <Text style={styles.audioErrorText}>Audio source not available</Text>
      </View>
    );
  }

  // Show error if not connected and not current track
  if (!hasNetworkConnection && !isCurrentTrack) {
    return (
      <View style={styles.audioErrorContainer}>
        <Ionicons name="cloud-offline" size={28} color={theme.colors.error} />
        <Text style={styles.audioErrorText}>
          No internet connection. Audio is not available offline.
        </Text>
      </View>
    );
  }

  // Show error if there was an error loading the audio
  if (isCurrentTrack && hasError) {
    return (
      <View style={styles.audioErrorContainer}>
        <Ionicons name="alert-circle" size={32} color={theme.colors.error} />
        <Text style={styles.audioErrorText}>Failed to load audio: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handlePlayPause}>
          <Ionicons name="refresh" size={18} color={theme.colors.onPrimary} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading state if audio is loading
  if (isCurrentTrack && !isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading audio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.playerContainer}>
      {/* Progress Bar and Time Display */}
      <View style={styles.progressContainer}>
        {isAudioReady ? (
          <Slider
            value={position}
            minimumValue={0}
            maximumValue={duration || 1}
            onSlidingStart={() => setIsSliding(true)}
            onSlidingComplete={(value) => {
              handleSeek(value);
              setIsSliding(false);
            }}
            disabled={!isAudioReady}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.surfaceVariant}
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

      {/* Primary Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.primaryControls}>
          {/* Skip Backward Button */}
          <TouchableOpacity
            onPress={() => handleSkip(-15)}
            disabled={!isAudioReady}
            activeOpacity={0.7}
          >
            <View style={[styles.skipButton, !isAudioReady && styles.skipButtonDisabled]}>
              <Ionicons
                name="play-back"
                size={22}
                color={theme.colors.onSurfaceVariant}
                style={styles.skipButtonIcon}
              />
            </View>
            <View style={[styles.skipIndicator, styles.skipIndicatorLeft]}>
              <Text style={styles.skipText}>-15s</Text>
            </View>
          </TouchableOpacity>

          {/* Play/Pause Button */}
          <TouchableOpacity onPress={handlePlayPause} disabled={!audioUri} activeOpacity={0.8}>
            <View style={[styles.playPauseButton, !audioUri && styles.playPauseButtonDisabled]}>
              <Ionicons
                name={isPlaying && isCurrentTrack ? "pause" : "play"}
                size={36}
                color={theme.colors.onPrimary}
                style={isPlaying ? styles.pauseButtonIcon : styles.playButtonIcon}
              />
            </View>
          </TouchableOpacity>

          {/* Skip Forward Button */}
          <TouchableOpacity
            onPress={() => handleSkip(15)}
            disabled={!isAudioReady}
            activeOpacity={0.7}
          >
            <View style={[styles.skipButton, !isAudioReady && styles.skipButtonDisabled]}>
              <Ionicons
                name="play-forward"
                size={22}
                color={theme.colors.onSurfaceVariant}
                style={styles.skipForwardIcon}
              />
            </View>
            <View style={styles.skipIndicator}>
              <Text style={styles.skipText}>+15s</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Secondary Controls */}
        <View style={styles.secondaryControls}>
          {/* Speed Button with Dropdown */}
          <View style={styles.speedMenuContainer}>
            <TouchableOpacity
              onPress={() => setSpeedMenuVisible(!speedMenuVisible)}
              disabled={!isAudioReady}
              activeOpacity={0.7}
            >
              <View
                style={[styles.secondaryButton, !isAudioReady && styles.secondaryButtonDisabled]}
              >
                <Text style={[styles.speedText, playbackSpeed !== 1 && styles.activeSpeedText]}>
                  {playbackSpeed}x
                </Text>
              </View>
            </TouchableOpacity>

            {speedMenuVisible && (
              <View style={styles.speedMenuDropdown}>
                {([0.5, 1, 1.5, 2] as PlaybackSpeed[]).map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.speedOption,
                      playbackSpeed === speed && styles.speedOptionActive,
                    ]}
                    onPress={() => handleSpeedChange(speed)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.speedOptionText,
                        playbackSpeed === speed && styles.speedActiveOptionText,
                      ]}
                    >
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Loop Button */}
          <TouchableOpacity onPress={handleLoopToggle} disabled={!isAudioReady} activeOpacity={0.7}>
            <View
              style={[
                styles.secondaryButton,
                isLooping && styles.activeSecondaryButton,
                !isAudioReady && styles.secondaryButtonDisabled,
              ]}
            >
              <Ionicons
                name="repeat"
                size={20}
                color={isLooping ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Show offline warning if no connection */}
      {!hasNetworkConnection && (
        <View style={styles.offlineWarning}>
          <Ionicons name="cloud-offline" size={16} color={theme.colors.onErrorContainer} />
          <Text style={styles.offlineText}>You&apos;re offline. Some features may be limited.</Text>
        </View>
      )}
    </View>
  );
};

export default FullAudioPlayer;
