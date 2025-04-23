"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Appbar, Divider, Button, ActivityIndicator } from "react-native-paper"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { DownloadContext } from "../context/DownloadContext"
import { AudioContext } from "../context/AudioContext"
import type { DownloadRecord } from "../types"
import React from "react"



const DownloadsScreen = () => {
  const navigation = useNavigation()
  const { totalStorageUsed, deleteDownload, clearAllDownloads, getDownloadedRecordings } = useContext(DownloadContext)
  const { loadAudio, playAudio, pauseAudio, audioState } = useContext(AudioContext)

  const [downloads, setDownloads] = useState<DownloadRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Format bytes to human-readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Load downloaded recordings from database
 
  // Load downloaded recordings from database
  const loadDownloads = async () => {
    setIsLoading(true);
    try {
      const downloadedRecordings = await getDownloadedRecordings();
      // Map the downloaded recordings to match the DownloadedRecording type
      const formattedRecordings = downloadedRecordings.map(record => ({
        recording_id: record.recording_id,
        audio_path: record.audio_path,
        sonogram_path: record.sonogram_path,
        downloaded_at: record.downloaded_at,
        title: record.title,
        species_name: record.species_name,
        scientific_name: record.scientific_name,
        book_page_number: record.book_page_number,
        caption: record.caption,
      }));
      setDownloads(formattedRecordings);
    } catch (error) {
      console.error("Error loading downloads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for downloads when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDownloads();
      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  // Initial load when component mounts
  useEffect(() => {
    loadDownloads();
  }, []);

  // Handle audio playback
  const handleAudioPlayback = async (audioPath: string) => {
    try {
      if (audioState.currentAudioId === audioPath) {
        // Toggle play/pause if it's the same audio
        if (audioState.isPlaying) {
          await pauseAudio()
        } else {
          await playAudio()
        }
      } else {
        // Load and play new audio
        await loadAudio(`file://${audioPath}`, audioPath)
        await playAudio()
      }
    } catch (error) {
      console.error("Audio playback error:", error)
    }
  }

  // Handle delete download
  const handleDeleteDownload = (item: DownloadRecord) => {
    Alert.alert("Delete Download", "Are you sure you want to delete this download?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDownload(item.recording_id)
            setDownloads((prev) => prev.filter((download) => download.recording_id !== item.recording_id))
          } catch (error) {
            console.error("Delete error:", error)
          }
        },
      },
    ])
  }

  // Handle clear all downloads
  const handleClearAllDownloads = () => {
    Alert.alert("Clear All Downloads", "Are you sure you want to delete all downloads? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          try {
            await clearAllDownloads()
            setDownloads([])
          } catch (error) {
            console.error("Clear downloads error:", error)
          }
        },
      },
    ])
  }

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Downloads" />
        </Appbar.Header>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading downloads...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Downloads" />
      </Appbar.Header>

      <View style={styles.storageInfo}>
        <Text style={styles.storageText}>Storage used: {formatBytes(totalStorageUsed)}</Text>
        <Button mode="text" onPress={handleClearAllDownloads} disabled={downloads.length === 0}>
          Clear All
        </Button>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-download-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Downloads</Text>
          <Text style={styles.emptyText}>Downloaded recordings will appear here for offline listening.</Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          renderItem={({ item }) => {
            const isCurrentlyPlaying = audioState.isPlaying && audioState.currentAudioId === item.audio_path

            return (
              <View style={styles.downloadItem}>
                <TouchableOpacity
                  style={styles.downloadContent}
                  onPress={() => {
                    // @ts-ignore - Navigation typing issue
                    navigation.navigate("RecordingDetails", { recordingId: item.recording_id })
                  }}
                >
                  <Text style={styles.downloadTitle}>{item.title || "Unknown Recording"}</Text>
                  <Text style={styles.speciesName}>{item.species_name || "Unknown Species"}</Text>
                  <Text style={styles.scientificName}>{item.scientific_name || ""}</Text>
                  {item.book_page_number && (
                    <View style={styles.pageReference}>
                      <Ionicons name="book-outline" size={14} color="#666666" />
                      <Text style={styles.pageText}>Page {item.book_page_number}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.downloadActions}>
                  <TouchableOpacity style={styles.playButton} onPress={() => handleAudioPlayback(item.audio_path)}>
                    <Ionicons name={isCurrentlyPlaying ? "pause-circle" : "play-circle"} size={40} color="#2E7D32" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDownload(item)}>
                    <Ionicons name="trash-outline" size={24} color="#B00020" />
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
          keyExtractor={(item) => item.recording_id.toString()}
          ItemSeparatorComponent={() => <Divider />}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.manageStorageButton}>
        <Button
          mode="outlined"
          icon="folder"
          onPress={() => {
            // @ts-ignore - Navigation typing issue
            navigation.navigate("ProfileSettings")
          }}
        >
          Manage Storage
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  storageInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  storageText: {
    fontSize: 14,
    color: "#666666",
  },
  listContent: {
    flexGrow: 1,
  },
  downloadItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  downloadContent: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  speciesName: {
    fontSize: 14,
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666666",
    marginBottom: 4,
  },
  pageReference: {
    flexDirection: "row",
    alignItems: "center",
  },
  pageText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 4,
  },
  downloadActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    marginRight: 16,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
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
  manageStorageButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
})

export default DownloadsScreen
