"use client";

import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useEventListener } from "expo";
import * as ScreenOrientation from "expo-screen-orientation";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState, useContext, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
  StatusBar,
  Animated,
} from "react-native";

import DetailHeader from "../components/DetailHeader";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getSonogramVideoUri } from "../lib/mediaUtils";
import { fetchRecordingById } from "../lib/supabase";
import type { Recording, RootStackParamList } from "../types";

const RecordingDetailsScreen = () => {
  const { theme } = useThemedStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RecordingDetails">>();
  const { isConnected } = useContext(NetworkContext);
  const { downloadRecording, isDownloaded, downloads, deleteDownload } =
    useContext(DownloadContext);

  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPosition, setVideoPosition] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const videoViewRef = useRef(null);
  const [isSeekingOperation, setIsSeekingOperation] = useState(false);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      padding: 16,
    },
    controlsContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.backdrop,
      borderRadius: 30,
      bottom: 12,
      flexDirection: "row",
      left: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      position: "absolute",
      right: 12,
    },
    descriptionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      elevation: 4,
      marginBottom: 20,
      overflow: "hidden",
      padding: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    descriptionText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 24,
    },
    descriptionTextError: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 24,
      marginTop: 12,
    },
    descriptionTitle: {
      color: theme.colors.onSurface,
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 12,
    },
    detailHeaderDownloaded: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      padding: 8,
    },
    downloadButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 16,
      width: "100%",
    },
    downloadButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 12,
    },
    downloadCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      elevation: 4,
      marginBottom: 20,
      overflow: "hidden",
      padding: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    downloadedContainer: {
      alignItems: "center",
      flexDirection: "row",
    },
    downloadedText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 12,
    },
    errorCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      elevation: 4,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      width: "90%",
    },
    errorContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },
    errorIcon: {
      color: theme.colors.error,
      marginBottom: 16,
    },
    errorText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      marginBottom: 24,
      textAlign: "center",
    },
    errorTitle: {
      color: theme.colors.onSurface,
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 8,
      textAlign: "center",
    },
    fullScreenVideoOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    fullscreenButton: {
      marginLeft: 12,
    },
    fullscreenContainer: {
      backgroundColor: theme.colors.background,
      height: "100%",
      position: "absolute",
      width: "100%",
      zIndex: 999,
    },
    fullscreenControls: {
      alignItems: "center",
      backgroundColor: theme.colors.backdrop,
      borderRadius: 30,
      bottom: 40,
      flexDirection: "row",
      left: 20,
      padding: 12,
      position: "absolute",
      right: 20,
      zIndex: 1000,
    },
    fullscreenHeader: {
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.backdrop,
      borderBottomWidth: 1,
      padding: 20,
      position: "absolute",
      top: 0,
      width: "100%",
      zIndex: 1000,
    },
    fullscreenSubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 4,
    },
    fullscreenTitle: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: "600",
    },
    fullscreenVideo: {
      flex: 1,
    },
    offlineText: {
      color: theme.colors.error,
      fontSize: 14,
      marginLeft: 8,
    },
    offlineWarning: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: 12,
    },
    pageReference: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    pageText: {
      color: theme.colors.onPrimaryContainer,
      fontSize: 14,
      fontWeight: "600",
    },
    playButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 30,
      height: 60,
      justifyContent: "center",
      width: 60,
    },
    playerContainer: {
      aspectRatio: 16 / 9,
      backgroundColor: theme.colors.background,
      width: "100%",
    },
    playerContainerError: {
      alignItems: "center",
      aspectRatio: 16 / 9,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: "center",
      width: "100%",
    },
    retryButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    retryText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    scientificName: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      fontStyle: "italic",
      marginBottom: 12,
    },
    slider: {
      flex: 1,
      height: 40,
      marginHorizontal: 12,
    },
    speciesButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderTopColor: theme.colors.outlineVariant,
      borderTopWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      padding: 16,
    },
    speciesButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: "600",
      marginRight: 8,
    },
    speciesCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      elevation: 4,
      marginBottom: 20,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    speciesHeader: {
      padding: 20,
    },
    speciesName: {
      color: theme.colors.onSurface,
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 4,
    },
    timeText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginLeft: 8,
    },
    video: {
      flex: 1,
    },
    videoContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      elevation: 4,
      marginBottom: 20,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    videoHeader: {
      padding: 20,
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },

    videoTitle: {
      color: theme.colors.onSurface,
      fontSize: 20,
      fontWeight: "600",
    },
  });

  // Fetch recording details
  const {
    data: recording,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recording", route.params.recordingId],
    queryFn: () => fetchRecordingById(route.params.recordingId),
  });

  const sonogramVideoUri = useMemo(() => {
    if (!recording) return null;
    return getSonogramVideoUri(recording, isConnected);
  }, [recording, isConnected]);

  // Initialize the video player
  const videoPlayer = useVideoPlayer(sonogramVideoUri || null, (player) => {
    player.timeUpdateEventInterval = 0.5;
    player.loop = false;
  });

  // Listen for timeUpdate event to update the position
  useEventListener(videoPlayer, "timeUpdate", (payload) => {
    if (!isSeeking) {
      setVideoPosition(payload.currentTime);
      setSeekValue(payload.currentTime); // Keep seekValue in sync when not seeking
    }
    if (videoDuration === 0 && payload.bufferedPosition > 0) {
      setVideoDuration(videoPlayer.duration || 0);
      setIsVideoLoaded(true);
    }
  });

  // Listen for status changes
  useEventListener(videoPlayer, "playingChange", (payload) => {
    if (!isSeekingOperation) {
      setIsPlaying(payload.isPlaying);
    }
  });

  // Handle orientation and fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = async () => {
      if (isVideoFullscreen) {
        StatusBar.setHidden(true);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        StatusBar.setHidden(false);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    handleFullscreenChange();

    return () => {
      StatusBar.setHidden(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [isVideoFullscreen, fadeAnim, scaleAnim]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isVideoFullscreen) {
        setIsVideoFullscreen(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isVideoFullscreen]);

  const getDownloadStatus = () => {
    if (!recording) return "idle";
    if (isDownloaded(recording.id)) return "completed";
    return downloads[recording.id]?.status || "idle";
  };

  const handleDownload = async () => {
    if (!recording || !isConnected) return;
    try {
      await downloadRecording(recording);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Download Error", "Failed to download the recording. Please try again.");
    }
  };

  const handleDeleteDownload = async (item: Recording) => {
    if (!isConnected) {
      Alert.alert(
        "Cannot Delete While Offline",
        "You need to be online to delete downloaded recordings.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert("Delete Download", "Are you sure you want to delete this download?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteDownload(item.id).catch((error) => {
            console.error("Delete error:", error);
          });
        },
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      videoPlayer.pause();
    } else {
      videoPlayer.play();
    }
  };

  const toggleFullscreen = () => {
    setIsVideoFullscreen(!isVideoFullscreen);
  };

  const onSeekStart = () => {
    setIsSeeking(true);
    setIsSeekingOperation(true);
  };

  // Update the onSeekComplete function:
  const onSeekComplete = async (value: number) => {
    setIsSeeking(false);
    setVideoPosition(value);
    setSeekValue(value);
    videoPlayer.currentTime = value;

    // Use a small delay to allow the video player to settle before listening to playingChange again
    setTimeout(() => {
      setIsSeekingOperation(false);
    }, 100);
  };

  // Update the onValueChange for the slider:
  const onSeekValueChange = (value: number) => {
    if (isSeeking) {
      setSeekValue(value);
    }
  };

  const renderVideoControls = (isFullscreen = false) => {
    const containerStyle = isFullscreen ? styles.fullscreenControls : styles.controlsContainer;

    return (
      <View style={containerStyle}>
        <TouchableOpacity onPress={togglePlayPause}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={videoDuration}
          value={isSeeking ? seekValue : videoPosition}
          onSlidingStart={onSeekStart}
          onValueChange={onSeekValueChange}
          onSlidingComplete={onSeekComplete}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.surfaceVariant}
          tapToSeek
          thumbTintColor={theme.colors.primary}
        />

        <Text style={styles.timeText}>
          {formatTime(isSeeking ? seekValue : videoPosition)}/{formatTime(videoDuration)}
        </Text>

        <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
          <Ionicons
            name={isVideoFullscreen ? "contract" : "expand"}
            size={24}
            color={theme.colors.onPrimary}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderVideoPlayer = () => {
    if (!sonogramVideoUri) {
      return (
        <View style={styles.playerContainerError}>
          <Ionicons name="alert-circle" size={40} color={theme.colors.error} />
          <Text style={styles.descriptionTextError}>Video source not available</Text>
        </View>
      );
    }

    return (
      <View style={styles.playerContainer}>
        <VideoView
          ref={videoViewRef}
          player={videoPlayer}
          style={styles.video}
          contentFit={isVideoFullscreen ? "contain" : "cover"}
          nativeControls={false}
        />

        <TouchableOpacity
          style={[
            styles.videoOverlay,
            (!isPlaying || !isVideoLoaded) && { backgroundColor: theme.colors.backdrop },
          ]}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          {(!isPlaying || !isVideoLoaded) && !isSeekingOperation && (
            <View style={styles.playButton}>
              <Ionicons name="play" size={30} color={theme.colors.onPrimary} />
            </View>
          )}
        </TouchableOpacity>

        {renderVideoControls(false)}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <DetailHeader title="Loading..." />
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !recording) {
    return (
      <View style={styles.container}>
        <DetailHeader title="Error" />
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={48} style={styles.errorIcon} />
            <Text style={styles.errorTitle}>Unable to Load Recording</Text>
            <Text style={styles.errorText}>
              {!isConnected
                ? "You're offline. This recording is not available offline."
                : "Something went wrong. Please try again."}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (isVideoFullscreen) {
    if (!sonogramVideoUri) {
      setIsVideoFullscreen(false);
      return null;
    }

    return (
      <View style={styles.fullscreenContainer}>
        <View style={styles.fullscreenHeader}>
          <Text style={styles.fullscreenTitle}>{recording.title}</Text>
          <Text style={styles.fullscreenSubtitle}>{recording.species?.common_name}</Text>
        </View>
        <VideoView
          player={videoPlayer}
          style={styles.fullscreenVideo}
          contentFit="contain"
          nativeControls={false}
        />

        <TouchableOpacity
          style={styles.fullScreenVideoOverlay}
          onPress={togglePlayPause}
          activeOpacity={1}
        >
          {(!isPlaying || !isVideoLoaded) && !isSeekingOperation && (
            <View style={styles.playButton}>
              <Ionicons name="play" size={30} color={theme.colors.onPrimary} />
            </View>
          )}
        </TouchableOpacity>

        {renderVideoControls(true)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailHeader
        title={recording.title}
        subtitle={recording.species?.scientific_name}
        rightElement={
          isDownloaded(recording.id) && (
            <TouchableOpacity
              style={styles.detailHeaderDownloaded}
              onPress={() => navigation.navigate("Downloads")}
            >
              <Ionicons name="cloud-done" size={20} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          )
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View
          style={[
            styles.speciesCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.speciesHeader}>
            <Text style={styles.speciesName}>{recording.species?.common_name}</Text>
            <Text style={styles.scientificName}>{recording.species?.scientific_name}</Text>
            <View style={styles.pageReference}>
              <Text style={styles.pageText}>Page {recording.book_page_number}</Text>
            </View>
          </View>
          {isConnected && (
            <TouchableOpacity
              style={styles.speciesButton}
              onPress={() =>
                navigation.navigate("SpeciesDetails", { speciesId: recording.species_id })
              }
            >
              <Text style={styles.speciesButtonText}>View Species Details</Text>
              <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={styles.videoContainer}>
          <View style={styles.videoHeader}>
            <Text style={styles.videoTitle}>Sonogram</Text>
          </View>
          {renderVideoPlayer()}
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{recording.caption}</Text>
        </View>

        <View style={styles.downloadCard}>
          {getDownloadStatus() === "completed" ? (
            <View style={styles.downloadedContainer}>
              <TouchableOpacity
                // eslint-disable-next-line react-native/no-inline-styles
                style={[styles.downloadButton, !isConnected && { opacity: 0.5 }]}
                onPress={() => handleDeleteDownload(recording)}
                disabled={!isConnected}
              >
                <Ionicons name="trash-outline" size={24} color={theme.colors.onPrimary} />
                <Text style={styles.downloadButtonText}>Remove Download</Text>
              </TouchableOpacity>
            </View>
          ) : getDownloadStatus() === "downloading" ? (
            <View style={styles.downloadedContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.downloadedText}>Downloading...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                // eslint-disable-next-line react-native/no-inline-styles
                style={[styles.downloadButton, !isConnected && { opacity: 0.5 }]}
                onPress={handleDownload}
                disabled={!isConnected}
              >
                <Ionicons name="cloud-download" size={24} color={theme.colors.onPrimary} />
                <Text style={styles.downloadButtonText}>Download for Offline Use</Text>
              </TouchableOpacity>

              {!isConnected && (
                <View style={styles.offlineWarning}>
                  <Ionicons name="wifi" size={16} color={theme.colors.error} />
                  <Text style={styles.offlineText}>Connect to download this recording</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default RecordingDetailsScreen;
