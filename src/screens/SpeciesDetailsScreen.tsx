"use client"

import { useContext } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert } from "react-native"
import { ActivityIndicator } from "react-native-paper"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"
import { fetchRecordingsBySpecies } from "../lib/supabase"
import { NetworkContext } from "../context/NetworkContext"
import { DownloadContext } from "../context/DownloadContext"
import { AudioContext } from "../context/AudioContext"
import { ThemeContext } from "../context/ThemeContext"
import { useThemedStyles } from "../hooks/useThemedStyles"
import { supabase } from "../lib/supabase"
import { RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

const { width } = Dimensions.get("window")

const SpeciesDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, "SpeciesDetails">>()
  const { isConnected } = useContext(NetworkContext)
  const { isDownloaded, getDownloadPath } = useContext(DownloadContext)
  const { loadAudio, playAudio, pauseAudio, audioState } = useContext(AudioContext)
  const { isDarkMode } = useContext(ThemeContext)
  const { theme } = useThemedStyles()

  const { speciesId } = route.params

  // Fetch recordings for this species
  const {
    data: recordings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["species-recordings", speciesId],
    queryFn: () => fetchRecordingsBySpecies(speciesId),
  })

  // Create styles with theme support
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backgroundPattern: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDarkMode ? 
        `${theme.colors.primary}08` : // Very transparent primary color
        `${theme.colors.primary}05`,
      opacity: 0.6,
    },
    header: {
      backgroundColor: theme.colors.surface,
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(46, 125, 50, 0.1)',
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.onSurface,
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.3 : 0.22,
      shadowRadius: 2.22,
      marginBottom: 16,
      padding: 16,
    },
    speciesHeader: {
      marginBottom: 16,
    },
    speciesName: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.primary,
      marginBottom: 4,
    },
    scientificName: {
      fontSize: 16,
      fontStyle: "italic",
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#666666',
    },
    imageContainer: {
      height: 200,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
    },
    speciesImage: {
      width: "100%",
      height: "100%",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.primary,
      flex: 1,
    },
    recordingCountBadge: {
      backgroundColor: isDarkMode ? 
        `${theme.colors.primary}20` :
        `${theme.colors.primary}10`,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    recordingCountText: {
      color: theme.colors.primary,
      fontWeight: "bold",
      fontSize: 14,
    },
    recordingsList: {
      borderRadius: 12,
      overflow: "hidden",
    },
    recordingItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
    },
    recordingContent: {
      flex: 1,
      paddingRight: 12,
    },
    recordingTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    recordingMeta: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    pageReference: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
    },
    pageText: {
      fontSize: 12,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    downloadedBadge: {
      flexDirection: "row",
      alignItems: "center",
    },
    downloadedText: {
      fontSize: 12,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    caption: {
      fontSize: 14,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#666666',
      lineHeight: 20,
    },
    playButton: {
      marginLeft: 12,
    },
    playButtonInner: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    playingButton: {
      backgroundColor: isDarkMode ? 
        `${theme.colors.primary}DD` : 
        `${theme.colors.primary}AA`,
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#EEEEEE',
    },
    emptyContainer: {
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#666666',
      textAlign: "center",
    },
    infoText: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.onSurface,
    },
    relatedSpeciesList: {
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F9F9F9',
    },
    relatedSpeciesItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#EEEEEE',
    },
    relatedSpeciesName: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    loadingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      width: width * 0.8,
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#666666',
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    errorCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      width: width * 0.8,
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.error,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 16,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#666666',
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 22,
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    retryText: {
      fontSize: 14,
      color: "#FFFFFF",
      marginLeft: 8,
    },
    goBackButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    goBackText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: "500",
    }
  });

  // Handle audio preview
  const handleAudioPreview = async (audioId: string, recordingId: string) => {
    try {
      if (audioState.currentAudioId === audioId) {
        // Toggle play/pause if it's the same audio
        if (audioState.isPlaying) {
          await pauseAudio()
        } else {
          await playAudio()
        }
      } else {
        // Load and play new audio
        let audioUri

        if (isDownloaded(recordingId)) {
          // Use local file
          audioUri = getDownloadPath(audioId, true)
        } else if (isConnected) {
          const { data } = supabase.storage.from("audio").getPublicUrl(`${audioId}.mp3`)
          audioUri = data?.publicUrl
        } else {
          // No audio available offline
          Alert.alert(
            "Audio Unavailable",
            "This recording is not available offline. Please download it or connect to the internet.",
            [{ text: "OK" }]
          )
          return
        }

        if (audioUri) {
          await loadAudio(audioUri, audioId, true)
          await playAudio()
        }
      }
    } catch (error) {
      console.error("Audio preview error:", error)
      Alert.alert(
        "Audio Error",
        "Failed to play audio. Please try again.",
        [{ text: "OK" }]
      )
    }
  }

  // Handle retry
  const handleRetry = () => {
    refetch()
  }

  // Background pattern
  const BackgroundPattern = () => (
    <View style={styles.backgroundPattern} />
  )

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading species details...</Text>
          </View>
        </View>
      </View>
    )
  }

  // Render error state
  if (error || !recordings) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>

        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Unable to Load Species</Text>
            <Text style={styles.errorText}>
              {!isConnected
                ? "You're offline. This species is not available offline."
                : "Something went wrong. Please try again."}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
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

  // Get species name from first recording
  const speciesName =
    recordings.length > 0 && recordings[0].species ? recordings[0].species.common_name : "Unknown Species"

  // Get scientific name from first recording
  const scientificName = recordings.length > 0 && recordings[0].species ? recordings[0].species.scientific_name : ""

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.speciesName}>{speciesName}</Text>
          <Text style={styles.scientificName}>{scientificName}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Recordings Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recordings</Text>
            <View style={styles.recordingCountBadge}>
              <Text style={styles.recordingCountText}>{recordings.length}</Text>
            </View>
          </View>

          {recordings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes" size={48} color={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#E0E0E0'} />
              <Text style={styles.emptyText}>No recordings available</Text>
            </View>
          ) : (
            <View style={styles.recordingsList}>
              {recordings.map((item) => {
                const isCurrentlyPlaying = audioState.isPlaying && audioState.currentAudioId === item.audio_id

                return (
                  <View key={item.id}>
                    <TouchableOpacity
                      style={styles.recordingItem}
                      onPress={() => {
                        navigation.navigate("RecordingDetails", { recordingId: item.id })
                      }}
                    >
                      <View style={styles.recordingContent}>
                        <Text style={styles.recordingTitle}>{item.title}</Text>
                        <View style={styles.recordingMeta}>
                          <View style={styles.pageReference}>
                            <Ionicons name="book-outline" size={14} color={theme.colors.primary} />
                            <Text style={styles.pageText}>Page {item.book_page_number}</Text>
                          </View>
                          {isDownloaded(item.id) && (
                            <View style={styles.downloadedBadge}>
                              <Ionicons name="cloud-done" size={14} color={theme.colors.primary} />
                              <Text style={styles.downloadedText}>Downloaded</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.caption} numberOfLines={2}>
                          {item.caption}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => handleAudioPreview(item.audio_id, item.id)}
                      >
                        <View style={[
                          styles.playButtonInner,
                          isCurrentlyPlaying && styles.playingButton
                        ]}>
                          <Ionicons
                            name={isCurrentlyPlaying ? "pause" : "play"}
                            size={24}
                            color="#FFFFFF"
                          />
                        </View>
                      </TouchableOpacity>
                    </TouchableOpacity>
                    {recordings.indexOf(item) < recordings.length - 1 && <View style={styles.divider} />}
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default SpeciesDetailsScreen