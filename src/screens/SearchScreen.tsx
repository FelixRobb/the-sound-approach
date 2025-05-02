"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from "react-native"
import { Appbar, Searchbar, Chip, ActivityIndicator, Divider } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { searchRecordings} from "../lib/supabase"
import { NetworkContext } from "../context/NetworkContext"
import { DownloadContext } from "../context/DownloadContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Recording } from "../types"
import { RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useThemedStyles } from "../hooks/useThemedStyles"
import React from "react"

const SearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { isConnected } = useContext(NetworkContext)
  const { isDownloaded } = useContext(DownloadContext)
  const { theme, colors, isDarkMode } = useThemedStyles()

  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Recording[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "species" | "recordings" | "pages">("all")

  const styles = StyleSheet.create({
    clearText: {
      color: theme.colors.primary,
      fontWeight: "500",
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    downloadedBadge: {
      alignItems: "center",
      backgroundColor: isDarkMode ? colors.alpha.success[20] : colors.alpha.success[10],
      borderRadius: 4,
      flexDirection: "row",
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    downloadedText: {
      color: theme.colors.primary,
      fontSize: 12,
      marginLeft: 4,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 48,
    },
    emptyRecentText: {
      color: colors.textSecondary,
      fontStyle: "italic",
      marginTop: 24,
      opacity: 0.5,
      textAlign: "center",
    },
    emptyText: {
      color: colors.textSecondary,
      marginTop: 16,
      textAlign: "center",
    },
    filterChip: {
      backgroundColor: isDarkMode ? colors.alpha.white[8] : colors.alpha.black[5],
      marginRight: 8,
    },
    filterContainer: {
      marginBottom: 8,
      paddingHorizontal: 16,
    },
    listContent: {
      padding: 16,
    },
    loadingContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    loadingText: {
      color: theme.colors.onBackground,
      fontSize: 16,
      marginTop: 16,
    },
    offlineNotice: {
      alignItems: "center",
      backgroundColor: isDarkMode ? colors.alpha.warning[20] : colors.alpha.warning[10],
      borderRadius: 8,
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 16,
      padding: 12,
    },
    offlineText: {
      color: colors.warning,
      flex: 1,
      marginLeft: 8,
    },
    pageReference: {
      alignItems: "center",
      backgroundColor: isDarkMode ? colors.alpha.white[8] : colors.alpha.black[5],
      borderRadius: 4,
      flexDirection: "row",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pageText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginLeft: 4,
    },
    recentContainer: {
      padding: 16,
    },
    recentHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    recentItem: {
      alignItems: "center",
      borderBottomColor: isDarkMode ? colors.alpha.white[10] : colors.alpha.black[5],
      borderBottomWidth: 1,
      flexDirection: "row",
      paddingVertical: 12,
    },
    recentQueryText: {
      color: theme.colors.onBackground,
      fontSize: 16,
      marginLeft: 12,
    },
    recentTitle: {
      color: theme.colors.onBackground,
      fontSize: 18,
      fontWeight: "600",
    },
    resultContent: {
      flex: 1,
    },
    resultItem: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    resultMeta: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: 8,
    },
    resultTitle: {
      color: theme.colors.onBackground,
      fontSize: 16,
      fontWeight: "600",
    },
    scientificName: {
      color: colors.textSecondary,
      fontSize: 14,
      fontStyle: "italic",
      marginTop: 4,
    },
    searchBar: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      elevation: 2,
      margin: 16,
    },
  });

  // Load recent searches from storage
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const savedSearches = await AsyncStorage.getItem("recentSearches")
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches))
        }
      } catch (error) {
        console.error("Error loading recent searches:", error)
      }
    }

    loadRecentSearches()
  }, [])

  // Save recent searches to storage
  const saveRecentSearch = async (query: string) => {
    if (!query.trim()) return

    try {

      // Add to recent searches (avoid duplicates and limit to 10)
      const updatedSearches = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 10)

      setRecentSearches(updatedSearches)
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
    } catch (error) {
      console.error("Error saving recent search:", error)
    }
  }

  // Clear recent searches
  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem("recentSearches")
      setRecentSearches([])
    } catch (error) {
      console.error("Error clearing recent searches:", error)
    }
  }

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim() || !isConnected) return

    setIsLoading(true)

    try {
      const searchResults = await searchRecordings(query)
      setResults(searchResults)
      saveRecentSearch(query)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter results based on active filter
  const filteredResults = results.filter((item) => {
    if (activeFilter === "all") return true
    if (activeFilter === "species" && item.species) return true
    if (activeFilter === "recordings" && !item.species) return true
    if (activeFilter === "pages" && item.book_page_number) return true
    return false
  })

  // Render recording item
  const renderRecordingItem = ({ item }: { item: Recording }) => {
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => {
          navigation.navigate("RecordingDetails", { recordingId: item.id })
        }}
      >
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>{item.title}</Text>
          {item.species && <Text style={styles.scientificName}>{item.species.scientific_name}</Text>}
          <View style={styles.resultMeta}>
            <View style={styles.pageReference}>
              <Ionicons name="book-outline" size={14} color={isDarkMode ? '#ccc' : '#666'} />
              <Text style={styles.pageText}>Page {item.book_page_number}</Text>
            </View>
            {isDownloaded(item.id) && (
              <View style={styles.downloadedBadge}>
                <Ionicons name="cloud-done-outline" size={14} color={isDarkMode ? '#81C784' : '#2E7D32'} />
                <Text style={styles.downloadedText}>Downloaded</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={isDarkMode ? '#ccc' : '#666'} />
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Search" />
      </Appbar.Header>

      <Searchbar
        placeholder="Search species, recordings, or pages..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={() => handleSearch(searchQuery)}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
      />

      {!isConnected && (
        <View style={styles.offlineNotice}>
          <Ionicons name="cloud-offline-outline" size={20} color={isDarkMode ? '#FFCC80' : '#E65100'} />
          <Text style={styles.offlineText}>
            You&apos;re offline. Search is unavailable while offline.
          </Text>
        </View>
      )}

      {searchQuery ? (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip selected={activeFilter === "all"} onPress={() => setActiveFilter("all")} style={styles.filterChip}>
              <Text>All</Text>
            </Chip>
            <Chip
              selected={activeFilter === "species"}
              onPress={() => setActiveFilter("species")}
              style={styles.filterChip}
            >
              <Text>Species</Text>
            </Chip>
            <Chip
              selected={activeFilter === "recordings"}
              onPress={() => setActiveFilter("recordings")}
              style={styles.filterChip}
            >
              <Text>Recordings</Text>
            </Chip>
            <Chip
              selected={activeFilter === "pages"}
              onPress={() => setActiveFilter("pages")}
              style={styles.filterChip}
            >
              <Text>Pages</Text>
            </Chip>
          </ScrollView>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : searchQuery ? (
        <FlatList
          data={filteredResults}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={isDarkMode ? '#aaa' : '#666'} />
              <Text style={styles.emptyText}>No results found for &quot;{searchQuery}&quot;</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentSearches.length > 0 ? (
            <FlatList
              data={recentSearches}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recentItem}
                  onPress={() => {
                    setSearchQuery(item)
                    handleSearch(item)
                  }}
                >
                  <Ionicons name="time-outline" size={20} color={isDarkMode ? '#aaa' : '#666'} />
                  <Text style={styles.recentQueryText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `recent-${index}`}
            />
          ) : (
            <Text style={styles.emptyRecentText}>No recent searches</Text>
          )}
        </View>
      )}
    </View>
  )
}

export default SearchScreen
