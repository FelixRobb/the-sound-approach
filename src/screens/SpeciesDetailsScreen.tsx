"use client"

import { useContext } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from "react-native"
import { Appbar, Divider, ActivityIndicator } from "react-native-paper"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"
import { fetchRecordingsBySpecies } from "../lib/supabase"
import { NetworkContext } from "../context/NetworkContext"
import { DownloadContext } from "../context/DownloadContext"
import { AudioContext } from "../context/AudioContext"
import { supabase } from "../lib/supabase"

const SpeciesDetailsScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { isConnected } = useContext(NetworkContext)
  const { isDownloaded, getDownloadPath } = useContext(DownloadContext)
  const { loadAudio, playAudio, pauseAudio, audioState } = useContext(AudioContext)

  // @ts-ignore - Route params typing
  const { speciesId } = route.params

  // Fetch recordings for this species
  const {
    data: recordings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["species-recordings", speciesId],
    queryFn: () => fetchRecordingsBySpecies(speciesId),
  })

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
          return
        }

        if (audioUri) {
          await loadAudio(audioUri, audioId)
          await playAudio()
        }
      }
    } catch (error) {
      console.error("Audio preview error:", error)
    }
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
          <Text style={styles.loadingText}>Loading species details...</Text>
        </View>
      </View>
    )
  }

  // Render error state
  if (error || !recordings) {
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
              ? "You're offline. This species is not available offline."
              : "Something went wrong. Please try again."}
          </Text>
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
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={speciesName} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.speciesHeader}>
          <Text style={styles.speciesName}>{speciesName}</Text>
          <Text style={styles.scientificName}>{scientificName}</Text>
        </View>

        <View style={styles.recordingsSection}>
          <Text style={styles.sectionTitle}>Recordings ({recordings.length})</Text>

          {recordings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color="#666666" />
              <Text style={styles.emptyText}>No recordings available</Text>
            </View>
          ) : (
            <FlatList
              data={recordings}
              renderItem={({ item }) => {
                const isCurrentlyPlaying = audioState.isPlaying && audioState.currentAudioId === item.audio_id

                return (
                  <TouchableOpacity
                    style={styles.recordingItem}
                    onPress={() => {
                      // @ts-ignore - Navigation typing issue
                      navigation.navigate("RecordingDetails", { recordingId: item.id })
                    }}
                  >
                    <View style={styles.recordingContent}>
                      <Text style={styles.recordingTitle}>{item.title}</Text>
                      <View style={styles.recordingMeta}>
                        <View style={styles.pageReference}>
                          <Ionicons name="book-outline" size={14} color="#666666" />
                          <Text style={styles.pageText}>Page {item.book_page_number}</Text>
                        </View>
                        {isDownloaded(item.id) && (
                          <View style={styles.downloadedBadge}>
                            <Ionicons name="cloud-done-outline" size={14} color="#2E7D32" />
                            <Text style={styles.downloadedText}>Downloaded</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.caption} numberOfLines={1}>
                        {item.caption}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={() => handleAudioPreview(item.audio_id, item.id)}
                    >
                      <Ionicons name={isCurrentlyPlaying ? "pause-circle" : "play-circle"} size={40} color="#2E7D32" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              }}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <Divider />}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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
  speciesHeader: {
    marginBottom: 24,
  },
  speciesName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 18,
    fontStyle: "italic",
    color: "#666666",
  },
  recordingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  recordingItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  recordingContent: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  recordingMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  pageReference: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  pageText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 4,
  },
  downloadedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  downloadedText: {
    fontSize: 12,
    color: "#2E7D32",
    marginLeft: 4,
  },
  caption: {
    fontSize: 14,
    color: "#333333",
  },
  playButton: {
    marginLeft: 16,
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
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
})

export default SpeciesDetailsScreen
