import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useEventListener } from "expo";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Animated,
  Dimensions,
} from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackgroundPattern from "../components/BackgroundPattern";
import CustomModal from "../components/CustomModal";
import DetailHeader from "../components/DetailHeader";
import { useGlobalAudioBarHeight } from "../components/GlobalAudioBar";
import LoadingScreen from "../components/LoadingScreen";
import MiniAudioPlayer from "../components/MiniAudioPlayer";
import { Button } from "../components/ui";
import { useAudio } from "../context/AudioContext";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { useGlobalAudioBar } from "../context/GlobalAudioBarContext";
import { getsonagramVideoUri } from "../lib/mediaUtils";
import { fetchRecordingById } from "../lib/supabase";
import { createThemedTextStyle } from "../lib/theme/typography";
import type { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const RecordingDetailsScreen = () => {
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RecordingDetails">>();
  const {
    downloadRecording,
    isDownloaded,
    downloads,
    deleteDownload,
    resumeDownload,
    pauseDownload,
  } = useContext(DownloadContext);
  const { stopPlayback } = useAudio();
  const globalAudioBarHeight = useGlobalAudioBarHeight();

  // Hide GlobalAudioBar when in fullscreen mode
  const { hide: hideGlobalAudioBar, show: showGlobalAudioBar } = useGlobalAudioBar();
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPosition, setVideoPosition] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [wasPlayingBeforeSeek, setWasPlayingBeforeSeek] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [videoUriError, setVideoUriError] = useState(false);

  // Controls visibility state
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const backdropOpacity = useRef(new Animated.Value(0.5)).current;
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

  // Modal states
  const [showDownloadErrorModal, setShowDownloadErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const videoViewRef = useRef<VideoView>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMountedRef = useRef(true);

  // Add these lines for react-native-awesome-slider
  const sliderProgress = useSharedValue(0);
  const sliderMin = useSharedValue(0);
  const sliderMax = useSharedValue(1); // Default to 1, will be updated when video loads

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

  // Get download status for this recording
  const downloadStatus = recording ? downloads[recording.id] : null;
  const isDownloading = downloadStatus?.status === "downloading";
  const isPaused = downloadStatus?.status === "paused";
  const hasError = downloadStatus?.status === "error";
  const progress = downloadStatus?.progress || 0;

  const [sonagramVideoUri, setsonagramVideoUri] = useState<string | null>(null);
  const [isVideoUriLoading, setIsVideoUriLoading] = useState(false);

  // Check if recording has video available
  const [hasVideo, setHasVideo] = useState(false);

  // Handle resume download
  const handleResumePress = async () => {
    if (isPaused && downloadStatus && recording) {
      try {
        await resumeDownload(recording.id);
      } catch (error) {
        console.error("Failed to resume download:", error);
        setShowDownloadErrorModal(true);
      }
    }
  };

  // Handle pause download
  const handlePausePress = async () => {
    if (isDownloading && recording) {
      try {
        await pauseDownload(recording.id);
      } catch (error) {
        console.error("Failed to pause download:", error);
        setShowDownloadErrorModal(true);
      }
    }
  };

  // Fetch sonagram video URI only if video is available
  useEffect(() => {
    if (!recording) {
      setHasVideo(false);
      setsonagramVideoUri(null);
      setIsVideoUriLoading(false);
      setShowInitialLoading(false);
      setVideoUriError(false);
      return;
    }
    setHasVideo(recording.sonagramvideoid !== null);

    if (!hasVideo) {
      setsonagramVideoUri(null);
      setIsVideoUriLoading(false);
      setShowInitialLoading(false);
      setVideoError(false);
      setVideoUriError(false);
      return;
    }

    // Start loading immediately when we have a recording with video
    setIsVideoUriLoading(true);
    setShowInitialLoading(false); // Hide initial loading while fetching URI
    setVideoError(false); // Reset any previous errors
    setVideoUriError(false); // Reset URI error before fetching

    getsonagramVideoUri(recording)
      .then((uri) => {
        setsonagramVideoUri(uri);
        setIsVideoUriLoading(false);
        setVideoUriError(!uri);
        setShowInitialLoading(!!uri);
      })
      .catch((error) => {
        console.error("Error fetching sonagram video URI:", error);
        setVideoUriError(true);
        setsonagramVideoUri(null);
        setIsVideoUriLoading(false);
        setShowInitialLoading(false);
      });
  }, [recording, hasVideo]);

  // Initialize the video player only if video is available
  const videoPlayer = useVideoPlayer(hasVideo ? sonagramVideoUri : null, (player) => {
    if (!player || !hasVideo) return;

    player.timeUpdateEventInterval = 0.5; // More frequent updates for smoother slider
    player.loop = false;

    // Force load the video on iOS by setting a small volume initially
    if (sonagramVideoUri) {
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
    // Only show initial loading if we have a URI and we're not currently loading the URI
    setShowInitialLoading(!!sonagramVideoUri && !isVideoUriLoading);
    setIsPlaying(false);
    setIsSeeking(false);
    setWasPlayingBeforeSeek(false);
    setIsVideoEnded(false);
  }, [sonagramVideoUri, isVideoUriLoading]);

  // Listen for video ready/loaded events only if video is available
  useEventListener(videoPlayer, "statusChange", (payload) => {
    if (!isComponentMountedRef.current || !hasVideo || !videoPlayer) return;

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

  // Listen for timeUpdate event to update the position only if video is available
  useEventListener(videoPlayer, "timeUpdate", (payload) => {
    if (!isComponentMountedRef.current || !hasVideo || !videoPlayer) return;

    // Only update position when not actively seeking
    if (!isSeeking) {
      setVideoPosition(payload.currentTime);
      sliderProgress.value = payload.currentTime;

      // Check if video has ended
      if (payload.currentTime >= videoDuration && videoDuration > 0) {
        setIsVideoEnded(true);
      }
    }
  });

  // Listen for playing state changes only if video is available
  useEventListener(videoPlayer, "playingChange", (payload) => {
    if (!isComponentMountedRef.current || !hasVideo || !videoPlayer) return;
    setIsPlaying(payload.isPlaying);
  });

  // Handle video URI changes
  useEffect(() => {
    resetVideoState();
  }, [resetVideoState]);

  // Handle native fullscreen events
  const handleFullscreenEnter = useCallback(() => {
    hideGlobalAudioBar();
  }, [hideGlobalAudioBar]);

  const handleFullscreenExit = useCallback(() => {
    showGlobalAudioBar();
  }, [showGlobalAudioBar]);

  // Cleanup effect - no need to manage orientation manually
  useEffect(() => {
    return () => {
      // Cleanup is handled by native fullscreen
    };
  }, []);

  // Handle back button - native fullscreen handles this automatically
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Native fullscreen will handle back button automatically
      return false;
    });

    return () => backHandler.remove();
  }, []);

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

  const handleDeleteDownload = () => {
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
    Animated.parallel([
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowControls(false);
    });
  }, [controlsOpacity, backdropOpacity]);

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
    Animated.parallel([
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    resetControlsTimeout();
  }, [controlsOpacity, backdropOpacity, resetControlsTimeout]);

  const toggleFullscreen = () => {
    if (!hasVideo || !videoPlayer) return;
    if (isVideoFullscreen) {
      void videoViewRef.current?.exitFullscreen();
      setIsVideoFullscreen(false);
    } else {
      void videoViewRef.current?.enterFullscreen();
      setIsVideoFullscreen(true);
    }
  };

  const handleVideoPress = useCallback(() => {
    if (showControls) {
      hideVideoControls();
    } else {
      showVideoControls();
    }
  }, [showControls, hideVideoControls, showVideoControls]);

  const stopVideoPlayback = () => {
    if (!hasVideo || !videoPlayer) return;
    videoPlayer.pause();
  };

  const togglePlayPause = () => {
    if (!hasVideo || !isVideoLoaded || !videoPlayer) return;

    try {
      if (isVideoEnded) {
        // Reset video to beginning when ended
        videoPlayer.currentTime = 0;
        sliderProgress.value = 0;
        setVideoPosition(0);
        setIsVideoEnded(false);
        stopPlayback(); // Stop audio before starting video
        setTimeout(() => {
          videoPlayer.play();
        }, 100);
      } else if (isPlaying) {
        videoPlayer.pause();
      } else {
        stopPlayback(); // Stop audio before starting video
        setTimeout(() => {
          videoPlayer.play();
        }, 100);
      }
      showVideoControls(); // Show controls when play/pause is triggered
    } catch (error) {
      console.error("Error toggling play/pause:", error);
      setVideoError(true);
    }
  };

  const onSeekStart = () => {
    if (!hasVideo) return;
    setIsSeeking(true);
    // Remember if we were playing before seeking
    setWasPlayingBeforeSeek(isPlaying);
    // Pause the video during seeking to prevent position conflicts
    if (isPlaying && videoPlayer) {
      videoPlayer.pause();
    }
  };

  const onSeekComplete = (value: number) => {
    if (!hasVideo || !isVideoLoaded || !videoPlayer) return;

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

  const styles = StyleSheet.create({
    actionSection: {
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    audioPlayerButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    buttonIcon: {
      marginLeft: isPlaying ? 0 : theme.spacing.xs,
    },
    cardContent: {
      padding: theme.spacing.md,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      paddingBottom: globalAudioBarHeight + theme.spacing.md,
    },
    contentSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    controlsBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.backdrop,
      zIndex: theme.zIndex.base2,
    },
    controlsContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.backdrop,
      borderRadius: theme.borderRadius.lg,
      bottom: theme.spacing.sm,
      elevation: 5,
      flexDirection: "row",
      left: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      position: "absolute",
      right: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: theme.zIndex.base5,
    },
    descriptionTextError: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: theme.spacing.sm,
    },
    downloadButtonSmall: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.borderRadius.full,
      padding: 8,
    },
    downloadStatusContainer: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
    },
    downloadStatusText: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "medium",
        color: "onSurfaceVariant",
      }),
      flex: 1,
      textAlign: "center",
    },
    errorCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 4,
      padding: theme.spacing.lg,
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
      padding: theme.spacing.md,
    },
    errorIcon: {
      color: theme.colors.error,
      marginBottom: theme.spacing.md,
    },
    errorText: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
    errorTitle: {
      ...createThemedTextStyle(theme, {
        size: "2xl",
        weight: "bold",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    flexOne: {
      flex: 1,
    },
    fullButtonTouchable: {
      alignItems: "center",
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    fullScreenVideoOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    fullscreenButton: {
      marginLeft: theme.spacing.sm,
    },
    fullscreenContainer: {
      backgroundColor: theme.colors.background,
      height: "100%",
      position: "absolute",
      width: "100%",
      zIndex: theme.zIndex.base7,
    },
    fullscreenControls: {
      alignItems: "center",
      backgroundColor: theme.colors.backdrop,
      borderRadius: theme.borderRadius.md,
      bottom: theme.spacing.md,
      elevation: 5,
      flexDirection: "row",
      left: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      position: "absolute",
      right: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: theme.zIndex.base10,
    },
    fullscreenHeader: {
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.backdrop,
      borderBottomWidth: 1,
      padding: theme.spacing.md,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      position: "absolute",
      top: 0,
      width: "100%",
      zIndex: theme.zIndex.base10,
    },
    fullscreenSubtitle: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: theme.spacing.xs,
    },
    fullscreenTitle: {
      ...createThemedTextStyle(theme, {
        size: "2xl",
        weight: "bold",
        color: "onSurface",
      }),
    },
    fullscreenVideo: {
      flex: 1,
      marginLeft: insets.left,
      marginRight: insets.right,
    },
    heroBackground: {
      position: "absolute",
      right: -30,
      top: -20,
      zIndex: 0,
    },
    heroContent: {
      flex: 1,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xl,
      zIndex: 1,
    },
    heroGradient: {
      flex: 1,
      minHeight: 180,
    },
    heroSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      elevation: 4,
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
      overflow: "hidden",
      paddingBottom: theme.spacing.xl,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    heroTopRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.lg,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 2,
      marginBottom: theme.spacing.lg,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    infoHeader: {
      marginBottom: theme.spacing.sm,
    },
    infoHeaderTitle: {
      ...createThemedTextStyle(theme, {
        size: "xl",
        weight: "bold",
        color: "onSurface",
      }),
    },
    infoRow: {
      alignItems: "flex-start",
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      paddingVertical: theme.spacing.sm,
    },
    infoRowIcon: {
      marginRight: theme.spacing.sm,
      marginTop: 2,
    },
    infoRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    infoRowText: {
      flex: 1,
    },
    infoValue: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurface",
      }),
      flex: 1,
    },
    infoValueMonospace: {
      fontFamily: "monospace",
      fontSize: 13,
    },
    mediaCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      elevation: 8,
      marginHorizontal: theme.spacing.lg,
      marginTop: -theme.spacing.xxl,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      zIndex: 2,
    },
    mediaHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    mediaSubtitle: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: theme.spacing.xs,
    },

    mediaTitle: {
      ...createThemedTextStyle(theme, {
        size: "xl",
        weight: "bold",
        color: "onSurface",
      }),
    },
    mediaborderbottom: {
      borderBottomColor: theme.colors.outline + "20",
      borderBottomWidth: 1,
    },
    pauseButton: {
      alignItems: "center",
      height: 80,
      justifyContent: "center",
      left: "50%",
      position: "absolute",
      top: "50%",
      transform: [{ translateX: -40 }, { translateY: -40 }],
      width: 80,
      zIndex: theme.zIndex.base4,
    },
    playButton: {
      alignItems: "center",
      height: 80,
      justifyContent: "center",
      left: "50%",
      position: "absolute",
      top: "50%",
      transform: [{ translateX: -40 }, { translateY: -40 }],
      width: 80,
      zIndex: theme.zIndex.base4,
    },
    playerContainer: {
      aspectRatio: 16 / 9,
      backgroundColor: theme.colors.background,
      position: "relative",
    },
    playerContainerError: {
      alignItems: "center",
      aspectRatio: 16 / 9,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: "center",
    },
    primaryActionButton: {
      marginBottom: theme.spacing.md,
    },
    progressBar: {
      backgroundColor: theme.colors.primary,
      height: "100%",
    },
    progressContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 2,
      height: 4,
      marginTop: theme.spacing.sm,
      overflow: "hidden",
      width: "100%",
    },
    recordingNumberBadge: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.borderRadius.full,
      elevation: 2,
      height: theme.spacing.xl,
      justifyContent: "center",
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      width: theme.spacing.xl,
    },
    recordingNumberText: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "bold",
        color: "primary",
      }),
    },
    replayButton: {
      alignItems: "center",
      borderRadius: theme.borderRadius.full,
      height: 80,
      justifyContent: "center",
      left: "50%",
      position: "absolute",
      top: "50%",
      transform: [{ translateX: -40 }, { translateY: -40 }],
      width: 80,
      zIndex: theme.zIndex.base4,
    },
    retryButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    retryText: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "bold",
        color: "onPrimary",
      }),
    },
    scientificName: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      fontStyle: "italic",
      marginTop: theme.spacing.xs,
    },
    slider: {
      backgroundColor: theme.colors.tertiary,
      flex: 1,
      height: theme.spacing.xl,
      marginHorizontal: theme.spacing.sm,
    },
    sliderThumb: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.borderRadius.sm,
      elevation: 2,
      height: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      width: theme.spacing.md,
    },
    speciesAction: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.borderRadius.md,
      flexDirection: "row",
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    speciesActionIcon: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
      marginRight: theme.spacing.sm,
      padding: theme.spacing.xs,
    },
    speciesActionText: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "medium",
        color: "onPrimaryContainer",
      }),
      flex: 1,
    },
    speciesAvatar: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.borderRadius.full,
      elevation: 3,
      height: 64,
      justifyContent: "center",
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      width: 64,
    },
    speciesInfoContainer: {
      flex: 1,
    },
    speciesName: {
      ...createThemedTextStyle(theme, {
        size: "3xl",
        weight: "bold",
        color: "onSurface",
      }),
      lineHeight: 36,
    },
    timeText: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "tertiary",
      }),
      marginLeft: theme.spacing.sm,
    },
    video: {
      flex: 1,
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    videoTouchOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: theme.zIndex.base3,
    },
  });

  const renderVideoControls = () => {
    return (
      <Animated.View style={[styles.controlsContainer, { opacity: controlsOpacity }]}>
        <TouchableOpacity onPress={() => void togglePlayPause()} disabled={!isVideoLoaded}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={theme.colors.tertiary} />
        </TouchableOpacity>

        <Slider
          progress={sliderProgress}
          minimumValue={sliderMin}
          maximumValue={sliderMax}
          onSlidingStart={onSeekStart}
          onSlidingComplete={onSeekComplete}
          thumbWidth={16}
          theme={{
            minimumTrackTintColor: theme.colors.tertiary,
            maximumTrackTintColor: theme.colors.tertiary,
            bubbleBackgroundColor: theme.colors.tertiary,
            bubbleTextColor: theme.colors.onTertiary,
          }}
          containerStyle={styles.slider}
          disable={!isVideoLoaded}
          disableTapEvent
          bubble={(value) => formatTime(value)}
          renderThumb={() => <View style={styles.sliderThumb} />}
        />

        <Text style={styles.timeText}>
          {formatTime(videoPosition)}/{formatTime(videoDuration)}
        </Text>

        <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
          <Ionicons
            name={isVideoFullscreen ? "contract" : "expand"}
            size={24}
            color={theme.colors.tertiary}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderVideoPlayer = () => {
    // Show error only if we're not loading and there's actually an error or no URI
    if (videoUriError) {
      return (
        <View style={styles.playerContainerError}>
          <Ionicons name="alert-circle" size={40} color={theme.colors.error} />
          <Text style={styles.descriptionTextError}>Video source not available</Text>
        </View>
      );
    }

    // Show error if there's a video error
    if (videoError) {
      return (
        <View style={styles.playerContainerError}>
          <Ionicons name="alert-circle" size={40} color={theme.colors.error} />
          <Text style={styles.descriptionTextError}>Error loading video</Text>
        </View>
      );
    }

    return (
      <View style={styles.playerContainer}>
        <VideoView
          ref={videoViewRef}
          player={videoPlayer}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{
            enable: true,
            orientation: "landscape",
            autoExitOnRotate: true,
          }}
          onFullscreenEnter={handleFullscreenEnter}
          onFullscreenExit={handleFullscreenExit}
          allowsPictureInPicture={false}
          allowsVideoFrameAnalysis={false}
        />

        {/* Touch overlay for showing/hiding controls */}
        <TouchableOpacity
          style={styles.videoTouchOverlay}
          onPress={handleVideoPress}
          activeOpacity={1}
        />

        {/* Backdrop overlay that fades with controls */}
        {showControls && (
          <Animated.View
            style={[styles.controlsBackdrop, { opacity: backdropOpacity }]}
            pointerEvents="none"
          />
        )}

        {(showInitialLoading || isVideoUriLoading) && (
          <View style={[styles.videoOverlay, { backgroundColor: theme.colors.backdrop }]}>
            <ActivityIndicator size={36} color={theme.colors.primary} />
          </View>
        )}

        {/* Play button when paused */}
        {isVideoLoaded &&
          !isPlaying &&
          !isVideoEnded &&
          !isSeeking &&
          !showInitialLoading &&
          showControls && (
            <Animated.View style={[styles.playButton, { opacity: controlsOpacity }]}>
              <TouchableOpacity
                onPress={() => void togglePlayPause()}
                activeOpacity={0.8}
                style={styles.fullButtonTouchable}
              >
                <Ionicons name="play" size={40} color="white" style={styles.buttonIcon} />
              </TouchableOpacity>
            </Animated.View>
          )}

        {/* Replay button when video ended */}
        {isVideoLoaded && isVideoEnded && !isSeeking && !showInitialLoading && showControls && (
          <Animated.View style={[styles.replayButton, { opacity: controlsOpacity }]}>
            <TouchableOpacity
              onPress={() => void togglePlayPause()}
              activeOpacity={0.8}
              style={styles.fullButtonTouchable}
            >
              <Ionicons name="refresh" size={40} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Pause button when playing and controls visible */}
        {isVideoLoaded &&
          isPlaying &&
          !isVideoEnded &&
          showControls &&
          !isSeeking &&
          !showInitialLoading && (
            <Animated.View style={[styles.pauseButton, { opacity: controlsOpacity }]}>
              <TouchableOpacity
                onPress={() => void togglePlayPause()}
                activeOpacity={0.8}
                style={styles.fullButtonTouchable}
              >
                <Ionicons name="pause" size={40} color="white" />
              </TouchableOpacity>
            </Animated.View>
          )}

        {/* Bottom controls */}
        {showControls && renderVideoControls()}
      </View>
    );
  };

  if (isLoading) {
    return <LoadingScreen title="Loading Recording..." />;
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
            <TouchableOpacity style={styles.retryButton} onPress={() => void refetch()}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Custom fullscreen UI removed - using native fullscreen

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      {/* Header */}
      <DetailHeader
        title={recording.species?.common_name}
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section - Species Info */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[
              theme.colors.primaryContainer + "20",
              theme.colors.primaryContainer + "10",
              theme.colors.surface + "00",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroBackground}>
              <MaterialCommunityIcons name="bird" size={140} color={theme.colors.primary + "08"} />
            </View>

            <View style={styles.heroContent}>
              <View style={styles.heroTopRow}>
                <View style={styles.speciesAvatar}>
                  <MaterialCommunityIcons name="bird" size={32} color={theme.colors.primary} />
                </View>
                <View style={styles.recordingNumberBadge}>
                  <Text style={styles.recordingNumberText}>#{recording.rec_number}</Text>
                </View>
              </View>

              <View style={styles.speciesInfoContainer}>
                <Text style={styles.speciesName}>{recording.species?.common_name}</Text>
                <Text style={styles.scientificName}>{recording.species?.scientific_name}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Media Player Card */}
        <View style={styles.mediaCard}>
          <View style={[styles.mediaHeader, hasVideo && styles.mediaborderbottom]}>
            <View style={styles.flexOne}>
              <Text style={styles.mediaTitle}>
                {hasVideo ? "sonagram & Audio" : "Audio Recording"}
              </Text>
              <Text style={styles.mediaSubtitle}>Best with Headphones</Text>
            </View>
            <TouchableOpacity style={styles.audioPlayerButton}>
              <MiniAudioPlayer recording={recording} size={44} onPress={stopVideoPlayback} />
            </TouchableOpacity>
          </View>

          {/* Video Player or Audio-only display */}
          {hasVideo && renderVideoPlayer()}
        </View>

        {/* Content Sections */}
        <View style={styles.contentSection}>
          {/* Recording Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardContent}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoHeaderTitle}>Recording Information</Text>
              </View>
              <View>
                {recording.caption && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="document-text"
                      size={16}
                      color={theme.colors.tertiary}
                      style={styles.infoRowIcon}
                    />
                    <View style={styles.infoRowText}>
                      <Text style={styles.infoValue}>{recording.caption}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Ionicons
                    name="location"
                    size={16}
                    color={theme.colors.tertiary}
                    style={styles.infoRowIcon}
                  />
                  <View style={styles.infoRowText}>
                    <Text style={styles.infoValue}>{recording.site_name || "N/A"}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.colors.tertiary}
                    style={styles.infoRowIcon}
                  />
                  <View style={styles.infoRowText}>
                    <Text style={styles.infoValue}>
                      {recording.date_recorded
                        ? new Date(recording.date_recorded.replace(" ", "T")).toLocaleString()
                        : "N/A"}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="person"
                    size={16}
                    color={theme.colors.tertiary}
                    style={styles.infoRowIcon}
                  />
                  <View style={styles.infoRowText}>
                    <Text style={styles.infoValue}>{recording.recorded_by || "N/A"}</Text>
                  </View>
                </View>
                <View style={[styles.infoRow, styles.infoRowLast]}>
                  <Ionicons
                    name="pricetag"
                    size={16}
                    color={theme.colors.tertiary}
                    style={styles.infoRowIcon}
                  />
                  <View style={styles.infoRowText}>
                    <Text style={[styles.infoValue, styles.infoValueMonospace]}>
                      {recording.catalogue_code || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.speciesAction}
                onPress={() =>
                  navigation.navigate("SpeciesDetails", { speciesId: recording.species_id })
                }
                activeOpacity={0.7}
              >
                <View style={styles.speciesActionIcon}>
                  <MaterialCommunityIcons name="bird" size={18} color={theme.colors.onPrimary} />
                </View>
                <Text style={styles.speciesActionText}>View all recordings for this species</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <Button
            leftIcon={
              getDownloadStatus() === "completed"
                ? { name: "trash-outline", color: theme.colors.onError }
                : isPaused
                  ? { name: "play", color: theme.colors.onPrimary }
                  : isDownloading
                    ? { name: "pause", color: theme.colors.onPrimary }
                    : { name: "cloud-download", color: theme.colors.onPrimary }
            }
            onPress={
              getDownloadStatus() === "completed"
                ? handleDeleteDownload
                : isPaused
                  ? handleResumePress
                  : isDownloading
                    ? handlePausePress
                    : handleDownload
            }
            variant={getDownloadStatus() === "completed" ? "destructive" : "primary"}
            size="lg"
            style={styles.primaryActionButton}
            fullWidth
            disabled={false}
          >
            {getDownloadStatus() === "completed"
              ? "Remove Download"
              : isPaused
                ? "Resume Download"
                : isDownloading
                  ? "Pause Download"
                  : hasError
                    ? "Retry Download"
                    : "Download for Offline Use"}
          </Button>

          {/* Download Progress and Status */}
          {(isDownloading || isPaused || hasError) && (
            <>
              {/* Progress Bar */}
              {(isDownloading || isPaused) && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                </View>
              )}

              {/* Status Text and Error Messages */}
              <View style={styles.downloadStatusContainer}>
                <Text style={hasError ? styles.errorText : styles.downloadStatusText}>
                  {isDownloading && `Downloading... ${Math.round(progress * 100)}% complete`}
                  {isPaused && `Paused at ${Math.round(progress * 100)}%`}
                  {hasError && downloadStatus?.error}
                </Text>
              </View>
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
            onPress: () => void confirmDeleteDownload(),
            style: "destructive",
            loading: isDeleting,
          },
        ]}
      />
    </View>
  );
};

export default RecordingDetailsScreen;
