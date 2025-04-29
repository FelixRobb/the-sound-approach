"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { ActivityIndicator } from "react-native-paper"
import { DownloadContext } from "../context/DownloadContext"
import { AudioContext } from "../context/AudioContext"
import type { DownloadRecord } from "../types"
import React from "react"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../types"
import { TextInput as RNTextInput } from 'react-native'

const { width } = Dimensions.get("window")

const DownloadsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { totalStorageUsed, deleteDownload, clearAllDownloads, getDownloadedRecordings } = useContext(DownloadContext)
  const { loadAudio, playAudio, pauseAudio, audioState } = useContext(AudioContext)

  const [downloads, setDownloads] = useState<DownloadRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

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
  const loadDownloads = async () => {
    setIsLoading(true)
    try {
      const downloadedRecordings = await getDownloadedRecordings()
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
      }))
      setDownloads(formattedRecordings)
    } catch (error) {
      console.error("Error loading downloads:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // Check for downloads when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDownloads()
      return () => {
        // Optional cleanup if needed
      }
    }, [])
  )

  // Initial load when component mounts
  useEffect(() => {
    loadDownloads()
  }, [])

  // Handle audio playback
  const handleAudioPlayback = async (item: DownloadRecord) => {
    try {
      if (audioState.currentAudioId === item.audio_path) {
        // Toggle play/pause if it's the same audio
        if (audioState.isPlaying) {
          await pauseAudio()
        } else {
          await playAudio()
        }
      } else {
        // Load and play new audio
        await loadAudio(`file://${item.audio_path}`, item.audio_path)
        await playAudio()
      }
    } catch (error) {
      console.error("Audio playback error:", error)
    }
  }

  // Handle delete download
  const handleDeleteDownload = (item: DownloadRecord) => {
    Alert.alert(
      "Delete Download",
      "Are you sure you want to delete this download?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteDownload(item.recording_id)
              .then(() => {
                setDownloads((prev) => prev.filter((download) => download.recording_id !== item.recording_id))
              })
              .catch((error) => {
                console.error("Delete error:", error)
              })
          }
        }
      ]
    )
  }

  // Handle clear all downloads
  const handleClearAllDownloads = () => {
    Alert.alert(
      "Clear All Downloads",
      "Are you sure you want to delete all downloads? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            clearAllDownloads()
              .then(() => {
                setDownloads([])
              })
              .catch((error) => {
                console.error("Clear downloads error:", error)
              })
          }
        }
      ]
    )
  }

  // Filter downloads based on search query
  const filteredDownloads = downloads.filter((download) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      download.title?.toLowerCase().includes(query) ||
      download.species_name?.toLowerCase().includes(query) ||
      download.scientific_name?.toLowerCase().includes(query) ||
      (download.book_page_number && download.book_page_number.toString().includes(query))
    )
  })

  // Background pattern
  const BackgroundPattern = () => (
    <View style={styles.backgroundPattern} />
  )

  // Custom header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="cloud-download" size={24} color="#2E7D32" />
          <Text style={styles.headerTitle}>Downloads</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name={showSearch ? "close" : "search"} size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              navigation.navigate("Profile")
            }}
          >
            <View style={styles.profileButtonBackground}>
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search downloads..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.storageInfoContainer}>
        <View style={styles.storageInfo}>
          <Text style={styles.storageText}>
            Storage used: {formatBytes(totalStorageUsed)}
          </Text>
          <TouchableOpacity
            style={[styles.clearAllButton, downloads.length === 0 && styles.disabledButton]}
            disabled={downloads.length === 0}
            onPress={handleClearAllDownloads}
          >
            <Text style={[styles.clearAllText, downloads.length === 0 && styles.disabledButtonText]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  // Render download item
  const renderDownloadItem = ({ item }: { item: DownloadRecord }) => {
    const isCurrentlyPlaying = audioState.isPlaying && audioState.currentAudioId === item.audio_path

    return (
      <View>
        <TouchableOpacity
          style={styles.downloadCard}
          onPress={() => {
            navigation.navigate("RecordingDetails", { recordingId: item.recording_id })
          }}
        >
          <View style={styles.downloadHeader}>
            <Text style={styles.downloadTitle}>{item.title || "Unknown Recording"}</Text>
            <Text style={styles.scientificName}>{item.scientific_name || ""}</Text>
          </View>

          <View style={styles.downloadContent}>
            <View style={styles.downloadInfo}>
              <Text style={styles.speciesName}>{item.species_name || "Unknown Species"}</Text>
              
              {item.book_page_number && (
                <View style={styles.pageReference}>
                  <Text style={styles.pageText}>Page {item.book_page_number}</Text>
                </View>
              )}
              
              <Text style={styles.downloadDate}>
                Downloaded: {new Date(item.downloaded_at).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.downloadActions}>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => handleAudioPlayback(item)}
              >
                <View style={[styles.playButtonInner, isCurrentlyPlaying && styles.playButtonActive]}>
                  <Ionicons
                    name={isCurrentlyPlaying ? "pause" : "play"}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteDownload(item)}
              >
                <Ionicons name="trash-outline" size={22} color="#B00020" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Ionicons name="cloud-download-outline" size={60} color="#2E7D32" />
        <Text style={styles.emptyTitle}>
          {searchQuery ? "No results found" : "No Downloads"}
        </Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? `We couldn't find any downloads matching "${searchQuery}"`
            : "Downloaded recordings will appear here for offline listening."
          }
        </Text>
        {searchQuery && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery("")}
          >
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <Header />

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Loading downloads...</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />

      <FlatList
        data={filteredDownloads}
        renderItem={renderDownloadItem}
        keyExtractor={(item) => item.recording_id.toString()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadDownloads()
            }}
            colors={["#2E7D32"]}
            tintColor="#2E7D32"
          />
        }
      />

      <TouchableOpacity
        style={styles.manageStorageButton}
        onPress={() => {
          navigation.navigate("Profile")
        }}
      >
        <Text style={styles.manageStorageText}>Manage Storage</Text>
        <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

// TextInput implementation
const TextInput = (props: React.ComponentProps<typeof RNTextInput>) => {
  return (
    <RNTextInput
      {...props}
      style={[
        {
          backgroundColor: "transparent",
          fontSize: 16,
          color: "#333",
          flex: 1,
        },
        props.style
      ]}
    />
  )
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  backgroundPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  profileButton: {
    marginLeft: 8,
    borderRadius: 18,
    overflow: "hidden",
  },
  profileButtonBackground: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#2E7D32",
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  storageInfoContainer: {
    backgroundColor: "rgba(46, 125, 50, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  storageInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storageText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
  clearAllButton: {
    backgroundColor: "rgba(46, 125, 50, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearAllText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  disabledButtonText: {
    color: "#999",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra space for button at bottom
  },
  downloadCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  downloadHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  downloadTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333333",
  },
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666666",
    marginTop: 2,
  },
  downloadContent: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 8,
    justifyContent: "space-between",
  },
  downloadInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: 15,
    color: "#333333",
    marginBottom: 4,
  },
  pageReference: {
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pageText: {
    fontSize: 12,
    color: "#2E7D32",
  },
  downloadDate: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  downloadActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    marginRight: 16,
  },
  playButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
  },
  playButtonActive: {
    backgroundColor: "#2E7D32",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(176, 0, 32, 0.1)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 48,
  },
  emptyCard: {
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
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  },
  clearSearchButton: {
    marginTop: 16,
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearSearchText: {
    color: "#2E7D32",
    fontWeight: "bold",
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
    color: "#333333",
    textAlign: "center",
  },
  manageStorageButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  manageStorageText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginRight: 8,
  },
})

export default DownloadsScreen