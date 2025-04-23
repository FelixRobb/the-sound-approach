"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native"
import { Appbar, Searchbar, ActivityIndicator, Divider } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"
import { fetchRecordingsByBookOrder, fetchSpecies } from "../lib/supabase"
import { NetworkContext } from "../context/NetworkContext"
import { DownloadContext } from "../context/DownloadContext"
import { AudioContext } from "../context/AudioContext"
import { supabase } from "../lib/supabase"
import type { Recording, Species } from "../types"

const RecordingsListScreen = () => {
  const navigation = useNavigation()
  const { isConnected } = useContext(NetworkContext)
  const { isDownloaded, getDownloadPath } = useContext(DownloadContext)
  const { loadAudio, playAudio, pauseAudio, audioState } = useContext(AudioContext)

  const [activeTab, setActiveTab] = useState("book")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  // Fetch recordings by book order
  const {
    data: recordings,
    isLoading: recordingsLoading,
    error: recordingsError,
    refetch: refetchRecordings,
  } = useQuery({
    queryKey: ["recordings"],
    queryFn: fetchRecordingsByBookOrder,
  })

  // Fetch species
  const {
    data: species,
    isLoading: speciesLoading,
    error: speciesError,
    refetch: refetchSpecies,
  } = useQuery({
    queryKey: ["species"],
    queryFn: fetchSpecies,
  })

  // Check if offline and no data
  useEffect(() => {
    if (!isConnected && (!recordings || recordings.length === 0)) {
      // @ts-ignore - Navigation typing issue
      navigation.navigate("OfflineNotice")
    }
  }, [isConnected, recordings, navigation])

  // Filter recordings based on search query
  const filteredRecordings = recordings?.filter((recording) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      recording.title.toLowerCase().includes(query) ||
      recording.caption.toLowerCase().includes(query) ||
      recording.species?.common_name.toLowerCase().includes(query) ||
      recording.species?.scientific_name.toLowerCase().includes(query) ||
      recording.book_page_number.toString().includes(query)
    )
  })

  // Filter species based on search query
  const filteredSpecies = species?.filter((species) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return species.common_name.toLowerCase().includes(query) || species.scientific_name.toLowerCase().includes(query)
  })

  // Handle audio preview
  const handleAudioPreview = async (recording: Recording) => {
    try {
      if (audioState.currentAudioId === recording.audio_id) {
        // Toggle play/pause if it's the same audio
        if (audioState.isPlaying) {
          await pauseAudio()
        } else {
          await playAudio()
        }
      } else {
        // Load and play new audio
        let audioUri

        if (isDownloaded(recording.id)) {
          // Use local file
          audioUri = getDownloadPath(recording.audio_id, true)
        } else if (isConnected) {
          const { data } = await supabase.storage.from("audio").getPublicUrl(`${recording.audio_id}.mp3`)
          audioUri = data?.publicUrl
        } else {
          // No audio available offline
          return
        }

        if (audioUri) {
          await loadAudio(audioUri, recording.audio_id)
          await playAudio()
        }
      }
    } catch (error) {
      console.error("Audio preview error:", error)
    }
  }

  // Render recording item
  const renderRecordingItem = ({ item }: { item: Recording }) => {
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
          <Text style={styles.scientificName}>{item.species?.scientific_name}</Text>
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

        <TouchableOpacity style={styles.playButton} onPress={() => handleAudioPreview(item)}>
          <Ionicons name={isCurrentlyPlaying ? "pause-circle" : "play-circle"} size={40} color="#2E7D32" />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  // Render species item
  const renderSpeciesItem = ({ item }: { item: Species }) => {
    return (
      <TouchableOpacity
        style={styles.speciesItem}
        onPress={() => {
          // @ts-ignore - Navigation typing issue
          navigation.navigate("SpeciesDetails", { speciesId: item.id })
        }}
      >
        <View style={styles.speciesContent}>
          <Text style={styles.speciesName}>{item.common_name}</Text>
          <Text style={styles.scientificName}>{item.scientific_name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666666" />
      </TouchableOpacity>
    )
  }

  // Render loading state
  if ((activeTab === "book" && recordingsLoading) || (activeTab === "species" && speciesLoading)) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="The Sound Approach" />
          <Appbar.Action icon="magnify" onPress={() => setShowSearch(true)} />
          <Appbar.Action
            icon="account"
            onPress={() => {
              // @ts-ignore - Navigation typing issue
              navigation.navigate("Profile")
            }}
          />
        </Appbar.Header>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    )
  }

  // Render error state
  if ((activeTab === "book" && recordingsError) || (activeTab === "species" && speciesError)) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="The Sound Approach" />
          <Appbar.Action icon="magnify" onPress={() => setShowSearch(true)} />
          <Appbar.Action
            icon="account"
            onPress={() => {
              // @ts-ignore - Navigation typing issue
              navigation.navigate("Profile")
            }}
          />
        </Appbar.Header>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#B00020" />
          <Text style={styles.errorText}>
            {!isConnected ? "You're offline. Please check your connection." : "Something went wrong. Please try again."}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (activeTab === "book") {
                refetchRecordings()
              } else {
                refetchSpecies()
              }
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="The Sound Approach" />
        {!isConnected && (
          <Appbar.Action
            icon="cloud-off-outline"
            color="#B00020"
            onPress={() => {
              // @ts-ignore - Navigation typing issue
              navigation.navigate("OfflineNotice")
            }}
          />
        )}
        <Appbar.Action icon="magnify" onPress={() => setShowSearch(true)} />
        <Appbar.Action
          icon="account"
          onPress={() => {
            // @ts-ignore - Navigation typing issue
            navigation.navigate("Profile")
          }}
        />
      </Appbar.Header>

      {showSearch ? (
        <Searchbar
          placeholder="Search..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          onIconPress={() => {
            if (searchQuery) {
              setSearchQuery("")
            } else {
              setShowSearch(false)
            }
          }}
          icon={searchQuery ? "close" : "arrow-left"}
        />
      ) : (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "book" && styles.activeTab]}
            onPress={() => setActiveTab("book")}
          >
            <Text style={[styles.tabText, activeTab === "book" && styles.activeTabText]}>Book Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "species" && styles.activeTab]}
            onPress={() => setActiveTab("species")}
          >
            <Text style={[styles.tabText, activeTab === "species" && styles.activeTabText]}>Species</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "book" ? (
        <FlatList
          data={filteredRecordings}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <Divider />}
          refreshControl={
            <RefreshControl refreshing={recordingsLoading} onRefresh={refetchRecordings} colors={["#2E7D32"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color="#666666" />
              <Text style={styles.emptyText}>
                {searchQuery ? "No recordings match your search" : "No recordings available"}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredSpecies}
          renderItem={renderSpeciesItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <Divider />}
          refreshControl={
            <RefreshControl refreshing={speciesLoading} onRefresh={refetchSpecies} colors={["#2E7D32"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={48} color="#666666" />
              <Text style={styles.emptyText}>
                {searchQuery ? "No species match your search" : "No species available"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    margin: 8,
    elevation: 0,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2E7D32",
  },
  tabText: {
    fontSize: 16,
    color: "#666666",
  },
  activeTabText: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  listContent: {
    flexGrow: 1,
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
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666666",
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
  speciesItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  speciesContent: {
    flex: 1,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
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
  retryButton: {
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: "#2E7D32",
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
})

export default RecordingsListScreen
