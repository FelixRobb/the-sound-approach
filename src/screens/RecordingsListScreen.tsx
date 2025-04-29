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
import { useThemedStyles } from "../hooks/useThemedStyles"

const { width } = Dimensions.get("window")

const RecordingsListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { isConnected } = useContext(NetworkContext)
  const { isDownloaded, getDownloadPath } = useContext(DownloadContext)
  const { loadAudio, playAudio, pauseAudio, audioState } = useContext(AudioContext)
  const { theme, isDarkMode } = useThemedStyles()

  const [activeTab, setActiveTab] = useState("book")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backgroundPattern: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDarkMode ? 
        `${theme.colors.primary}08` : // Very transparent primary color
        `${theme.colors.primary}05`,
      opacity: 0.5,
    },
    header: {
      paddingTop: 45,
      paddingBottom: 10,
      backgroundColor: theme.colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
      elevation: 4,
      zIndex: 10,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconButton: {
      padding: 8,
      borderRadius: 20,
      marginLeft: 8,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    tabBar: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    },
    activeTabText: {
      color: "white",
    },
    searchContainer: {
      paddingHorizontal: 16,
      marginVertical: 8,
    },
    searchBar: {
      borderRadius: 8,
      elevation: 2,
      backgroundColor: theme.colors.surface,
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    recordingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginVertical: 8,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    recordingHeader: {
      marginBottom: 8,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    recordingTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
      flex: 1,
    },
    scientificName: {
      fontSize: 14,
      fontStyle: "italic",
      marginTop: 2,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    },
    recordingContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    captionContainer: {
      flex: 1,
      marginRight: 12,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
      marginBottom: 8,
    },
    pageReference: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      alignSelf: "flex-start",
    },
    pageText: {
      fontSize: 12,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    },
    audioControls: {
      alignItems: "center",
      justifyContent: "center",
    },
    playButtonContainer: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    playButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    downloadedIndicator: {
      marginLeft: 8,
      backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      flexDirection: "row",
      alignItems: "center",
    },
    speciesCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginVertical: 8,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    speciesContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    speciesName: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    speciesAction: {
      marginLeft: 8,
    },
    speciesActionButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 8,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 16,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      textAlign: "center",
      marginHorizontal: 24,
      marginBottom: 24,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 40,
    },
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 40,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: "center",
      marginHorizontal: 24,
      marginBottom: 24,
    },
  });

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
          await loadAudio(audioUri, recording.audio_id, true)
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
                <Ionicons name="cloud-done" size={14} color={isDarkMode ? '#81C784' : '#2E7D32'} />
                <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#81C784' : '#2E7D32' }}>
                  Downloaded
                </Text>
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
    )
  }

  // Render species item
  const renderSpeciesItem = ({ item }: { item: Species }) => {
    return (
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
    )
  }

  // Background pattern
  const BackgroundPattern = () => (
    <View style={styles.backgroundPattern} />
  )

  // Header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Library</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "book" && styles.activeTab]}
          onPress={() => setActiveTab("book")}
        >
          <Text style={[styles.tabText, activeTab === "book" && styles.activeTabText]}>
            By Book Order
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "species" && styles.activeTab]}
          onPress={() => setActiveTab("species")}
        >
          <Text style={[styles.tabText, activeTab === "species" && styles.activeTabText]}>
            By Species
          </Text>
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={activeTab === "book" ? "Search recordings..." : "Search species..."}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={theme.colors.primary}
          />
        </View>
      )}
    </View>
  )

  // Empty state component
  const EmptyState = ({ type }: { type: 'recordings' | 'species' }) => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={type === 'recordings' ? "disc-outline" : "leaf-outline"}
        size={60}
        color={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {type === 'recordings' ? "No Recordings Found" : "No Species Found"}
      </Text>
      <Text style={styles.emptyText}>
        {type === 'recordings'
          ? "We couldn't find any recordings matching your search."
          : "We couldn't find any species matching your search."}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />

      {recordingsLoading || speciesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onBackground }}>
            Loading {activeTab === "book" ? "recordings" : "species"}...
          </Text>
        </View>
      ) : recordingsError || speciesError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.error} />
          <Text style={styles.errorText}>
            Error loading data. Please check your connection and try again.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {activeTab === "book" ? (
            <FlatList
              data={filteredRecordings}
              renderItem={renderRecordingItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={recordingsLoading}
                  onRefresh={refetchRecordings}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
              ListEmptyComponent={<EmptyState type="recordings" />}
            />
          ) : (
            <FlatList
              data={filteredSpecies}
              renderItem={renderSpeciesItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={speciesLoading}
                  onRefresh={refetchSpecies}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
              ListEmptyComponent={<EmptyState type="species" />}
            />
          )}
        </View>
      )}
    </View>
  )
}

export default RecordingsListScreen