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
import { useThemedStyles } from "../hooks/useThemedStyles"

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
  const { theme, isDarkMode } = useThemedStyles()

  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [audioLoadRetries, setAudioLoadRetries] = useState(0)

  // Dynamic style helpers
  const backButtonBg = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const backgroundPatternColor = isDarkMode
    ? `${theme.colors.primary}08`
    : `${theme.colors.primary}05`;
  const headerDownloadedIndicatorBg = isDarkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)';
  const scientificNameColor = isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const pageReferenceBg = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const pageTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  const playerHeaderBg = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)';
  const loadingAudioTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  const timeTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const controlButtonBg = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const speedTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  const speedLabelColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  const speedOptionBg = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const speedOptionTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  const captionColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  const expandButtonBg = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const sonogramContainerBg = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)';
  const downloadingTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  const disabledDownloadButtonBg = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
  const fullscreenContainerBg = isDarkMode ? '#000000' : '#FFFFFF';
  const closeButtonBg = 'rgba(0, 0, 0, 0.5)';
  const errorTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  const goBackButtonBg = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  // Dynamic color for icons/text
  const cloudDoneColor = isDarkMode ? '#81C784' : '#2E7D32';
  const expandIconColor = '#2E7D32';
  const downloadIconColor = '#FFFFFF';
  const downloadTextColor = '#FFFFFF';
  const playPauseIconColor = '#FFFFFF';
  const loopInactiveColor = '#999999';
  const refreshIconColor = '#FFFFFF';
  const wifiIconColor = '#B00020';

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
  }, [pauseAudio, resetAudio])

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
  }, [recording, isConnected, audioLoadRetries, isDownloaded, isLoadingAudio, loadAudio, getDownloadPath])
  
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

  // Only static values in StyleSheet
  const styles = StyleSheet.create({
    activeControlButton: {
      backgroundColor: theme.colors.primary,
    },
    activeControlText: {},
    audioRetryButton: {
      alignItems: 'center',
      alignSelf: 'center',
      borderRadius: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    audioRetryText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    backButton: {
      borderRadius: 20,
      padding: 8,
    },
    backgroundPattern: {
      bottom: 0,
      left: 0,
      opacity: 0.5,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
    },
    card: {
      borderRadius: 12,
      elevation: 2,
      marginTop: 16,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
    },
    closeButton: {
      borderRadius: 20,
      padding: 8,
      position: 'absolute',
      right: 20,
      top: 50,
      zIndex: 1000,
    },
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: 32,
      paddingHorizontal: 16,
    },
    controlButton: {
      alignItems: 'center',
      borderRadius: 99,
      justifyContent: 'center',
    },
    disabledControlButton: {
      opacity: 0.5,
    },
    downloadButtonContainer: {
      alignItems: 'center',
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      marginHorizontal: 16,
      marginVertical: 16,
      paddingVertical: 12,
    },
    downloadButtonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    downloadedContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      padding: 16,
    },
    downloadedText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    downloadingContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      padding: 16,
    },
    downloadingText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    errorCard: {
      alignItems: 'center',
      borderRadius: 12,
      elevation: 2,
      padding: 24,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      width: '90%',
    },
    errorContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    errorText: {
      fontSize: 14,
      marginBottom: 24,
      textAlign: 'center',
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 16,
    },
    expandButton: {
      borderRadius: 20,
      padding: 8,
    },
    fullscreenContainer: {
      alignItems: 'center',
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 999,
    },
    fullscreenImage: {
      height: width * 0.8,
      width: width,
    },
    goBackButton: {
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      width: '100%',
    },
    goBackText: {
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      alignItems: 'center',
      elevation: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 10,
      paddingHorizontal: 16,
      paddingTop: 45,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 3,
      zIndex: 10,
    },
    headerDownloadedIndicator: {
      alignItems: 'center',
      borderRadius: 4,
      flexDirection: 'row',
      marginLeft: 8,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      marginLeft: 12,
    },
    loadingAudioContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    loadingAudioText: {
      fontSize: 14,
      marginLeft: 8,
    },
    loadingCard: {
      alignItems: 'center',
      borderRadius: 12,
      elevation: 2,
      padding: 24,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      width: '80%',
    },
    loadingContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 16,
      marginTop: 16,
    },
    loopButton: {
      marginHorizontal: 10,
    },
    mainButton: {
      height: 60,
      width: 60,
    },
    offlineText: {
      fontSize: 14,
      marginLeft: 6,
    },
    offlineWarning: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      paddingBottom: 16,
    },
    pageReference: {
      alignSelf: 'flex-start',
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pageText: {
      fontSize: 12,
    },
    playButton: {
      marginHorizontal: 10,
    },
    playerContainer: {
      padding: 16,
    },
    playerHeader: {
      alignItems: 'center',
      height: 120,
      justifyContent: 'center',
      overflow: 'hidden',
      width: '100%',
    },
    primaryControls: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 16,
    },
    retryButton: {
      alignItems: 'center',
      borderRadius: 8,
      marginBottom: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
      width: '100%',
    },
    retryText: {
      fontSize: 16,
      fontWeight: '600',
    },
    scientificName: {
      fontSize: 14,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 8,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 4,
    },
    slider: {
      height: 40,
      width: '100%',
    },
    smallButton: {
      height: 40,
      width: 40,
    },
    sonogramContainer: {
      alignItems: 'center',
      height: 200,
      justifyContent: 'center',
      marginBottom: 16,
      width: '100%',
    },
    sonogramImage: {
      height: '100%',
      width: '100%',
    },
    speciesActionButton: {
      alignItems: 'center',
      borderRadius: 15,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    speciesHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
    },
    speciesInfo: {
      flex: 1,
    },
    speciesName: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    speedButton: {
      marginHorizontal: 10,
    },
    speedControlContainer: {
      marginTop: 8,
    },
    speedLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    speedOption: {
      alignItems: 'center',
      borderRadius: 20,
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    speedOptionText: {
      fontSize: 14,
      fontWeight: '600',
    },
    speedOptions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    speedText: {
      fontSize: 12,
      fontWeight: '700',
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    timeText: {
      fontSize: 12,
    },
    waveformPlaceholder: {
      alignItems: 'center',
      height: '100%',
      justifyContent: 'center',
      width: '100%',
    },
    waveformPreview: {
      height: '100%',
      width: '100%',
    },
  });

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.backgroundPattern, { backgroundColor: backgroundPatternColor }]} />
        <View style={[styles.header, { backgroundColor: theme.colors.surface, shadowOpacity: isDarkMode ? 0.3 : 0.1 }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: backButtonBg }]} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Loading...</Text>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: loadingAudioTextColor }]}>Loading recording details...</Text>
          </View>
        </View>
      </View>
    )
  }

  // Render error state
  if (error || !recording) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.backgroundPattern, { backgroundColor: backgroundPatternColor }]} />
        <View style={[styles.header, { backgroundColor: theme.colors.surface, shadowOpacity: isDarkMode ? 0.3 : 0.1 }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: backButtonBg }]} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Error</Text>
        </View>

        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
            <Text style={[styles.errorTitle, { color: theme.colors.onSurface }]}>Unable to Load Recording</Text>
            <Text style={[styles.errorText, { color: errorTextColor }]}>
              {!isConnected
                ? "You're offline. This recording is not available offline."
                : "Something went wrong. Please try again."}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleRetry}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.goBackButton, { backgroundColor: goBackButtonBg }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.goBackText, { color: theme.colors.onSurface }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isImageFullscreen ? (
        <View style={[styles.fullscreenContainer, { backgroundColor: fullscreenContainerBg }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: closeButtonBg }]} onPress={() => {
            setIsImageFullscreen(false);
          }}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: getSonogramUri() || "https://placeholder.svg?height=400&width=800&text=Sonogram" }}
            style={[styles.fullscreenImage, { height: width * 0.8 }]}
            resizeMode="contain"
          />
        </View>
      ) : (
        <>
          <View style={[styles.backgroundPattern, { backgroundColor: backgroundPatternColor }]} />
          <View style={[styles.header, { backgroundColor: theme.colors.surface, shadowOpacity: isDarkMode ? 0.3 : 0.1 }]}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: backButtonBg }]} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>{recording.title}</Text>
            {isDownloaded(recording.id) && (
              <View style={[styles.headerDownloadedIndicator, { backgroundColor: headerDownloadedIndicatorBg }]}>
                <Ionicons 
                  name="cloud-done" 
                  size={14} 
                  color={cloudDoneColor} 
                />
                <Text style={{ 
                    marginLeft: 4, 
                    fontSize: 12, 
                    color: cloudDoneColor 
                  }}>
                  Downloaded
                </Text>
              </View>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Species Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity
                style={[styles.speciesHeader, { backgroundColor: theme.colors.surface }]}
                onPress={() => {
                  navigation.navigate("SpeciesDetails", { speciesId: recording.species_id })
                }}
              >
                <View style={[styles.speciesInfo, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.speciesName, { color: theme.colors.onSurface }]}>{recording.species?.common_name}</Text>
                  <Text style={[styles.scientificName, { color: scientificNameColor }]}>{recording.species?.scientific_name}</Text>

                  <View style={[styles.pageReference, { backgroundColor: pageReferenceBg }]}>
                    <Text style={[styles.pageText, { color: pageTextColor }]}>Page {recording.book_page_number}</Text>
                  </View>
                </View>
                <View style={[styles.speciesActionButton, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Audio Player Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              {/* Player Visualization */}
              <View style={[styles.playerHeader, { backgroundColor: playerHeaderBg }]}>
                {getSonogramUri() ? (
                  <Image
                    source={{ uri: getSonogramUri() || "https://placeholder.svg?height=200&width=400&text=Sonogram+Not+Available" }}
                    style={[styles.waveformPreview, { height: '100%', width: '100%' }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.waveformPlaceholder, { backgroundColor: theme.colors.surface }]}>
                    <Ionicons name="musical-notes" size={32} color={theme.colors.onSurface} />
                  </View>
                )}
              </View>
              
              {/* Player Controls */}
              <View style={[styles.playerContainer, { backgroundColor: theme.colors.surface }]}>
                {isLoadingAudio ? (
                  <View style={[styles.loadingAudioContainer, { backgroundColor: theme.colors.surface }]}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={[styles.loadingAudioText, { color: loadingAudioTextColor }]}>Loading audio...</Text>
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
                      minimumTrackTintColor={theme.colors.primary}
                      maximumTrackTintColor={isDarkMode ? '#555555' : '#EEEEEE'}
                      thumbTintColor={theme.colors.primary}
                      style={[styles.slider, { backgroundColor: theme.colors.surface }]}
                    />
                    
                    <View style={[styles.timeContainer, { backgroundColor: theme.colors.surface }]}>
                      <Text style={[styles.timeText, { color: timeTextColor }]}>{formatTime(audioState.position)}</Text>
                      <Text style={[styles.timeText, { color: timeTextColor }]}>{formatTime(audioState.duration)}</Text>
                    </View>
                    
                    {/* Primary Controls */}
                    <View style={[styles.primaryControls, { backgroundColor: theme.colors.surface }]}>
                      <TouchableOpacity
                        style={[styles.speedButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => handleSpeedChange(audioState.playbackSpeed === 1 ? 1.5 : 1)}
                        disabled={!isAudioReady}
                      >
                        <View style={[
                          styles.controlButton, 
                          styles.smallButton,
                          { backgroundColor: controlButtonBg },
                          audioState.playbackSpeed !== 1 && styles.activeControlButton,
                          !isAudioReady && styles.disabledControlButton
                        ]}>
                          <Text style={[
                            styles.speedText,
                            { color: speedTextColor },
                            audioState.playbackSpeed !== 1 && styles.activeControlText
                          ]}>
                            {audioState.playbackSpeed}x
                          </Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.playButton, { backgroundColor: theme.colors.surface }]}
                        onPress={handlePlayPause}
                        disabled={!isAudioReady}
                      >
                        <View style={[
                          styles.controlButton, 
                          styles.mainButton,
                          { backgroundColor: controlButtonBg },
                          !isAudioReady && styles.disabledControlButton
                        ]}>
                          <Ionicons
                            name={audioState.isPlaying ? "pause" : "play"}
                            size={36}
                            color={playPauseIconColor}
                          />
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.loopButton, { backgroundColor: theme.colors.surface }]}
                        onPress={handleLoopToggle}
                        disabled={!isAudioReady}
                      >
                        <View style={[
                          styles.controlButton, 
                          styles.smallButton,
                          { backgroundColor: controlButtonBg },
                          audioState.isLooping && styles.activeControlButton,
                          !isAudioReady && styles.disabledControlButton
                        ]}>
                          <Ionicons 
                            name="repeat" 
                            size={20} 
                            color={loopInactiveColor} 
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Speed Options */}
                    <View style={[styles.speedControlContainer, { backgroundColor: theme.colors.surface }]}>
                      <Text style={[styles.speedLabel, { color: speedLabelColor }]}>Playback Speed:</Text>
                      <View style={[styles.speedOptions, { backgroundColor: theme.colors.surface }]}>
                        {([0.5, 1, 1.5, 2] as PlaybackSpeed[]).map((speed) => (
                          <TouchableOpacity
                            key={speed}
                            style={[
                              styles.speedOption, 
                              { backgroundColor: speedOptionBg },
                              audioState.playbackSpeed === speed && styles.activeControlButton,
                              !isAudioReady && styles.disabledControlButton
                            ]}
                            onPress={() => handleSpeedChange(speed)}
                            disabled={!isAudioReady}
                          >
                            <Text style={[
                              styles.speedOptionText, 
                              { color: speedOptionTextColor },
                              audioState.playbackSpeed === speed && styles.activeControlText
                            ]}>
                              {speed}x
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {!isAudioReady && !isLoadingAudio && audioLoadRetries > 0 && (
                      <TouchableOpacity
                        style={[styles.audioRetryButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => setAudioLoadRetries(0)}
                      >
                        <Ionicons name="refresh" size={16} color={refreshIconColor} />
                        <Text style={styles.audioRetryText}>Retry loading audio</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Description Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Description</Text>
              <Text style={[styles.caption, { color: captionColor }]}>{recording.caption}</Text>
            </View>

            {/* Sonogram Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Sonogram</Text>
                {getSonogramUri() && (
                  <TouchableOpacity 
                    style={[styles.expandButton, { backgroundColor: expandButtonBg }]}
                    onPress={() => setIsImageFullscreen(true)}
                  >
                    <Ionicons name="expand" size={20} color={expandIconColor} />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={[styles.sonogramContainer, { backgroundColor: sonogramContainerBg }]}>
                <Image
                  source={{
                    uri: getSonogramUri() || "https://placeholder.svg?height=200&width=400&text=Sonogram+Not+Available",
                  }}
                  style={[styles.sonogramImage, { backgroundColor: theme.colors.surface }]}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Download Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              {getDownloadStatus() === "completed" ? (
                <View style={[styles.downloadedContainer, { backgroundColor: theme.colors.surface }]}>
                  <Ionicons name="cloud-done" size={28} color={cloudDoneColor} />
                  <Text style={[styles.downloadedText, { color: theme.colors.onSurface }]}>Available Offline</Text>
                </View>
              ) : getDownloadStatus() === "downloading" ? (
                <View style={[styles.downloadingContainer, { backgroundColor: theme.colors.surface }]}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.downloadingText, { color: downloadingTextColor }]}>Downloading...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.downloadButtonContainer, { backgroundColor: theme.colors.primary }, !isConnected && { backgroundColor: disabledDownloadButtonBg }]}
                  onPress={handleDownload}
                  disabled={!isConnected}
                >
                  <Ionicons name="cloud-download" size={22} color={downloadIconColor} />
                  <Text style={[styles.downloadButtonText, { color: downloadTextColor }]}>Download for Offline Use</Text>
                </TouchableOpacity>
              )}

              {!isConnected && getDownloadStatus() === "idle" && (
                <View style={[styles.offlineWarning, { backgroundColor: theme.colors.surface }]}>
                  <Ionicons name="wifi" size={16} color={wifiIconColor} />
                  <Text style={[styles.offlineText, { color: theme.colors.onSurface }]}>Connect to download this recording</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  )
}

export default RecordingDetailsScreen