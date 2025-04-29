"use client"

import React from "react"
import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import Slider from '@react-native-community/slider'
import { ActivityIndicator } from "react-native-paper"
import { fetchRecordingById } from "../lib/supabase"
import { NetworkContext } from "../context/NetworkContext"
import { DownloadContext } from "../context/DownloadContext"
import { AudioContext } from "../context/AudioContext"
import { supabase } from "../lib/supabase"
import { PlaybackSpeed, RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
const { width } = Dimensions.get("window")

// Format time in mm:ss
const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

const RecordingDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, "RecordingDetails">>()
  const { isConnected } = useContext(NetworkContext)
  const { downloadRecording, isDownloaded, getDownloadPath, downloads } = useContext(DownloadContext)
  const { audioState, loadAudio, playAudio, pauseAudio, seekAudio, setPlaybackSpeed, toggleLooping, resetAudio } =
    useContext(AudioContext)

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
    queryKey: ["recording", route.params.recordingId],
    queryFn: () => fetchRecordingById(route.params.recordingId),
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
    let isMounted = true
    let loadAttemptInProgress = false

    const loadRecordingAudio = async () => {
      // Skip if already loading, no recording, or loading in progress
      if (!recording || isLoadingAudio || loadAttemptInProgress) return

      loadAttemptInProgress = true

      try {
        setIsLoadingAudio(true)
        let audioUri = null

        if (isDownloaded(recording.id)) {
          // Use local file
          audioUri = getDownloadPath(recording.audio_id, true)
        } else if (isConnected) {
          // Use public URL from Supabase
          const { data } = supabase.storage.from("audio").getPublicUrl(`${recording.audio_id}.mp3`)
          audioUri = data?.publicUrl
        } else {
          // No audio available offline
          setIsLoadingAudio(false)
          loadAttemptInProgress = false
          return
        }

        if (!audioUri) {
          setIsLoadingAudio(false)
          loadAttemptInProgress = false
          return
        }

        // Direct load without setTimeout
        const success = await loadAudio(audioUri, recording.audio_id || '')

        if (isMounted) {
          if (success) {
            setAudioLoadRetries(0)
          } else {
            // Retry logic - but only if component is still mounted
            if (audioLoadRetries < 2 && isMounted) {
              setAudioLoadRetries(prev => prev + 1)
            } else if (isMounted) {
              // Show error alert after retries
              Alert.alert(
                "Audio Error",
                "Failed to load audio file. Please try again later.",
                [{ text: "OK" }]
              )
            }
          }
        }
      } catch (err) {
        console.error("Error in audio loading:", err)
      } finally {
        if (isMounted) {
          setIsLoadingAudio(false)
        }
        loadAttemptInProgress = false
      }
    }

    // Load audio when recording is available and we have network/local file
    if (recording && (isConnected || isDownloaded(recording.id))) {
      loadRecordingAudio()
    }

    // Clean up function
    return () => {
      isMounted = false
    }
  }, [recording, recording?.id ? isDownloaded(recording.id) : false, isConnected, audioLoadRetries])
  
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
      // If we have recording but audio isn't ready, try loading again
      if (recording && !isLoadingAudio) {
        setAudioLoadRetries(0)
      }
      return
    }

    try {
      if (audioState.isPlaying) {
        await pauseAudio()
      } else {
        const success = await playAudio()
        if (!success && recording) {
          // Try reloading if play fails
          setAudioLoadRetries(0)
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
      await seekAudio(value)
    } catch (error) {
      console.error("Error seeking:", error)
    }
  }

  // Handle playback speed change
  const handleSpeedChange = async (speed: PlaybackSpeed) => {
    if (!isAudioReady) return

    try {
      await setPlaybackSpeed(speed)
    } catch (error) {
      console.error("Error changing speed:", error)
    }
  }

  // Handle loop toggle
  const handleLoopToggle = async () => {
    if (!isAudioReady) return

    try {
      await toggleLooping()
    } catch (error) {
      console.error("Error toggling loop:", error)
    }
  }

  // Handle retry
  const handleRetry = () => {
    setAudioLoadRetries(0)
    refetch()
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

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
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
    )
  }

  // Render error state
  if (error || !recording) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
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
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.goBackText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {isImageFullscreen ? (
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => {
            setIsImageFullscreen(false);
          }}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: getSonogramUri() || "https://placeholder.svg?height=400&width=800&text=Sonogram" }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
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
                  navigation.navigate("SpeciesDetails", { speciesId: recording.species_id })
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
                    source={{ uri: getSonogramUri() || "https://placeholder.svg?height=200&width=400&text=Sonogram+Not+Available" }}
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
                        <View style={[
                          styles.controlButton, 
                          styles.smallButton,
                          audioState.playbackSpeed !== 1 && styles.activeControlButton,
                          !isAudioReady && styles.disabledControlButton
                        ]}>
                          <Text style={[
                            styles.speedText,
                            audioState.playbackSpeed !== 1 && styles.activeControlText
                          ]}>
                            {audioState.playbackSpeed}x
                          </Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={handlePlayPause}
                        disabled={!isAudioReady}
                      >
                        <View style={[
                          styles.controlButton, 
                          styles.mainButton,
                          !isAudioReady && styles.disabledControlButton
                        ]}>
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
                        <View style={[
                          styles.controlButton, 
                          styles.smallButton,
                          audioState.isLooping && styles.activeControlButton,
                          !isAudioReady && styles.disabledControlButton
                        ]}>
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
                              !isAudioReady && styles.disabledOption
                            ]}
                            onPress={() => handleSpeedChange(speed)}
                            disabled={!isAudioReady}
                          >
                            <Text style={[
                              styles.speedOptionText, 
                              audioState.playbackSpeed === speed && styles.activeSpeedOptionText
                            ]}>
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
                    uri: getSonogramUri() || "https://placeholder.svg?height=200&width=400&text=Sonogram+Not+Available",
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
                  style={[styles.downloadButtonContainer, !isConnected && styles.disabledDownloadButton]}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    flex: 1,
  },
  downloadedIndicator: {
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    padding: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    marginBottom: 16,
    padding: 16,
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666666",
    marginBottom: 8,
  },
  pageReference: {
    marginTop: 8,
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "500",
  },
  speciesActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2E7D32",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2E7D32",
  },
  expandButton: {
    padding: 4,
  },
  caption: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  playerHeader: {
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  waveformPreview: {
    width: "100%",
    height: "100%",
  },
  waveformPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  playerContainer: {
    borderRadius: 8,
  },
  slider: {
    marginBottom: 2,
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 14,
    color: "#666666",
  },
  primaryControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  speedButton: {
    marginRight: 24,
  },
  loopButton: {
    marginLeft: 24,
  },
  controlButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 30,
  },
  smallButton: {
    width: 44,
    height: 44,
    backgroundColor: "#F5F5F5",
  },
  mainButton: {
    width: 72,
    height: 72,
    backgroundColor: "#2E7D32",
  },
  activeControlButton: {
    backgroundColor: "#2E7D32",
  },
  disabledControlButton: {
    backgroundColor: "#E0E0E0",
  },
  speedText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999999",
  },
  activeControlText: {
    color: "#FFFFFF",
  },
  speedControlContainer: {
    marginBottom: 8,
  },
  speedLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  speedOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  speedOption: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: "center",
  },
  activeSpeedOption: {
    backgroundColor: "#2E7D32",
  },
  disabledOption: {
    opacity: 0.5,
  },
  speedOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  activeSpeedOptionText: {
    color: "#FFFFFF",
  },
  sonogramContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  sonogramImage: {
    width: "100%",
    height: 200,
  },
  downloadedContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  downloadedText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#2E7D32",
  },
  downloadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  downloadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#2E7D32",
  },
  downloadButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledDownloadButton: {
    backgroundColor: "#CCCCCC",
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  offlineWarning: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  offlineText: {
    fontSize: 14,
    color: "#B00020",
    marginLeft: 6,
  },
  audioRetryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    alignSelf: "center",
  },
  audioRetryText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: width * 0.8,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  loadingAudioContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  loadingAudioText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: width * 0.8,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#B00020",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    alignSelf: 'center',
  },
  retryText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "black",
    zIndex: 10,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  fullscreenImage: {
    flex: 1,
  },
  goBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    marginRight: 12,
  },
  goBackText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2E7D32",
  },
})

export default RecordingDetailsScreen