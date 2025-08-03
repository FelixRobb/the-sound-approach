import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useContext, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAudio } from "../context/AudioContext";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getBestAudioUri } from "../lib/mediaUtils";
import type { RootStackParamList } from "../types";

const iconHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

/**
 * A global, sticky audio control bar that sits just above the bottom navigation bar (when present)
 * and persists across the entire application.
 */
const GlobalAudioBar: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemedStyles();

  const {
    isPlaying,
    isLoading,
    currentRecording,
    position,
    duration,
    togglePlayPause,
    skipForward,
    skipBackward,
    stopPlayback,
  } = useAudio();

  const { isDownloaded, getDownloadPath } = useContext(DownloadContext);
  const { isConnected } = useContext(NetworkContext);

  const audioUri = useMemo(() => {
    return currentRecording
      ? getBestAudioUri(currentRecording, isDownloaded, getDownloadPath, isConnected)
      : null;
  }, [currentRecording, isDownloaded, getDownloadPath, isConnected]);

  // If we still don't have a playable URI, don't render the bar
  if (!audioUri) return null;

  const handlePlayPause = () => {
    if (!audioUri || !currentRecording) return;
    togglePlayPause(audioUri, currentRecording).catch(() => {});
  };

  const handleNavigateToDetails = () => {
    if (!currentRecording) return;
    navigation.navigate("RecordingDetails", { recordingId: currentRecording.id });
  };

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      // Place just above the native tab-bar when it is visible (height≈70 on Android,90 on iOS)
      bottom: Platform.OS === "ios" ? 100 : 80,
      // In screens without bottom tab, the bar will align to bottom edge.
      // We'll slightly animate using translateY when tab is hidden, but for now set minimum.
      zIndex: 999,
      elevation: 30,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    inner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    infoContainer: {
      flex: 1,
      marginHorizontal: 12,
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontWeight: "600",
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 2,
    },
    controlButton: {
      padding: 6,
    },
    playIcon: {
      marginLeft: 2,
    },
    progressText: {
      color: theme.colors.tertiary,
      fontSize: 10,
    },
  });

  const ProgressText = () => (
    <Text style={styles.progressText}>
      {formatTime(position)} / {formatTime(duration)}
    </Text>
  );

  return (
    <Pressable style={styles.container} onPress={handleNavigateToDetails}>
      <View style={styles.inner}>
        {/* Play / pause */}
        <TouchableOpacity
          hitSlop={iconHitSlop}
          onPress={handlePlayPause}
          style={styles.controlButton}
        >
          {isLoading ? (
            <ActivityIndicator size={20} color={theme.colors.primary} />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={24}
              color={theme.colors.primary}
              style={isPlaying ? undefined : styles.playIcon}
            />
          )}
        </TouchableOpacity>

        {/* Backward 10 s */}
        <TouchableOpacity
          hitSlop={iconHitSlop}
          onPress={() => skipBackward(10)}
          style={styles.controlButton}
          disabled={!currentRecording}
        >
          <Ionicons name="play-back" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Forward 10 s */}
        <TouchableOpacity
          hitSlop={iconHitSlop}
          onPress={() => skipForward(10)}
          style={styles.controlButton}
          disabled={!currentRecording}
        >
          <Ionicons name="play-forward" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Stop */}
        <TouchableOpacity hitSlop={iconHitSlop} onPress={stopPlayback} style={styles.controlButton}>
          <Ionicons name="stop" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoContainer} pointerEvents="none">
          <Text style={styles.title} numberOfLines={1}>
            {currentRecording?.title ?? ""}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {currentRecording?.species?.common_name}
            {currentRecording?.species?.scientific_name
              ? ` – ${currentRecording.species.scientific_name}`
              : ""}
          </Text>
          <ProgressText />
        </View>
      </View>
    </Pressable>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export default GlobalAudioBar;
