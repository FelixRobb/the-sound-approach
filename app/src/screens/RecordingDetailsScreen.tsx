import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useEventListener } from "expo";
import * as ScreenOrientation from "expo-screen-orientation";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState, useContext, useMemo, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";

import CustomModal from "../components/CustomModal";
import DetailHeader from "../components/DetailHeader";
import PageBadge from "../components/PageBadge";
import { DownloadContext } from "../context/DownloadContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getSonogramVideoUri } from "../lib/mediaUtils";
import { fetchRecordingById } from "../lib/supabase";
import type { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const RecordingDetailsScreen = () => {
  const { theme } = useThemedStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RecordingDetails">>();
  const { downloadRecording, isDownloaded, downloads, deleteDownload } =
    useContext(DownloadContext);

  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPosition, setVideoPosition] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [wasPlayingBeforeSeek, setWasPlayingBeforeSeek] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);

  // Controls visibility state
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Modal states
  const [showDownloadErrorModal, setShowDownloadErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const videoViewRef = useRef(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMountedRef = useRef(true);

  // Add these lines for react-native-awesome-slider
  const sliderProgress = useSharedValue(0);
  const sliderMin = useSharedValue(0);
  const sliderMax = useSharedValue(1); // Default to 1, will be updated when video loads

  const styles = StyleSheet.create({
    backgroundPattern: {
      backgroundColor: theme.colors.background,
      bottom: 0,
      left: 0,
      opacity: 0.6,
      position: "absolute",
      right: 0,
      top: 0,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      padding: 16,
    },
    // eslint-disable-next-line react-native/no-color-literals
    controlsContainer: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      borderRadius: 8,
      bottom: 12,
      flexDirection: "row",
      left: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      position: "absolute",
      right: 12,
      zIndex: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    descriptionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 3,
      marginBottom: 16,
      overflow: "hidden",
      padding: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
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
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 12,
    },
    downloadButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      width: "100%",
    },
    downloadButtonSmall: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: 50,
      padding: 8,
    },
    downloadButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    downloadCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 3,
      marginBottom: 16,
      overflow: "hidden",
      padding: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    downloadedContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
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
      borderRadius: 16,
      elevation: 4,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      width: width * 0.9,
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
    // eslint-disable-next-line react-native/no-color-literals
    fullscreenControls: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      borderRadius: 8,
      bottom: 40,
      flexDirection: "row",
      left: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      position: "absolute",
      right: 20,
      zIndex: 1000,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
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
    loadingCard: {
      alignItems: "center",
      width: width * 0.9,
    },
    loadingContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },
    pageBadgeWrapper: {
      alignSelf: "flex-start",
      marginVertical: 2,
    },
    // eslint-disable-next-line react-native/no-color-literals
    playCenterButton: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: [{ translateX: -35 }, { translateY: -35 }],
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      width: 70,
      height: 70,
      borderRadius: 35,
      zIndex: 2,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    // eslint-disable-next-line react-native/no-color-literals
    pauseCenterButton: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: [{ translateX: -35 }, { translateY: -35 }],
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      width: 70,
      height: 70,
      borderRadius: 35,
      zIndex: 3,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    centerButtonTouch: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    videoTouchOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
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
      borderRadius: 12,
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
      marginBottom: 4,
    },
    slider: {
      flex: 1,
      height: 40,
      marginHorizontal: 12,
    },
    // eslint-disable-next-line react-native/no-color-literals
    sliderThumb: {
      backgroundColor: "#ffffff",
      borderRadius: 8,
      elevation: 2,
      height: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      width: 16,
    },
    speciesButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.primary,
      borderTopWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      padding: 16,
    },
    speciesButtonText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "600",
      marginRight: 8,
    },
    speciesCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 3,
      marginBottom: 16,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    speciesHeader: {
      padding: 20,
    },
    speciesName: {
      color: theme.colors.onSurface,
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 4,
    },
    // eslint-disable-next-line react-native/no-color-literals
    timeText: {
      color: "#ffffff",
      fontSize: 14,
      marginLeft: 8,
      fontWeight: "500",
    },
    video: {
      flex: 1,
    },
    videoContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 3,
      marginBottom: 16,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    videoHeader: {
      padding: 20,
      paddingBottom: 12,
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    videoTitle: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: "bold",
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
    return getSonogramVideoUri(recording);
  }, [recording]);

  // Initialize the video player
  const videoPlayer = useVideoPlayer(sonogramVideoUri, (player) => {
    if (!player) return;

    player.timeUpdateEventInterval = 0.1; // More frequent updates for smoother slider
    player.loop = false;

    // Force load the video on iOS by setting a small volume initially
    if (sonogramVideoUri) {
      player.volume = 0.01;
      // Preload the video with proper cleanup
      volumeTimeoutRef.current = setTimeout(() => {
        if (isComponentMountedRef.current && player) {
          player.volume = 1;
        }
      }, 100);
    }
  });

  // Reset video state when URI changes or becomes null
  const resetVideoState = useCallback(() => {
    setVideoError(false);
    setIsVideoLoaded(false);
    setVideoDuration(0);
    setVideoPosition(0);
    setShowInitialLoading(!!sonogramVideoUri);
    setIsPlaying(false);
    setIsSeeking(false);
    setWasPlayingBeforeSeek(false);
  }, [sonogramVideoUri]);

  // Listen for video ready/loaded events
  useEventListener(videoPlayer, "statusChange", (payload) => {
    if (!isComponentMountedRef.current) return;

    if (payload.status === "readyToPlay" && !isVideoLoaded) {
      setIsVideoLoaded(true);
      setVideoDuration(videoPlayer.duration || 0);
      sliderMax.value = videoPlayer.duration || 1; // Update slider max value
      setVideoError(false);
      setShowInitialLoading(false);
    } else if (payload.status === "error" || payload.status === "idle") {
      if (payload.status === "error") {
        setVideoError(true);
      }
      setIsVideoLoaded(false);
      setShowInitialLoading(false);
    }
  });

  // Listen for timeUpdate event to update the position
  useEventListener(videoPlayer, "timeUpdate", (payload) => {
    if (!isComponentMountedRef.current) return;

    // Only update position when not actively seeking
    if (!isSeeking) {
      setVideoPosition(payload.currentTime);
      sliderProgress.value = payload.currentTime;
    }
  });

  // Listen for playing state changes
  useEventListener(videoPlayer, "playingChange", (payload) => {
    if (!isComponentMountedRef.current) return;
    setIsPlaying(payload.isPlaying);
  });

  // Handle video URI changes
  useEffect(() => {
    resetVideoState();
  }, [resetVideoState]);

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

  // Handle screen focus/blur - pause video when navigating forward to another screen
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - no action needed
      return () => {
        // Screen is losing focus - pause the video if it exists and is playing
        if (videoPlayer) {
          try {
            videoPlayer.pause();
          } catch (error) {
            // Video player might be disposed, which is fine
          }
        }
      };
    }, [videoPlayer])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMountedRef.current = false;
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const getDownloadStatus = () => {
    if (!recording) return "idle";
    if (isDownloaded(recording.id)) return "completed";
    return downloads[recording.id]?.status || "idle";
  };

  const handleDownload = async () => {
    if (!recording) return;
    try {
      await downloadRecording(recording);
    } catch (error) {
      console.error("Download error:", error);
      setShowDownloadErrorModal(true);
    }
  };

  const handleDeleteDownload = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteDownload = async () => {
    if (!recording) return;

    setIsDeleting(true);
    try {
      await deleteDownload(recording.id);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const hideVideoControls = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  }, [controlsOpacity]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        hideVideoControls();
      }
    }, 3000); // Hide after 3 seconds
  }, [hideVideoControls, isPlaying]);

  const showVideoControls = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    resetControlsTimeout();
  }, [controlsOpacity, resetControlsTimeout]);

  const handleVideoPress = useCallback(() => {
    if (showControls) {
      hideVideoControls();
    } else {
      showVideoControls();
    }
  }, [showControls, hideVideoControls, showVideoControls]);

  const togglePlayPause = async () => {
    if (!isVideoLoaded || !videoPlayer) return;

    try {
      if (isPlaying) {
        videoPlayer.pause();
      } else {
        videoPlayer.play();
      }
      showVideoControls(); // Show controls when play/pause is triggered
    } catch (error) {
      console.error("Error toggling play/pause:", error);
      setVideoError(true);
    }
  };

  const toggleFullscreen = () => {
    setIsVideoFullscreen(!isVideoFullscreen);
  };

  const onSeekStart = () => {
    setIsSeeking(true);
    // Remember if we were playing before seeking
    setWasPlayingBeforeSeek(isPlaying);
    // Pause the video during seeking to prevent position conflicts
    if (isPlaying && videoPlayer) {
      videoPlayer.pause();
    }
  };

  const onSeekComplete = (value: number) => {
    if (!isVideoLoaded || !videoPlayer) return;

    try {
      // Set the video position
      videoPlayer.currentTime = value;
      sliderProgress.value = value;
      setVideoPosition(value);

      // Resume playing if it was playing before seeking
      if (wasPlayingBeforeSeek) {
        videoPlayer.play();
      }
    } catch (error) {
      console.error("Error seeking video:", error);
    } finally {
      // Always stop seeking
      setIsSeeking(false);
    }
  };

  // Reset controls when video loads or play state changes
  useEffect(() => {
    if (isVideoLoaded) {
      showVideoControls();
    }
  }, [isVideoLoaded, showVideoControls]);

  // Auto-hide controls when playing
  useEffect(() => {
    if (isPlaying && showControls) {
      resetControlsTimeout();
    } else if (!isPlaying && controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, [isPlaying, resetControlsTimeout, showControls]);

  const renderVideoControls = (isFullscreen = false) => {
    const containerStyle = isFullscreen ? styles.fullscreenControls : styles.controlsContainer;

    return (
      <Animated.View style={[containerStyle, { opacity: controlsOpacity }]}>
        <TouchableOpacity onPress={togglePlayPause} disabled={!isVideoLoaded}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={24}
            color={isVideoLoaded ? "#ffffff" : "rgba(255, 255, 255, 0.5)"}
          />
        </TouchableOpacity>

        <Slider
          progress={sliderProgress}
          minimumValue={sliderMin}
          maximumValue={sliderMax}
          onSlidingStart={onSeekStart}
          onSlidingComplete={onSeekComplete}
          thumbWidth={16}
          theme={{
            minimumTrackTintColor: "#ffffff",
            maximumTrackTintColor: "rgba(255, 255, 255, 0.3)",
          }}
          containerStyle={styles.slider}
          disable={!isVideoLoaded}
          disableTapEvent
          bubble={(value) => formatTime(value)}
          bubbleTextStyle={{
            color: theme.colors.onTertiary,
          }}
          renderThumb={() => <View style={styles.sliderThumb} />}
        />

        <Text style={styles.timeText}>
          {formatTime(videoPosition)}/{formatTime(videoDuration)}
        </Text>

        <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
          <Ionicons name={isVideoFullscreen ? "contract" : "expand"} size={24} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderVideoPlayer = () => {
    if (!sonogramVideoUri || videoError) {
      return (
        <View style={styles.playerContainerError}>
          <Ionicons name="alert-circle" size={40} color={theme.colors.error} />
          <Text style={styles.descriptionTextError}>
            {videoError ? "Error loading video" : "Video source not available"}
          </Text>
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
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />

        {/* Touch overlay for showing/hiding controls */}
        <TouchableOpacity
          style={styles.videoTouchOverlay}
          onPress={handleVideoPress}
          activeOpacity={1}
        />

        {showInitialLoading && (
          <View style={[styles.videoOverlay, { backgroundColor: theme.colors.backdrop }]}>
            <ActivityIndicator size={36} color={theme.colors.primary} />
          </View>
        )}

        {/* Play button when paused */}
        {isVideoLoaded && !isPlaying && !isSeeking && !showInitialLoading && (
          <TouchableOpacity
            style={styles.playCenterButton}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={32} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Pause button when playing and controls visible */}
        {isVideoLoaded && isPlaying && showControls && !isSeeking && !showInitialLoading && (
          <Animated.View style={[styles.pauseCenterButton, { opacity: controlsOpacity }]}>
            <TouchableOpacity
              onPress={togglePlayPause}
              activeOpacity={1}
              style={styles.centerButtonTouch}
            >
              <Ionicons name="pause" size={32} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bottom controls */}
        {showControls && renderVideoControls(false)}
      </View>
    );
  };

  // Background pattern component
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <DetailHeader title="Loading..." />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  if (error || !recording) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <DetailHeader title="Error" />
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={48} style={styles.errorIcon} />
            <Text style={styles.errorTitle}>Unable to Load Recording</Text>
            <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (isVideoFullscreen) {
    // Exit fullscreen if no video URI available
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
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />

        {/* Touch overlay for showing/hiding controls */}
        <TouchableOpacity
          style={styles.videoTouchOverlay}
          onPress={handleVideoPress}
          activeOpacity={1}
        />

        {showInitialLoading && (
          <View style={[styles.fullScreenVideoOverlay, { backgroundColor: theme.colors.backdrop }]}>
            <ActivityIndicator size={36} color={theme.colors.primary} />
          </View>
        )}

        {/* Play button when paused */}
        {isVideoLoaded && !isPlaying && !isSeeking && !showInitialLoading && (
          <TouchableOpacity
            style={styles.playCenterButton}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={32} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Pause button when playing and controls visible */}
        {isVideoLoaded && isPlaying && showControls && !isSeeking && !showInitialLoading && (
          <Animated.View style={[styles.pauseCenterButton, { opacity: controlsOpacity }]}>
            <TouchableOpacity
              onPress={togglePlayPause}
              activeOpacity={1}
              style={styles.centerButtonTouch}
            >
              <Ionicons name="pause" size={32} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bottom controls */}
        {showControls && renderVideoControls(true)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <DetailHeader
        title={recording.title}
        subtitle={recording.species?.scientific_name}
        rightElement={
          getDownloadStatus() === "completed" && (
            <TouchableOpacity
              style={styles.downloadButtonSmall}
              onPress={() => navigation.navigate("DownloadsManager", { showBackButton: true })}
            >
              <Ionicons name="cloud-done" size={24} color={theme.colors.onTertiary} />
            </TouchableOpacity>
          )
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.speciesCard}>
          <View style={styles.speciesHeader}>
            <Text style={styles.speciesName}>{recording.species?.common_name}</Text>
            <Text style={styles.scientificName}>{recording.species?.scientific_name}</Text>
            {recording.book_page_number && (
              <View style={styles.pageBadgeWrapper}>
                <PageBadge page={recording.book_page_number} />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.speciesButton}
            onPress={() =>
              navigation.navigate("SpeciesDetails", { speciesId: recording.species_id })
            }
          >
            <Text style={styles.speciesButtonText}>View Species Details</Text>
            <Ionicons name="arrow-forward" size={20} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

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
              <TouchableOpacity style={styles.downloadButton} onPress={handleDeleteDownload}>
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
              <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                <Ionicons name="cloud-download" size={24} color={theme.colors.onPrimary} />
                <Text style={styles.downloadButtonText}>Download for Offline Use</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Download Error Modal */}
      <CustomModal
        visible={showDownloadErrorModal}
        onClose={() => setShowDownloadErrorModal(false)}
        title="Download Error"
        message="Failed to download the recording. Please check your connection and try again."
        icon="cloud-download-outline"
        iconColor={theme.colors.error}
        buttons={[
          {
            text: "OK",
            onPress: () => setShowDownloadErrorModal(false),
            style: "default",
          },
        ]}
      />

      {/* Delete Download Modal */}
      <CustomModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Remove Download"
        message="Are you sure you want to remove this download? You'll need to download it again for offline use."
        icon="trash-outline"
        iconColor={theme.colors.error}
        buttons={[
          {
            text: "Cancel",
            onPress: () => setShowDeleteModal(false),
            style: "cancel",
          },
          {
            text: "Remove",
            onPress: confirmDeleteDownload,
            style: "destructive",
            loading: isDeleting,
          },
        ]}
      />
    </View>
  );
};

export default RecordingDetailsScreen;
