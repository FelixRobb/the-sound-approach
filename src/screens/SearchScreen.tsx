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

const SearchScreen = () => {
  const navigation = useNavigation()
  const { isConnected } = useContext(NetworkContext)
  const { isDownloaded } = useContext(DownloadContext)

  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Recording[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "species" | "recordings" | "pages">("all")

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
          // @ts-ignore - Navigation typing issue
          navigation.navigate("RecordingDetails", { recordingId: item.id })
        }}
      >
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>{item.title}</Text>
          {item.species && <Text style={styles.scientificName}>{item.species.scientific_name}</Text>}
          <View style={styles.resultMeta}>
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
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666666" />
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
      />

      {searchQuery ? (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip selected={activeFilter === "all"} onPress={() => setActiveFilter("all")} style={styles.filterChip}>
              All
            </Chip>
            <Chip
              selected={activeFilter === "species"}
              onPress={() => setActiveFilter("species")}
              style={styles.filterChip}
            >
              Species
            </Chip>
            <Chip
              selected={activeFilter === "recordings"}
              onPress={() => setActiveFilter("recordings")}
              style={styles.filterChip}
            >
              Recordings
            </Chip>
            <Chip
              selected={activeFilter === "pages"}
              onPress={() => setActiveFilter("pages")}
              style={styles.filterChip}
            >
              Pages
            </Chip>
          </ScrollView>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
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
              <Ionicons name="search-outline" size={48} color="#666666" />
              <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
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
                  <Ionicons name="time-outline" size={20} color="#666666" />
                  <Text style={styles.recentText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `recent-${index}`}
              contentContainerStyle={styles.recentList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#666666" />
              <Text style={styles.emptyText}>Your recent searches will appear here</Text>
            </View>
          )}
        </View>
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
  filterContainer: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  filterChip: {
    marginHorizontal: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  resultItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
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
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
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
  recentContainer: {
    flex: 1,
    padding: 16,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  clearText: {
    fontSize: 14,
    color: "#2E7D32",
  },
  recentList: {
    flexGrow: 1,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  recentText: {
    fontSize: 16,
    marginLeft: 12,
  },
})

export default SearchScreen
