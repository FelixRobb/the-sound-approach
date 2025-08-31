import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

import { useAudio } from "../context/AudioContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import type { Recording } from "../types";

interface MiniAudioPlayerProps {
  iconSize?: boolean;
  size?: number;
  recording: Recording;
  onPress?: () => void;
}

const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = (props) => {
  const { iconSize = false, size = 36, recording, onPress } = props;

  const { theme } = useEnhancedTheme();

  // Contexts & hooks
  const { isPlaying, isLoading, currentRecording, togglePlayPause } = useAudio();

  // Derived playback state
  const isCurrentTrack = currentRecording?.id === recording.id;
  const isCurrentlyPlaying = isPlaying && isCurrentTrack;
  const isCurrentlyLoading = isLoading && isCurrentTrack;

  // Actions
  const handlePress = async () => {
    if (onPress) {
      onPress();
    }
    await togglePlayPause(recording);
  };

  // Styles
  const styles = StyleSheet.create({
    buttonContainer: {
      alignItems: "center",
      height: size + 4,
      justifyContent: "center",
      width: size + 4,
    },
    iconOffsetPlay: {
      marginLeft: 1.5,
    },
    iconSizeButtonContainer: {
      alignItems: "center",
      height: size + 4,
      justifyContent: "center",
      width: size + 4,
    },
    iconSizePlayButton: {
      alignItems: "center",
      backgroundColor: theme.colors.transparent,
      borderRadius: theme.borderRadius.full,
      height: size,
      justifyContent: "center",
      width: size,
    },
    playButton: {
      alignItems: "center",
      backgroundColor: isCurrentTrack ? theme.colors.primary : theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.full,
      elevation: isCurrentTrack ? 3 : 1,
      height: size,
      justifyContent: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: isCurrentTrack ? 2 : 1 },
      shadowOpacity: isCurrentTrack ? 0.25 : 0.15,
      shadowRadius: isCurrentTrack ? 3 : 2,
      transform: isCurrentTrack ? [{ scale: 1.05 }] : [{ scale: 1 }],
      width: size,
    },
  });

  const disabled = !recording;

  return (
    <TouchableOpacity
      style={iconSize ? styles.iconSizeButtonContainer : styles.buttonContainer}
      onPress={!isCurrentlyLoading && !disabled ? handlePress : undefined}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={iconSize ? styles.iconSizePlayButton : styles.playButton}>
        {isCurrentlyLoading ? (
          <ActivityIndicator
            size={Math.max(16, size * 0.45)}
            color={
              iconSize
                ? theme.colors.primary
                : isCurrentTrack
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant
            }
          />
        ) : (
          <Ionicons
            name={isCurrentlyPlaying ? "pause" : "play"}
            size={iconSize ? size * 0.55 : size * 0.5}
            color={
              iconSize
                ? theme.colors.primary
                : isCurrentTrack
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant
            }
            style={!isCurrentlyPlaying ? styles.iconOffsetPlay : undefined}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default MiniAudioPlayer;
