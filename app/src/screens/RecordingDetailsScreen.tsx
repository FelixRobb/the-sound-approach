import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useEventListener } from "expo";
import * as ScreenOrientation from "expo-screen-orientation";
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
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";

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
import { getSonogramVideoUri } from "../lib/mediaUtils";
import { fetchRecordingById } from "../lib/supabase";
import { createThemedTextStyle } from "../lib/theme/typography";
import type { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const RecordingDetailsScreen = () => {
  const { theme } = useEnhancedTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RecordingDetails">>();
  const { downloadRecording, isDownloaded, downloads, deleteDownload } =
    useContext(DownloadContext);
  const { stopPlayback } = useAudio();
  const globalAudioBarHeight = useGlobalAudioBarHeight();

  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

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

  // Controls visibility state
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const backdropOpacity = useRef(new Animated.Value(0.5)).current;

  // Modal states
  const [showDownloadErrorModal, setShowDownloadErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const videoViewRef = useRef(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMountedRef = useRef(true);

  // Add these lines for react-native-awesome-slider
  const sliderProgress = useSharedValue(0);
  const sliderMin = useSharedValue(0);
  const sliderMax = useSharedValue(1); // Default to 1, will be updated when video loads

  const styles = StyleSheet.create({
    audioPlayerContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      flexDirection: "row",
      justifyContent: "space-between",
      overflow: "hidden",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    audioPlayerContainerInner: {
      marginLeft: theme.spacing.md,
    },
    buttonIcon: {
      marginLeft: isPlaying ? 0 : theme.spacing.xs, // Slight adjustment for play icon centering
    },

    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      padding: theme.spacing.md,
      paddingBottom: globalAudioBarHeight,
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
      left: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      position: "absolute",
      right: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: theme.zIndex.base5,
    },
    descriptionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      marginBottom: theme.spacing.md,
      overflow: "hidden",
      padding: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    descriptionHeader: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: theme.spacing.sm,
    },
    descriptionText: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
    },
    descriptionTextError: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: theme.spacing.sm,
    },
    descriptionTitle: {
      ...createThemedTextStyle(theme, {
        size: "xl",
        weight: "bold",
        color: "onSurface",
      }),
      marginLeft: theme.spacing.sm,
    },
    downloadButtonSmall: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.borderRadius.full,
      padding: 8,
    },
    downloadCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      marginBottom: theme.spacing.md,
      overflow: "hidden",
      padding: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
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
    },
    locationContainer: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: theme.spacing.sm,
    },
    locationText: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginLeft: theme.spacing.sm,
    },
    metadataGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    metadataItem: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    metadataLabel: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "bold",
        color: "primary",
      }),
      marginBottom: theme.spacing.xs,
      textTransform: "uppercase",
    },
    metadataValue: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "bold",
        color: "onSurface",
      }),
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
      width: "100%",
    },
    playerContainerError: {
      alignItems: "center",
      aspectRatio: 16 / 9,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: "center",
      width: "100%",
    },
    recordingInfoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      marginBottom: theme.spacing.md,
      overflow: "hidden",
      padding: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    recordingInfoTitle: {
      ...createThemedTextStyle(theme, {
        size: "xl",
        weight: "bold",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.xs,
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
      marginBottom: theme.spacing.xs,
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
    speciesButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.primary,
      borderTopWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      padding: theme.spacing.md,
    },
    speciesButtonText: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "bold",
        color: "onSurface",
      }),
      marginRight: theme.spacing.sm,
    },
    speciesCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      marginBottom: theme.spacing.md,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    speciesHeader: {
      padding: theme.spacing.md,
    },
    speciesName: {
      ...createThemedTextStyle(theme, {
        size: "2xl",
        weight: "bold",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.xs,
    },
    timeText: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginLeft: theme.spacing.sm,
    },
    video: {
      flex: 1,
    },
    videoContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      marginBottom: theme.spacing.md,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    videoHeader: {
      alignItems: "center",
      borderBottomColor: theme.colors.backdrop,
      borderBottomWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
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

  const [sonogramVideoUri, setSonogramVideoUri] = useState<string | null>(null);
  const [isVideoUriLoading, setIsVideoUriLoading] = useState(false);

  // Fetch sonogram video URI
  useEffect(() => {
    if (!recording) {
      setSonogramVideoUri(null);
      setIsVideoUriLoading(false);
      setShowInitialLoading(false);
      return;
    }

    // Start loading immediately when we have a recording
    setIsVideoUriLoading(true);
    setShowInitialLoading(false); // Hide initial loading while fetching URI
    setVideoError(false); // Reset any previous errors

    getSonogramVideoUri(recording)
      .then((uri) => {
        setSonogramVideoUri(uri);
        setIsVideoUriLoading(false);
        // Show initial loading if we got a valid URI
        if (uri) {
          setShowInitialLoading(true);
        }
      })
      .catch(() => {
        setSonogramVideoUri(null);
        setIsVideoUriLoading(false);
        setShowInitialLoading(false);
      });
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
    // Only show initial loading if we have a URI and we're not currently loading the URI
    setShowInitialLoading(!!sonogramVideoUri && !isVideoUriLoading);
    setIsPlaying(false);
    setIsSeeking(false);
    setWasPlayingBeforeSeek(false);
    setIsVideoEnded(false);
  }, [sonogramVideoUri, isVideoUriLoading]);

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

      // Check if video has ended
      if (payload.currentTime >= videoDuration && videoDuration > 0) {
        setIsVideoEnded(true);
      }
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
        hideGlobalAudioBar(); // Hide GlobalAudioBar in fullscreen
      } else {
        StatusBar.setHidden(false);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        showGlobalAudioBar(); // Show GlobalAudioBar when exiting fullscreen
      }
    };

    void handleFullscreenChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoFullscreen]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      StatusBar.setHidden(false);
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleVideoPress = useCallback(() => {
    if (showControls) {
      hideVideoControls();
    } else {
      showVideoControls();
    }
  }, [showControls, hideVideoControls, showVideoControls]);

  const stopVideoPlayback = () => {
    if (!videoPlayer) return;
    videoPlayer.pause();
  };

  const togglePlayPause = () => {
    if (!isVideoLoaded || !videoPlayer) return;

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
          }}
          containerStyle={styles.slider}
          disable={!isVideoLoaded}
          disableTapEvent
          bubble={(value) => formatTime(value)}
          bubbleTextStyle={{
            color: theme.colors.tertiary,
          }}
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
    if (!isVideoUriLoading && !sonogramVideoUri && !videoError) {
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
          contentFit={isVideoFullscreen ? "contain" : "cover"}
          nativeControls={false}
          allowsFullscreen={false}
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
        {showControls && renderVideoControls(false)}
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

  if (isVideoFullscreen) {
    // Exit fullscreen if no video URI available
    if (!sonogramVideoUri) {
      setIsVideoFullscreen(false);
      return null;
    }

    return (
      <View style={styles.fullscreenContainer}>
        <View style={styles.fullscreenHeader}>
          <Text style={styles.fullscreenTitle}>{recording.species?.scientific_name}</Text>
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

        {/* Backdrop overlay that fades with controls */}
        {showControls && (
          <Animated.View
            style={[styles.controlsBackdrop, { opacity: backdropOpacity }]}
            pointerEvents="none"
          />
        )}

        {showInitialLoading && (
          <View style={[styles.fullScreenVideoOverlay, { backgroundColor: theme.colors.backdrop }]}>
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
              onPress={togglePlayPause}
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
                onPress={togglePlayPause}
                activeOpacity={0.8}
                style={styles.fullButtonTouchable}
              >
                <Ionicons name="pause" size={40} color="white" />
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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.speciesCard}>
          <View style={styles.speciesHeader}>
            <Text style={styles.speciesName}>{recording.species?.common_name}</Text>
            <Text style={styles.scientificName}>{recording.species?.scientific_name}</Text>
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

        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <View style={styles.videoContainer}>
          <View style={styles.videoHeader}>
            <Text
              style={createThemedTextStyle(theme, {
                size: "2xl",
                weight: "bold",
                color: "onSurface",
              })}
            >
              Sonogram
            </Text>
            <View style={styles.audioPlayerContainer}>
              <Text
                style={createThemedTextStyle(theme, {
                  size: "lg",
                  weight: "bold",
                  color: "onSurface",
                })}
              >
                Audio
              </Text>
              <View style={styles.audioPlayerContainerInner}>
                <MiniAudioPlayer recording={recording} size={30} onPress={stopVideoPlayback} />
              </View>
            </View>
          </View>
          {renderVideoPlayer()}
        </View>

        {/* Recording Information Card */}
        <View style={styles.recordingInfoCard}>
          <Text style={styles.recordingInfoTitle}>Recording Information</Text>

          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Catalogue Code</Text>
              <Text style={styles.metadataValue}>{recording.catalogue_code}</Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Recording #</Text>
              <Text style={styles.metadataValue}>{recording.rec_number}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.locationText}>{recording.site_name}</Text>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.descriptionCard}>
          <View style={styles.descriptionHeader}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.descriptionTitle}>Description</Text>
          </View>
          <Text style={styles.descriptionText}>{recording.caption}</Text>
        </View>
        <View style={styles.downloadCard}>
          <Button
            leftIcon={
              getDownloadStatus() === "completed"
                ? { name: "trash-outline", color: theme.colors.onPrimary }
                : { name: "cloud-download", color: theme.colors.onPrimary }
            }
            onPress={
              getDownloadStatus() === "completed"
                ? handleDeleteDownload
                : getDownloadStatus() === "downloading"
                  ? undefined
                  : handleDownload
            }
            variant="primary"
            size="lg"
          >
            {getDownloadStatus() === "completed"
              ? "Remove Download"
              : getDownloadStatus() === "downloading"
                ? "Downloading..."
                : "Download for Offline Use"}
          </Button>
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
