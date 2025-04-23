"use client"

import React from "react"
import { useState, useEffect, useContext, useRef } from "react"
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from "react-native"
import { Appbar, Button, ActivityIndicator } from "react-native-paper"
import Slider from '@react-native-community/slider'
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"
import { fetchRecordingById } from "../lib/supabase"
import { NetworkContext } from "../context/NetworkContext"
import { DownloadContext } from "../context/DownloadContext"
import { AudioContext } from "../context/AudioContext"
import { supabase } from "../lib/supabase"

// Format time in mm:ss
const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

const RecordingDetailsScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { isConnected } = useContext(NetworkContext)
  const { downloadRecording, isDownloaded, getDownloadPath, downloads } = useContext(DownloadContext)
  const { audioState, loadAudio, playAudio, pauseAudio, seekAudio, setPlaybackSpeed, toggleLooping, resetAudio } =
    useContext(AudioContext)

  // @ts-ignore - Route params typing
  const { recordingId } = route.params

  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [audioLoadRetries, setAudioLoadRetries] = useState(0)

  // Fetch recording details
  const {
    data: recording,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["recording", recordingId],
    queryFn: () => fetchRecordingById(recordingId),
  })

  // Cleanup function
  useEffect(() => {
    return () => {
      pauseAudio()
      resetAudio()
    }
  }, [])

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
          console.log("Using local audio file:", audioUri);
        } else if (isConnected) {
          // Use public URL from Supabase
          const { data } = supabase.storage.from("audio").getPublicUrl(`${recording.audio_id}.mp3`);
          audioUri = data?.publicUrl;
          console.log("Using remote audio URL:", audioUri);
        } else {
          // No audio available offline
          console.log("No audio available offline");
          setIsLoadingAudio(false);
          loadAttemptInProgress = false;
          return;
        }

        if (!audioUri) {
          console.log("No valid audio URI found");
          setIsLoadingAudio(false);
          loadAttemptInProgress = false;
          return;
        }

        console.log("Attempting to load audio...");
        // Direct load without setTimeout
        const success = await loadAudio(audioUri, recording.audio_id || '');

        if (isMounted) {
          if (success) {
            console.log("Audio loaded successfully");
            setAudioLoadRetries(0);
          } else {
            console.log("Audio failed to load");

            // Retry logic - but only if component is still mounted
            if (audioLoadRetries < 2 && isMounted) {
              setAudioLoadRetries(prev => prev + 1);
            } else if (isMounted) {
              // Show error alert after retries
              Alert.alert(
                "Audio Error",
                "Failed to load audio file. Please try again later.",
                [{ text: "OK" }]
              );
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
  }, [recording, recording?.id ? isDownloaded(recording.id) : false, isConnected, audioLoadRetries]);
  // Check if audio is actually loaded
  const isAudioReady = audioState.isLoaded && audioState.currentAudioId === recording?.audio_id

  // Get download status
  const getDownloadStatus = () => {
    if (!recording) return "idle"

    if (isDownloaded(recording.id)) {
      return "completed"
    }

    return downloads[recording.id]?.status || "idle"
  }

  // Handle download button press
  const handleDownload = async () => {
    if (!recording || !isConnected) return

    try {
      await downloadRecording(recording)
      // After download is complete, try to load audio again
      setTimeout(() => {
        setAudioLoadRetries(0)
      }, 1000)
    } catch (error) {
      console.error("Download error:", error)
      Alert.alert(
        "Download Error",
        "Failed to download the recording. Please try again.",
        [{ text: "OK" }]
      )
    }
  }

  // Handle play/pause button press
  const handlePlayPause = async () => {
    if (!isAudioReady) {
      console.log("Audio not ready for playback")

      // If we have recording but audio isn't ready, try loading again
      if (recording && !isLoadingAudio) {
        setAudioLoadRetries(0)
      }
      return
    }

    try {
      if (audioState.isPlaying) {
        const success = await pauseAudio()
        if (!success) {
          console.log("Failed to pause audio")
        }
      } else {
        const success = await playAudio()
        if (!success) {
          console.log("Failed to play audio")

          // Try reloading if play fails
          if (recording) {
            setAudioLoadRetries(0)
          }
        }
      }
    } catch (error) {
      console.error("Error controlling playback:", error)
    }
  }

  // Handle seek with additional checks
  const handleSeek = async (value: number) => {
    if (!isAudioReady) return

    try {
      const success = await seekAudio(value)
      if (!success) {
        console.log("Seek operation failed")
      }
    } catch (error) {
      console.error("Error seeking:", error)
    }
  }

  // Handle playback speed change
  const handleSpeedChange = async (speed: 0.5 | 1 | 1.5 | 2) => {
    if (!isAudioReady) return

    try {
      const success = await setPlaybackSpeed(speed)
      if (!success) {
        console.log("Failed to change playback speed")
      }
    } catch (error) {
      console.error("Error changing speed:", error)
    }
  }

  // Handle loop toggle
  const handleLoopToggle = async () => {
    if (!isAudioReady) return

    try {
      const success = await toggleLooping()
      if (!success) {
        console.log("Failed to toggle looping")
      }
    } catch (error) {
      console.error("Error toggling loop:", error)
    }
  }

  // Handle retry
  const handleRetry = () => {
    setAudioLoadRetries(0)
    refetch()
  }

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Loading..." />
        </Appbar.Header>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading recording details...</Text>
        </View>
      </View>
    )
  }

  // Render error state
  if (error || !recording) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Error" />
        </Appbar.Header>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#B00020" />
          <Text style={styles.errorText}>
            {!isConnected
              ? "You're offline. This recording is not available offline."
              : "Something went wrong. Please try again."}
          </Text>
          <Button mode="contained" onPress={handleRetry} style={styles.backButton}>
            Retry
          </Button>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </View>
    )
  }

  // Get sonogram image URI
  const getSonogramUri = () => {
    if (!recording) return null

    if (isDownloaded(recording.id)) {
      // Use local file
      return getDownloadPath(recording.sonogram_id, false)
    } else if (isConnected) {
      // Use public URL from Supabase
      const { data } = supabase.storage.from("sonograms").getPublicUrl(`${recording.sonogram_id}.png`)
      return data?.publicUrl || null
    }

    return null
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={recording.title} />
      </Appbar.Header>

      {isImageFullscreen ? (
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setIsImageFullscreen(false)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: getSonogramUri() || "https://placeholder.svg?height=400&width=800&text=Sonogram" }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            onPress={() => {
              // @ts-ignore - Navigation typing issue
              navigation.navigate("SpeciesDetails", { speciesId: recording.species_id })
            }}
          >
            <Text style={styles.speciesName}>{recording.species?.common_name}</Text>
            <Text style={styles.scientificName}>{recording.species?.scientific_name}</Text>
          </TouchableOpacity>

          <View style={styles.pageReference}>
            <Ionicons name="book-outline" size={16} color="#666666" />
            <Text style={styles.pageText}>Page {recording.book_page_number}</Text>
          </View>

          <Text style={styles.caption}>{recording.caption}</Text>

          <View style={styles.playerContainer}>
            {isLoadingAudio ? (
              <View style={styles.loadingAudioContainer}>
                <ActivityIndicator size="small" color="#2E7D32" />
                <Text style={styles.loadingAudioText}>Loading audio...</Text>
              </View>
            ) : (
              <>
                <View style={styles.playerControls}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={handlePlayPause}
                    disabled={!isAudioReady}
                  >
                    <Ionicons
                      name={audioState.isPlaying ? "pause-circle" : "play-circle"}
                      size={64}
                      color={isAudioReady ? "#2E7D32" : "#CCCCCC"}
                    />
                  </TouchableOpacity>

                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(audioState.position)}</Text>
                    <Text style={styles.timeText}>{formatTime(audioState.duration)}</Text>
                  </View>
                </View>

                <Slider
                  value={audioState.position}
                  minimumValue={0}
                  maximumValue={audioState.duration || 1}
                  onSlidingComplete={handleSeek}
                  disabled={!isAudioReady}
                  minimumTrackTintColor="#2E7D32"
                  maximumTrackTintColor="#CCCCCC"
                  thumbTintColor="#2E7D32"
                  style={styles.slider}
                />

                <View style={styles.playerOptions}>
                  <View style={styles.speedOptions}>
                    <Text style={styles.optionLabel}>Speed:</Text>
                    {[0.5, 1, 1.5, 2].map((speed) => (
                      <TouchableOpacity
                        key={speed}
                        style={[styles.speedButton, audioState.playbackSpeed === speed && styles.activeSpeedButton]}
                        onPress={() => handleSpeedChange(speed as 0.5 | 1 | 1.5 | 2)}
                        disabled={!isAudioReady}
                      >
                        <Text style={[styles.speedText, audioState.playbackSpeed === speed && styles.activeSpeedText]}>
                          {speed}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.loopButton, audioState.isLooping && styles.activeLoopButton]}
                    onPress={handleLoopToggle}
                    disabled={!isAudioReady}
                  >
                    <Ionicons name="repeat" size={20} color={audioState.isLooping ? "#FFFFFF" : "#666666"} />
                    <Text style={[styles.loopText, audioState.isLooping && styles.activeLoopText]}>Loop</Text>
                  </TouchableOpacity>
                </View>

                {!isAudioReady && !isLoadingAudio && audioLoadRetries > 0 && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => setAudioLoadRetries(0)}
                  >
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <Text style={styles.retryText}>Retry loading audio</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View style={styles.sonogramContainer}>
            <Text style={styles.sectionTitle}>Sonogram</Text>
            <TouchableOpacity onPress={() => setIsImageFullscreen(true)} disabled={!getSonogramUri()}>
              <Image
                source={{
                  uri: getSonogramUri() || "https://placeholder.svg?height=200&width=400&text=Sonogram+Not+Available",
                }}
                style={styles.sonogramImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.downloadContainer}>
            {getDownloadStatus() === "completed" ? (
              <Button mode="outlined" icon="check" disabled style={styles.downloadButton}>
                Downloaded
              </Button>
            ) : getDownloadStatus() === "downloading" ? (
              <Button mode="outlined" loading disabled style={styles.downloadButton}>
                Downloading...
              </Button>
            ) : (
              <Button
                mode="contained"
                icon="download"
                onPress={handleDownload}
                disabled={!isConnected}
                style={styles.downloadButton}
              >
                Download for Offline Use
              </Button>
            )}

            {!isConnected && getDownloadStatus() === "idle" && (
              <Text style={styles.offlineText}>You're offline. Connect to download this recording.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 16,
  },
  speciesName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#666666",
    marginBottom: 8,
  },
  pageReference: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  pageText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 4,
  },
  caption: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  playerContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  playButton: {
    marginRight: 16,
  },
  timeContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 14,
    color: "#666666",
  },
  slider: {
    marginBottom: 16,
  },
  playerOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  speedOptions: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 14,
    color: "#666666",
    marginRight: 8,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "#EEEEEE",
  },
  activeSpeedButton: {
    backgroundColor: "#2E7D32",
  },
  speedText: {
    fontSize: 12,
    color: "#666666",
  },
  activeSpeedText: {
    color: "#FFFFFF",
  },
  loopButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#EEEEEE",
  },
  activeLoopButton: {
    backgroundColor: "#2E7D32",
  },
  loopText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 4,
  },
  activeLoopText: {
    color: "#FFFFFF",
  },
  sonogramContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sonogramImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  downloadContainer: {
    marginBottom: 32,
  },
  downloadButton: {
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 14,
    color: "#B00020",
    textAlign: "center",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    marginTop: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  retryText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
  },
  loadingAudioContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  loadingAudioText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666666",
  },
})

export default RecordingDetailsScreen
