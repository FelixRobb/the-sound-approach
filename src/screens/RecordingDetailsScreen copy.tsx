"use client";

import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

import { AudioContext } from "../context/AudioContext";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { fetchRecordingById, supabase } from "../lib/supabase";
import { PlaybackSpeed, RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

// Format time in mm:ss
const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const RecordingDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RecordingDetails">>();
  const { isConnected } = useContext(NetworkContext);
  const { downloadRecording, isDownloaded, getDownloadPath, downloads } =
    useContext(DownloadContext);
  const {
    audioState,
    loadAudio,
    playAudio,
    pauseAudio,
    seekAudio,
    setPlaybackSpeed,
    toggleLooping,
    resetAudio,
  } = useContext(AudioContext);

  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioLoadRetries, setAudioLoadRetries] = useState(0);

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

  // Cleanup function
  useEffect(() => {
    return () => {
      pauseAudio();
      resetAudio();
    };
  }, []);

  // Handle audio loading
  useEffect(() => {
    let isMounted = true;
    let loadAttemptInProgress = false;

    const loadRecordingAudio = async () => {
      // Skip if already loading, no recording, or loading in progress
      if (!recording || isLoadingAudio || loadAttemptInProgress) return;

      loadAttemptInProgress = true;

      try {
        setIsLoadingAudio(true);
        let audioUri = null;

        if (isDownloaded(recording.id)) {
          // Use local file
          audioUri = getDownloadPath(recording.audio_id, true);
        } else if (isConnected) {
          // Use public URL from Supabase
          const { data } = supabase.storage.from("audio").getPublicUrl(`${recording.audio_id}.mp3`);
          audioUri = data?.publicUrl;
        } else {
          // No audio available offline
          setIsLoadingAudio(false);
          loadAttemptInProgress = false;
          return;
        }

        if (!audioUri) {
          setIsLoadingAudio(false);
          loadAttemptInProgress = false;
          return;
        }

        // Direct load without setTimeout
        const success = await loadAudio(audioUri, recording.audio_id || "");

        if (isMounted) {
          if (success) {
            setAudioLoadRetries(0);
          } else {
            // Retry logic - but only if component is still mounted
            if (audioLoadRetries < 2 && isMounted) {
              setAudioLoadRetries((prev) => prev + 1);
            } else if (isMounted) {
              // Show error alert after retries
              Alert.alert("Audio Error", "Failed to load audio file. Please try again later.", [
                { text: "OK" },
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Error in audio loading:", err);
      } finally {
        if (isMounted) {
          setIsLoadingAudio(false);
        }
        loadAttemptInProgress = false;
      }
    };

    // Load audio when recording is available and we have network/local file
    if (recording && (isConnected || isDownloaded(recording.id))) {
      loadRecordingAudio();
    }

    // Clean up function
    return () => {
      isMounted = false;
    };
  }, [
    recording,
    recording?.id ? isDownloaded(recording.id) : false,
    isConnected,
    audioLoadRetries,
  ]);

  // Check if audio is actually loaded
  const isAudioReady = audioState.isLoaded && audioState.currentAudioId === recording?.audio_id;

  // Get download status
  const getDownloadStatus = () => {
    if (!recording) return "idle";

    if (isDownloaded(recording.id)) {
      return "completed";
    }

    return downloads[recording.id]?.status || "idle";
  };

  // Handle download button press
  const handleDownload = async () => {
    if (!recording || !isConnected) return;

    try {
      await downloadRecording(recording);
      // After download is complete, try to load audio again
      setTimeout(() => {
        setAudioLoadRetries(0);
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Download Error", "Failed to download the recording. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  // Handle play/pause button press
  const handlePlayPause = async () => {
    if (!isAudioReady) {
      // If we have recording but audio isn't ready, try loading again
      if (recording && !isLoadingAudio) {
        setAudioLoadRetries(0);
      }
      return;
    }

    try {
      if (audioState.isPlaying) {
        await pauseAudio();
      } else {
        const success = await playAudio();
        if (!success && recording) {
          // Try reloading if play fails
          setAudioLoadRetries(0);
        }
      }
    } catch (error) {
      console.error("Error controlling playback:", error);
    }
  };

  // Handle seek with additional checks
  const handleSeek = async (value: number) => {
    if (!isAudioReady) return;

    try {
      await seekAudio(value);
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  // Handle playback speed change
  const handleSpeedChange = async (speed: PlaybackSpeed) => {
    if (!isAudioReady) return;

    try {
      await setPlaybackSpeed(speed);
    } catch (error) {
      console.error("Error changing speed:", error);
    }
  };

  // Handle loop toggle
  const handleLoopToggle = async () => {
    if (!isAudioReady) return;

    try {
      await toggleLooping();
    } catch (error) {
      console.error("Error toggling loop:", error);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setAudioLoadRetries(0);
    refetch();
  };

  // Get sonogram image URI
  const getSonogramUri = () => {
    if (!recording) return null;

    if (isDownloaded(recording.id)) {
      // Use local file
      return getDownloadPath(recording.sonogram_id, false);
    } else if (isConnected) {
      // Use public URL from Supabase
      const { data } = supabase.storage
        .from("sonograms")
        .getPublicUrl(`${recording.sonogram_id}.png`);
      return data?.publicUrl || null;
    }

    return null;
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Loading recording details...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Render error state
  if (error || !recording) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>

        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={60} color="#B00020" />
            <Text style={styles.errorTitle}>Unable to Load Recording</Text>
            <Text style={styles.errorText}>
              {!isConnected
                ? "You're offline. This recording is not available offline."
                : "Something went wrong. Please try again."}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
              <Text style={styles.goBackText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isImageFullscreen ? (
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setIsImageFullscreen(false);
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{
              uri: getSonogramUri() || "https://placeholder.svg?height=400&width=800&text=Sonogram",
            }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#2E7D32" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{recording.title}</Text>
            {isDownloaded(recording.id) && (
              <View style={styles.downloadedIndicator}>
                <Ionicons name="cloud-done" size={16} color="#2E7D32" />
              </View>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Species Card */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.speciesHeader}
                onPress={() => {
                  navigation.navigate("SpeciesDetails", { speciesId: recording.species_id });
                }}
              >
                <View style={styles.speciesInfo}>
                  <Text style={styles.speciesName}>{recording.species?.common_name}</Text>
                  <Text style={styles.scientificName}>{recording.species?.scientific_name}</Text>

                  <View style={styles.pageReference}>
                    <Text style={styles.pageText}>Page {recording.book_page_number}</Text>
                  </View>
                </View>
                <View style={styles.speciesActionButton}>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Audio Player Card */}
            <View style={styles.card}>
              {/* Player Visualization */}
              <View style={styles.playerHeader}>
                {getSonogramUri() ? (
                  <Image
                    source={{
                      uri:
                        getSonogramUri() ||
                        "https://placeholder.svg?height=200&width=400&text=Sonogram+Not+Available",
                    }}
                    style={styles.waveformPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.waveformPlaceholder}>
                    <Ionicons name="musical-notes" size={32} color="#E0E0E0" />
                  </View>
                )}
              </View>

              {/* Player Controls */}
              <View style={styles.playerContainer}>
                {isLoadingAudio ? (
                  <View style={styles.loadingAudioContainer}>
                    <ActivityIndicator size="small" color="#2E7D32" />
                    <Text style={styles.loadingAudioText}>Loading audio...</Text>
                  </View>
                ) : (
                  <>
                    {/* Playback Progress */}
                    <Slider
                      value={audioState.position}
                      minimumValue={0}
                      maximumValue={audioState.duration || 1}
                      onSlidingComplete={handleSeek}
                      disabled={!isAudioReady}
                      minimumTrackTintColor="#2E7D32"
                      maximumTrackTintColor="#EEEEEE"
                      thumbTintColor="#2E7D32"
                      style={styles.slider}
                    />

                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{formatTime(audioState.position)}</Text>
                      <Text style={styles.timeText}>{formatTime(audioState.duration)}</Text>
                    </View>

                    {/* Primary Controls */}
                    <View style={styles.primaryControls}>
                      <TouchableOpacity
                        style={styles.speedButton}
                        onPress={() => handleSpeedChange(audioState.playbackSpeed === 1 ? 1.5 : 1)}
                        disabled={!isAudioReady}
                      >
                        <View
                          style={[
                            styles.controlButton,
                            styles.smallButton,
                            audioState.playbackSpeed !== 1 && styles.activeControlButton,
                            !isAudioReady && styles.disabledControlButton,
                          ]}
                        >
                          <Text
                            style={[
                              styles.speedText,
                              audioState.playbackSpeed !== 1 && styles.activeControlText,
                            ]}
                          >
                            {audioState.playbackSpeed}x
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={handlePlayPause}
                        disabled={!isAudioReady}
                      >
                        <View
                          style={[
                            styles.controlButton,
                            styles.mainButton,
                            !isAudioReady && styles.disabledControlButton,
                          ]}
                        >
                          <Ionicons
                            name={audioState.isPlaying ? "pause" : "play"}
                            size={36}
                            color="#FFFFFF"
                          />
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.loopButton}
                        onPress={handleLoopToggle}
                        disabled={!isAudioReady}
                      >
                        <View
                          style={[
                            styles.controlButton,
                            styles.smallButton,
                            audioState.isLooping && styles.activeControlButton,
                            !isAudioReady && styles.disabledControlButton,
                          ]}
                        >
                          <Ionicons
                            name="repeat"
                            size={20}
                            color={audioState.isLooping ? "#FFFFFF" : "#999999"}
                          />
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Speed Options */}
                    <View style={styles.speedControlContainer}>
                      <Text style={styles.speedLabel}>Playback Speed:</Text>
                      <View style={styles.speedOptions}>
                        {([0.5, 1, 1.5, 2] as PlaybackSpeed[]).map((speed) => (
                          <TouchableOpacity
                            key={speed}
                            style={[
                              styles.speedOption,
                              audioState.playbackSpeed === speed && styles.activeSpeedOption,
                              !isAudioReady && styles.disabledOption,
                            ]}
                            onPress={() => handleSpeedChange(speed)}
                            disabled={!isAudioReady}
                          >
                            <Text
                              style={[
                                styles.speedOptionText,
                                audioState.playbackSpeed === speed && styles.activeSpeedOptionText,
                              ]}
                            >
                              {speed}x
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {!isAudioReady && !isLoadingAudio && audioLoadRetries > 0 && (
                      <TouchableOpacity
                        style={styles.audioRetryButton}
                        onPress={() => setAudioLoadRetries(0)}
                      >
                        <Ionicons name="refresh" size={16} color="#FFFFFF" />
                        <Text style={styles.audioRetryText}>Retry loading audio</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Description Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.caption}>{recording.caption}</Text>
            </View>

            {/* Sonogram Card */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sonogram</Text>
                {getSonogramUri() && (
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setIsImageFullscreen(true)}
                  >
                    <Ionicons name="expand" size={20} color="#2E7D32" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.sonogramContainer}>
                <Image
                  source={{
                    uri:
                      getSonogramUri() ||
                      "https://placeholder.svg?height=200&width=400&text=Sonogram+Not+Available",
                  }}
                  style={styles.sonogramImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Download Card */}
            <View style={styles.card}>
              {getDownloadStatus() === "completed" ? (
                <View style={styles.downloadedContainer}>
                  <Ionicons name="cloud-done" size={28} color="#2E7D32" />
                  <Text style={styles.downloadedText}>Available Offline</Text>
                </View>
              ) : getDownloadStatus() === "downloading" ? (
                <View style={styles.downloadingContainer}>
                  <ActivityIndicator size="small" color="#2E7D32" />
                  <Text style={styles.downloadingText}>Downloading...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.downloadButtonContainer,
                    !isConnected && styles.disabledDownloadButton,
                  ]}
                  onPress={handleDownload}
                  disabled={!isConnected}
                >
                  <Ionicons name="cloud-download" size={22} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download for Offline Use</Text>
                </TouchableOpacity>
              )}

              {!isConnected && getDownloadStatus() === "idle" && (
                <View style={styles.offlineWarning}>
                  <Ionicons name="wifi" size={16} color="#B00020" />
                  <Text style={styles.offlineText}>Connect to download this recording</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  activeControlButton: {
    backgroundColor: "#2E7D32",
  },
  activeControlText: {
    color: "#FFFFFF",
  },
  activeSpeedOption: {
    backgroundColor: "#2E7D32",
  },
  activeSpeedOptionText: {
    color: "#FFFFFF",
  },
  audioRetryButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  audioRetryText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginRight: 12,
    width: 40,
  },
  caption: {
    color: "#333333",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 3,
    marginBottom: 16,
    overflow: "hidden",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    top: 40,
    width: 40,
    zIndex: 20,
  },
  container: {
    backgroundColor: "#F5F7FA",
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 30,
    justifyContent: "center",
  },
  disabledControlButton: {
    backgroundColor: "#E0E0E0",
  },
  disabledDownloadButton: {
    backgroundColor: "#CCCCCC",
  },
  disabledOption: {
    opacity: 0.5,
  },
  downloadButtonContainer: {
    alignItems: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  downloadedContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
  },
  downloadedIndicator: {
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: 16,
    marginLeft: 8,
    padding: 8,
  },
  downloadedText: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  downloadingContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
  },
  downloadingText: {
    color: "#2E7D32",
    fontSize: 16,
    marginLeft: 12,
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 4,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    width: width * 0.8,
  },
  errorContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: "#666666",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: "center",
  },
  errorTitle: {
    color: "#B00020",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
  },
  expandButton: {
    padding: 4,
  },
  fullscreenContainer: {
    backgroundColor: "black",
    flex: 1,
    zIndex: 10,
  },
  fullscreenImage: {
    flex: 1,
  },
  goBackButton: {
    alignItems: "center",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginRight: 12,
    width: 40,
  },
  goBackText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "bold",
  },
  header: {
    alignItems: "center",
    backgroundColor: "white",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    flexDirection: "row",
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    color: "#333333",
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingAudioContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 24,
  },
  loadingAudioText: {
    color: "#666666",
    fontSize: 14,
    marginLeft: 8,
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 4,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    width: width * 0.8,
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: "#666666",
    fontSize: 16,
    marginTop: 16,
  },
  loopButton: {
    marginLeft: 24,
  },
  mainButton: {
    backgroundColor: "#2E7D32",
    height: 72,
    width: 72,
  },
  offlineText: {
    color: "#B00020",
    fontSize: 14,
    marginLeft: 6,
  },
  offlineWarning: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  pageReference: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pageText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "500",
  },
  playButton: {
    alignItems: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 100,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  playerContainer: {
    borderRadius: 8,
  },
  playerHeader: {
    borderRadius: 12,
    height: 80,
    marginBottom: 16,
    overflow: "hidden",
  },
  primaryControls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
  },
  scientificName: {
    color: "#666666",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 8,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#2E7D32",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  slider: {
    height: 40,
    marginBottom: 2,
  },
  smallButton: {
    backgroundColor: "#F5F5F5",
    height: 44,
    width: 44,
  },
  sonogramContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    overflow: "hidden",
  },
  sonogramImage: {
    height: 200,
    width: "100%",
  },
  speciesActionButton: {
    alignItems: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  speciesHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    color: "#2E7D32",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  speedButton: {
    marginRight: 24,
  },
  speedControlContainer: {
    marginBottom: 8,
  },
  speedLabel: {
    color: "#666666",
    fontSize: 14,
    marginBottom: 8,
  },
  speedOption: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
  },
  speedOptionText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "500",
  },
  speedOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  speedText: {
    color: "#999999",
    fontSize: 14,
    fontWeight: "bold",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  timeText: {
    color: "#666666",
    fontSize: 14,
  },
  waveformPlaceholder: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  waveformPreview: {
    height: "100%",
    width: "100%",
  },
});

export default RecordingDetailsScreen;
