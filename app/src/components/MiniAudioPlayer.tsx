import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { TouchableOpacity, StyleSheet, View, ActivityIndicator } from "react-native";

import { useAudio } from "../context/AudioContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

interface MiniAudioPlayerProps {
  trackId: string;
  audioUri: string;
  size?: number;
}

const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({ trackId, audioUri, size = 36 }) => {
  const { isPlaying, isLoading, currentTrackId, togglePlayPause } = useAudio();
  const { theme } = useThemedStyles();

  const isCurrentTrack = currentTrackId === trackId;
  const isCurrentlyPlaying = isPlaying && isCurrentTrack;
  const isCurrentlyLoading = isLoading && isCurrentTrack;

  const handlePress = async () => {
    await togglePlayPause(audioUri, trackId);
  };

  const styles = StyleSheet.create({
    buttonContainer: {
      alignItems: "center",
      height: size + 4,
      justifyContent: "center",
      width: size + 4,
    },
    pauseIcon: {
      marginLeft: 0,
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
    playIcon: {
      marginLeft: 1,
    },
  });

  const getButtonStyle = () => {
    if (isCurrentlyLoading) return [styles.playButton];
    if (isCurrentlyPlaying) return [styles.playButton];
    return styles.playButton;
  };

  const getIconName = () => {
    if (isCurrentlyPlaying) return "pause";
    return "play";
  };

  return (
    <TouchableOpacity
      style={styles.buttonContainer}
      onPress={!isCurrentlyLoading ? handlePress : undefined}
      activeOpacity={0.7}
    >
      <View style={getButtonStyle()}>
        {isCurrentlyLoading ? (
          <ActivityIndicator size={Math.max(16, size * 0.45)} color={theme.colors.onPrimary} />
        ) : (
          <Ionicons
            name={getIconName()}
            size={size * 0.5}
            color={theme.colors.onPrimary}
            style={isCurrentlyPlaying ? styles.pauseIcon : styles.playIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default MiniAudioPlayer;
