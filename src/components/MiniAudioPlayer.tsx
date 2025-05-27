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
      height: size + 8,
      justifyContent: "center",
      width: size + 8,
    },
    playButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: size / 2,
      elevation: 2,
      height: size,
      justifyContent: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      width: size,
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
      onPress={handlePress}
      disabled={isCurrentlyLoading}
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
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              marginLeft: isCurrentlyPlaying ? 0 : 2,
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default MiniAudioPlayer;
