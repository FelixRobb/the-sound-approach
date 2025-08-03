import { Ionicons } from "@expo/vector-icons";
import React, { useContext } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

import { useAudio } from "../context/AudioContext";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getBestAudioUri } from "../lib/mediaUtils";
import type { Recording } from "../types";

interface MiniAudioPlayerProps {
  size?: number;
  recording: Recording;
}

const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = (props) => {
  const { size = 36, recording } = props;

  const { theme } = useThemedStyles();

  // Contexts & hooks
  const { isPlaying, isLoading, currentRecording, togglePlayPause } = useAudio();
  const { isDownloaded, getDownloadPath } = useContext(DownloadContext);
  const { isConnected } = useContext(NetworkContext);

  // Resolve identifiers & source
  const audioUri = getBestAudioUri(recording, isDownloaded, getDownloadPath, isConnected);

  // Derived playback state
  const isCurrentTrack = currentRecording?.id === recording.id;
  const isCurrentlyPlaying = isPlaying && isCurrentTrack;
  const isCurrentlyLoading = isLoading && isCurrentTrack;

  // Actions
  const handlePress = async () => {
    if (!audioUri) return;
    await togglePlayPause(audioUri, recording);
  };

  // Styles
  const styles = StyleSheet.create({
    buttonContainer: {
      alignItems: "center",
      height: size + 4,
      justifyContent: "center",
      width: size + 4,
    },
    playButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: size / 2,
      elevation: 2,
      height: size,
      justifyContent: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      width: size,
    },
    iconOffsetPlay: {
      marginLeft: 1,
    },
  });

  const disabled = !audioUri;

  return (
    <TouchableOpacity
      style={styles.buttonContainer}
      onPress={!isCurrentlyLoading && !disabled ? handlePress : undefined}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.playButton}>
        {isCurrentlyLoading ? (
          <ActivityIndicator size={Math.max(16, size * 0.45)} color={theme.colors.onPrimary} />
        ) : (
          <Ionicons
            name={isCurrentlyPlaying ? "pause" : "play"}
            size={size * 0.5}
            color={theme.colors.onPrimary}
            style={!isCurrentlyPlaying ? styles.iconOffsetPlay : undefined}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default MiniAudioPlayer;
