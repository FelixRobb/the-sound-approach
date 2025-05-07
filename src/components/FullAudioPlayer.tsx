"use client";

import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import type React from "react";
import { useState } from "react";
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
  const [isSliding, setIsSliding] = useState(false);
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
  } = useAudio();

  const isCurrentTrack = currentTrackId === trackId;
  const hasError = error !== null;
  const isAudioReady = isLoaded && isCurrentTrack;

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
  };

  // Handle loop toggle
  const handleLoopToggle = async () => {
    if (!isAudioReady) return;
    await toggleLooping();
  };

  const styles = StyleSheet.create({
    activeControlButton: {
      backgroundColor: theme.colors.primary,
    },
    activeControlText: {
      color: theme.colors.onPrimary,
    },
    activeSpeedOption: {
      backgroundColor: theme.colors.primary,
    },
    activeSpeedOptionText: {
      color: theme.colors.onPrimary,
    },
    audioErrorContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      padding: 16,
    },
    audioErrorText: {
      color: theme.colors.error,
      fontSize: 16,
      marginLeft: 8,
    },
    controlButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 30,
      justifyContent: "center",
    },
    disabledControlButton: {
      backgroundColor: theme.colors.surfaceDisabled,
    },
    loadingAudioContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: 24,
    },
    loadingAudioText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginLeft: 8,
    },
    loopButton: {
      marginLeft: 24,
    },
    mainButton: {
      backgroundColor: theme.colors.primary,
      height: 72,
      width: 72,
    },
    offlineText: {
      color: theme.colors.error,
      fontSize: 14,
      marginLeft: 6,
    },
    offlineWarning: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 8,
    },
    playerContainer: {
      borderRadius: 8,
    },
    primaryControls: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 20,
    },
    retryButton: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    retryText: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      marginLeft: 8,
    },
    slider: {
      height: 40,
      marginBottom: 2,
    },
    smallButton: {
      backgroundColor: theme.colors.surfaceVariant,
      height: 44,
      width: 44,
    },
    speedButton: {
      marginRight: 24,
    },
    speedControlContainer: {
      marginBottom: 8,
    },
    speedLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginBottom: 8,
    },
    speedOption: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 20,
      flex: 1,
      marginHorizontal: 4,
      paddingVertical: 8,
    },
    speedOptionText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontWeight: "500",
    },
    speedOptions: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    speedText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontWeight: "bold",
    },
    timeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      paddingHorizontal: 2,
    },
    timeText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
  });

  // Show error if no audioUri is provided
  if (!audioUri) {
    return (
      <View style={styles.audioErrorContainer}>
        <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
        <Text style={styles.audioErrorText}>Audio source not available</Text>
      </View>
    );
  }

  // Show error if not connected and not current track
  if (!hasNetworkConnection && !isCurrentTrack) {
    return (
      <View style={styles.audioErrorContainer}>
        <Ionicons name="cloud-offline" size={24} color={theme.colors.error} />
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
        <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
        <Text style={styles.audioErrorText}>Failed to load audio: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handlePlayPause}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading state if audio is loading
  if (isCurrentTrack && !isLoaded) {
    return (
      <View style={styles.loadingAudioContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingAudioText}>Loading audio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.playerContainer}>
      {/* Playback Progress */}
      <Slider
        value={isSliding ? position : position}
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

      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Primary Controls */}
      <View style={styles.primaryControls}>
        <TouchableOpacity
          style={styles.speedButton}
          onPress={() => handleSpeedChange(playbackSpeed === 1 ? 1.5 : 1)}
          disabled={!isAudioReady}
        >
          <View
            style={[
              styles.controlButton,
              styles.smallButton,
              playbackSpeed !== 1 && styles.activeControlButton,
              !isAudioReady && styles.disabledControlButton,
            ]}
          >
            <Text style={[styles.speedText, playbackSpeed !== 1 && styles.activeControlText]}>
              {playbackSpeed}x
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePlayPause} disabled={!audioUri}>
          <View
            style={[
              styles.controlButton,
              styles.mainButton,
              !audioUri && styles.disabledControlButton,
            ]}
          >
            <Ionicons
              name={isPlaying && isCurrentTrack ? "pause" : "play"}
              size={36}
              color={theme.colors.onPrimary}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loopButton}
          onPress={handleLoopToggle}
          disabled={!isAudioReady}
        >
          <View
            style={[
              styles.controlButton,
              styles.smallButton,
              isLooping && styles.activeControlButton,
              !isAudioReady && styles.disabledControlButton,
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

      {/* Speed Options */}
      <View style={styles.speedControlContainer}>
        <Text style={styles.speedLabel}>Playback Speed:</Text>
        <View style={styles.speedOptions}>
          {([0.5, 1, 1.5, 2] as PlaybackSpeed[]).map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedOption,
                playbackSpeed === speed && styles.activeSpeedOption,
                !isAudioReady && styles.disabledControlButton,
              ]}
              onPress={() => handleSpeedChange(speed)}
              disabled={!isAudioReady}
            >
              <Text
                style={[
                  styles.speedOptionText,
                  playbackSpeed === speed && styles.activeSpeedOptionText,
                ]}
              >
                {speed}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Show offline warning if no connection */}
      {!hasNetworkConnection && (
        <View style={styles.offlineWarning}>
          <Ionicons name="cloud-offline" size={16} color={theme.colors.error} />
          <Text style={styles.offlineText}>You&apos;re offline. Some features may be limited.</Text>
        </View>
      )}
    </View>
  );
};

export default FullAudioPlayer;
