import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";

import { useAudio } from "../context/AudioContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

interface MiniAudioPlayerProps {
  trackId: string;
  audioUri: string;
  size?: number;
  showLoading?: boolean;
}

const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({ trackId, audioUri, size = 36 }) => {
  const { isPlaying, currentTrackId, togglePlayPause } = useAudio();
  const { theme } = useThemedStyles();

  const isCurrentTrack = currentTrackId === trackId;
  const isCurrentlyPlaying = isPlaying && isCurrentTrack;

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
    playButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: size / 2,
      height: size,
      justifyContent: "center",
      width: size,
    },
    playButtonActive: {
      backgroundColor: theme.colors.primary,
      opacity: 0.9,
    },
  });

  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={handlePress}>
      <View style={[styles.playButton, isCurrentlyPlaying && styles.playButtonActive]}>
        <Ionicons
          name={isCurrentlyPlaying ? "pause" : "play"}
          size={size * 0.6}
          color={theme.colors.onPrimary}
        />
      </View>
    </TouchableOpacity>
  );
};

export default MiniAudioPlayer;
