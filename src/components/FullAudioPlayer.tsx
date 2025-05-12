"use client";

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useVideo } from "../context/VideoContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

import VideoPlayer from "./VideoPlayer";

interface FullAudioPlayerProps {
  trackId: string;
  sonogramvideoid: string | null;
  hasNetworkConnection: boolean;
}

const FullAudioPlayer: React.FC<FullAudioPlayerProps> = ({
  trackId,
  sonogramvideoid,
  hasNetworkConnection,
}) => {
  const { theme } = useThemedStyles();
  const { exitFullscreen, isFullscreen } = useVideo();

  // Make sure to exit fullscreen when unmounting
  useEffect(() => {
    return () => {
      if (isFullscreen) {
        exitFullscreen().catch(console.error);
      }
    };
  }, [exitFullscreen, isFullscreen]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 4,
      marginHorizontal: 2,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      width: "100%",
    },
    errorContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    errorText: {
      color: theme.colors.onErrorContainer,
      fontSize: 15,
      marginBottom: 15,
      marginTop: 10,
      textAlign: "center",
    },
  });

  // Show error if no sonogramvideoid is provided
  if (!sonogramvideoid) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={28} color={theme.colors.error} />
        <Text style={styles.errorText}>Sonogram video source not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoPlayer videoId={trackId} hasNetworkConnection={hasNetworkConnection} />
    </View>
  );
};

export default FullAudioPlayer;
