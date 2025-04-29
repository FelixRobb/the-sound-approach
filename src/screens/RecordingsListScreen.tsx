"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions } from "react-native"
import { Searchbar, ActivityIndicator } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"
import { fetchRecordingsByBookOrder, fetchSpecies } from "../lib/supabase"
import { NetworkContext } from "../context/NetworkContext"
import { DownloadContext } from "../context/DownloadContext"
import { AudioContext } from "../context/AudioContext"
import { supabase } from "../lib/supabase"
import type { Recording, Species } from "../types"
import { RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

const { width } = Dimensions.get("window")

const RecordingsListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
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
  const isItemDownloaded = isDownloaded(item.id)
  
  return (
    <View>
      <TouchableOpacity
        style={styles.recordingCard}
        onPress={() => {
          navigation.navigate("RecordingDetails", { recordingId: item.id })
        }}
      >
        <View style={styles.recordingHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.recordingTitle}>{item.title}</Text>
            {isItemDownloaded && (
              <View style={styles.downloadedIndicator}>
                <Ionicons name="cloud-done" size={14} color="#2E7D32" />
              </View>
            )}
          </View>
          <Text style={styles.scientificName}>{item.species?.scientific_name}</Text>
        </View>
        
        <View style={styles.recordingContent}>
          <View style={styles.captionContainer}>
            <Text style={styles.caption} numberOfLines={2}>
              {item.caption}
            </Text>
            <View style={styles.pageReference}>
              <Text style={styles.pageText}>Page {item.book_page_number}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.audioControls}
            onPress={() => handleAudioPreview(item)}
          >
            <View style={styles.playButtonContainer}>
              <View style={[styles.playButton, isCurrentlyPlaying && styles.playButtonActive]}>
                <Ionicons 
                  name={isCurrentlyPlaying ? "pause" : "play"}
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  )
}
  // Render species item
  // Replace renderSpeciesItem with simplified version
const renderSpeciesItem = ({ item }: { item: Species }) => {
  return (
    <View>
      <TouchableOpacity
        style={styles.speciesCard}
        onPress={() => {
          navigation.navigate("SpeciesDetails", { speciesId: item.id })
        }}
      >
        <View style={styles.speciesContent}>
          <View>
            <Text style={styles.speciesName}>{item.common_name}</Text>
            <Text style={styles.scientificName}>{item.scientific_name}</Text>
          </View>
          
          <View style={styles.speciesAction}>
            <View style={styles.speciesActionButton}>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

  // Background pattern
  const BackgroundPattern = () => (
    <View style={styles.backgroundPattern} />
  )

  // Custom header component
  // Replace Header component with this simplified version
const Header = () => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <View style={styles.headerTitleContainer}>
        <Ionicons name="musical-notes" size={24} color="#2E7D32" />
        <Text style={styles.headerTitle}>The Sound Approach</Text>
      </View>
      
      <View style={styles.headerActions}>
        {!isConnected && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              navigation.navigate("OfflineNotice")
            }}
          >
            <Ionicons name="cloud-offline" size={24} color="#B00020" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowSearch(true)}
        >
          <Ionicons name="search" size={24} color="#333" />
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
    
    {!showSearch ? (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "book" && styles.activeTab]}
          onPress={() => setActiveTab("book")}
        >
          <Text style={[styles.tabText, activeTab === "book" && styles.activeTabText]}>Book Order</Text>
          {activeTab === "book" && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "species" && styles.activeTab]}
          onPress={() => setActiveTab("species")}
        >
          <Text style={[styles.tabText, activeTab === "species" && styles.activeTabText]}>Species</Text>
          {activeTab === "species" && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>
    ) : (
      <Searchbar
        placeholder="Search birds, sounds, or pages..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        iconColor="#2E7D32"
        onIconPress={() => {
          if (searchQuery) {
            setSearchQuery("")
          } else {
            setShowSearch(false)
          }
        }}
        icon={searchQuery ? "close" : "arrow-left"}
      />
    )}
  </View>
)

  // Render loading state
  if ((activeTab === "book" && recordingsLoading) || (activeTab === "species" && speciesLoading)) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <Header />
        
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Loading amazing birdsongs...</Text>
          </View>
        </View>
      </View>
    )
  }

  // Render error state
  if ((activeTab === "book" && recordingsError) || (activeTab === "species" && speciesError)) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <Header />
        
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={60} color="#B00020" />
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
      </View>
    )
  }

  // Empty state component
const EmptyState = ({ type }: { type: 'recordings' | 'species' }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyCard}>
      <Ionicons 
        name={type === 'recordings' ? "musical-notes" : "leaf"} 
        size={60} 
        color="#2E7D32" 
      />
      <Text style={styles.emptyTitle}>
        {searchQuery ? "No results found" : `No ${type} available`}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? `We couldn't find any ${type} matching "${searchQuery}"`
          : `There are no ${type} available at the moment`
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

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />
      
      {activeTab === "book" ? (
        <FlatList
          data={filteredRecordings}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          refreshControl={
            <RefreshControl 
              refreshing={recordingsLoading} 
              onRefresh={refetchRecordings} 
              colors={["#2E7D32"]} 
              tintColor="#2E7D32"
            />
          }
          ListEmptyComponent={<EmptyState type="recordings" />}
        />
      ) : (
        <FlatList
          data={filteredSpecies}
          renderItem={renderSpeciesItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          refreshControl={
            <RefreshControl 
              refreshing={speciesLoading} 
              onRefresh={refetchSpecies} 
              colors={["#2E7D32"]} 
              tintColor="#2E7D32"
            />
          }
          ListEmptyComponent={<EmptyState type="species" />}
        />
      )}
    </View>
  )
}

// Updated styles object with simplified styling
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
  searchBar: {
    margin: 16,
    borderRadius: 12,
    elevation: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    height: 50,
  },
  searchInput: {
    color: "#333333",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    position: "relative",
    alignItems: "center",
  },
  activeTab: {},
  tabText: {
    fontSize: 16,
    color: "#666666",
  },
  activeTabText: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 3,
    backgroundColor: "#2E7D32",
    borderRadius: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  recordingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  recordingHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordingTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333333",
    flex: 1,
  },
  downloadedIndicator: {
    marginLeft: 8,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666666",
    marginTop: 2,
  },
  recordingContent: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 8,
  },
  captionContainer: {
    flex: 1,
    marginRight: 16,
  },
  caption: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  pageReference: {
    marginTop: 8,
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
  audioControls: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
  },
  playButtonContainer: {
    borderRadius: 22,
    overflow: "hidden",
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
  },
  playButtonActive: {
    backgroundColor: "#2E7D32",
  },
  speciesCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  speciesContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  speciesName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333333",
  },
  speciesAction: {
    borderRadius: 16,
    overflow: "hidden",
  },
  speciesActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1976D2",
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
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#2E7D32",
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
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
  }
})

export default RecordingsListScreen