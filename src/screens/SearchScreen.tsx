"use client";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { ActivityIndicator, Chip } from "react-native-paper";

import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { searchRecordings, type SearchResults } from "../lib/supabase";
import type { Recording, RootStackParamList, Species } from "../types";

// Define a type for search history items
type SearchHistoryItem = {
  name: string;
  timestamp: string;
  query: string;
};

const SearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isConnected } = useContext(NetworkContext);
  const { isDownloaded } = useContext(DownloadContext);
  const { theme, isDarkMode } = useThemedStyles();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults>({
    recordings: [],
    species: [],
  });
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "species" | "recordings" | "pages">(
    "all"
  );

  const styles = StyleSheet.create({
    backgroundPattern: {
      backgroundColor: isDarkMode
        ? `${theme.colors.primary}08` // Very transparent primary color
        : `${theme.colors.primary}05`,
      bottom: 0,
      left: 0,
      opacity: 0.6,
      position: "absolute",
      right: 0,
      top: 0,
    },
    chevronIcon: {
      marginTop: -12,
      position: "absolute",
      right: 16,
      top: "50%",
    },
    clearText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    downloadedBadge: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      flexDirection: "row",
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    downloadedText: {
      color: theme.colors.onSurface,
      fontSize: 12,
      marginLeft: 4,
    },
    emptyContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyRecentContainer: {
      alignItems: "center",
      paddingVertical: 48,
    },
    emptyText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      marginBottom: 24,
      marginHorizontal: 24,
      textAlign: "center",
    },
    emptyTitle: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
    },
    filterChip: {
      backgroundColor: isDarkMode ? theme.colors.surfaceVariant : theme.colors.surface,
      marginRight: 8,
    },
    filterContainer: {
      marginBottom: 12,
      marginTop: 8,
      paddingHorizontal: 16,
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 4,
      paddingBottom: 20,
      paddingTop: 50,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      zIndex: 1,
    },
    headerInner: {
      paddingHorizontal: 20,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    listContent: {
      padding: 16,
    },
    loadingContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: 40,
    },
    loadingText: {
      color: theme.colors.onBackground,
      fontSize: 16,
      marginTop: 16,
    },
    offlineBadge: {
      alignItems: "center",
      backgroundColor: isDarkMode ? `${theme.colors.error}20` : `${theme.colors.error}10`,
      borderRadius: 8,
      flexDirection: "row",
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    offlineBadgeText: {
      color: theme.colors.error,
      fontSize: 12,
      marginLeft: 4,
    },
    offlineButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    offlineButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    pageReference: {
      alignItems: "center",
      backgroundColor: isDarkMode ? `${theme.colors.primary}20` : `${theme.colors.primary}10`,
      borderRadius: 12,
      flexDirection: "row",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pageText: {
      color: theme.colors.primary,
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
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 2,
      flexDirection: "row",
      marginBottom: 12,
      padding: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
    },
    recentItemIcon: {
      alignItems: "center",
      backgroundColor: isDarkMode ? `${theme.colors.primary}20` : `${theme.colors.primary}10`,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      marginRight: 12,
      width: 40,
    },
    recentItemTextContainer: {
      flex: 1,
    },
    recentItemTimestamp: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 4,
    },
    recentQueryText: {
      color: theme.colors.onSurface,
      flex: 1,
      fontSize: 16,
    },
    recentTitle: {
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: "600",
    },
    resultCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 2,
      marginVertical: 8,
      padding: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
    },
    resultCount: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 8,
    },
    resultHeader: {
      marginBottom: 8,
    },
    resultMeta: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: 8,
    },
    resultTitle: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "700",
    },
    resultTypeIndicator: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: isDarkMode ? `${theme.colors.secondary}20` : `${theme.colors.secondary}10`,
      borderRadius: 12,
      flexDirection: "row",
      marginTop: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    resultTypeText: {
      color: theme.colors.secondary,
      fontSize: 12,
      fontWeight: "500",
      marginLeft: 4,
    },
    resultsHeader: {
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 12,
      marginTop: 16,
    },
    scientificName: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontStyle: "italic",
      marginTop: 4,
    },
    searchContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: "row",
      height: 46,
      marginHorizontal: 4,
      marginTop: 12,
      paddingHorizontal: 16,
    },
    searchContainerDisabled: {
      backgroundColor: theme.colors.surfaceDisabled,
      borderColor: theme.colors.outlineVariant,
    },
    searchInput: {
      color: theme.colors.onSurface,
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
      paddingVertical: 10,
    },
    searchInputDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    sectionDivider: {
      backgroundColor: isDarkMode
        ? `${theme.colors.surfaceVariant}50`
        : `${theme.colors.surfaceVariant}80`,
      height: 1,
      marginVertical: 16,
      width: "100%",
    },
    speciesActionButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      position: "absolute",
      right: 16,
      top: "50%",
      transform: [{ translateY: -20 }],
      width: 40,
    },
    speciesCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 2,
      marginVertical: 8,
      padding: 16,
      position: "relative",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
    },
    speciesName: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: "700",
    },
    speciesScientificName: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontStyle: "italic",
      marginTop: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      fontStyle: "italic",
      marginTop: 2,
    },
    title: {
      color: theme.colors.primary,
      fontSize: 28,
      fontWeight: "bold",
    },
    titleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });

  // Load recent searches from storage
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const savedSearches = await AsyncStorage.getItem("recentSearches");
        if (savedSearches) {
          // Handle both old format (strings) and new format (objects)
          const parsedSearches = JSON.parse(savedSearches);

          // Convert if needed
          const formattedSearches = parsedSearches.map((item: string | SearchHistoryItem) => {
            if (typeof item === "string") {
              return { name: item, timestamp: new Date().toISOString(), query: item };
            }
            return item;
          });

          setRecentSearches(formattedSearches);
        }
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    };

    loadRecentSearches();
  }, []);

  // Save recent searches to storage with additional metadata
  const saveRecentSearch = async (itemName: string) => {
    if (!itemName.trim()) return;

    try {
      // Create a search item with metadata
      const searchItem: SearchHistoryItem = {
        name: itemName,
        timestamp: new Date().toISOString(),
        query: searchQuery, // Store the original query too
      };

      // Get existing searches
      const savedSearches = await AsyncStorage.getItem("recentSearches");
      const searches: SearchHistoryItem[] = savedSearches ? JSON.parse(savedSearches) : [];

      // Add to recent searches (avoid duplicates by name and limit to 10)
      const updatedSearches = [
        searchItem,
        ...searches.filter((s: SearchHistoryItem) => s.name !== itemName),
      ].slice(0, 10);

      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  // Clear recent searches
  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem("recentSearches");
      setRecentSearches([]);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim() || !isConnected) return;

    setIsLoading(true);

    try {
      const results = await searchRecordings(query);
      setSearchResults(results);
      // Don't save search yet - we'll save it when user clicks on a result
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation to recording details and save search
  const handleNavigateToRecording = (recordingId: string) => {
    if (!isConnected) return;

    // Find the recording by ID
    const recording = searchResults.recordings.find((rec) => rec.id === recordingId);
    if (recording) {
      // Save the recording title instead of the search query
      saveRecentSearch(recording.title);
    }
    navigation.navigate("RecordingDetails", { recordingId });
  };

  // Handle navigation to species details and save search
  const handleNavigateToSpecies = (speciesId: string) => {
    if (!isConnected) return;

    // Find the species by ID
    const species = searchResults.species.find((sp) => sp.id === speciesId);
    if (species) {
      // Save the species common name instead of the search query
      saveRecentSearch(species.common_name);
    }
    navigation.navigate("SpeciesDetails", { speciesId });
  };

  // Filter results based on active filter
  const filteredResults = () => {
    if (activeFilter === "all") {
      return searchResults;
    } else if (activeFilter === "species") {
      return { recordings: [], species: searchResults.species };
    } else if (activeFilter === "recordings") {
      return { recordings: searchResults.recordings, species: [] };
    } else if (activeFilter === "pages" && /^\d+$/.test(searchQuery.trim())) {
      // Filter recordings by page number
      const pageNumber = parseInt(searchQuery.trim(), 10);
      const pageRecordings = searchResults.recordings.filter(
        (rec) => rec.book_page_number === pageNumber
      );
      return { recordings: pageRecordings, species: [] };
    }
    return { recordings: [], species: [] };
  };

  // Get filtered results
  const { recordings, species } = filteredResults();

  // Get total result count
  const totalResultCount = recordings.length + species.length;

  // Render recording item
  const renderRecordingItem = ({ item }: { item: Recording }) => {
    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => {
          handleNavigateToRecording(item.id);
        }}
        disabled={!isConnected}
      >
        <View style={styles.resultHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            {isDownloaded(item.id) && (
              <View style={styles.downloadedBadge}>
                <Ionicons
                  name="cloud-done-outline"
                  size={14}
                  color={isDarkMode ? "#81C784" : "#2E7D32"}
                />
                <Text style={styles.downloadedText}>Downloaded</Text>
              </View>
            )}
          </View>
          {item.species && (
            <Text style={styles.scientificName}>{item.species.scientific_name}</Text>
          )}
        </View>

        <View style={styles.resultMeta}>
          <View style={styles.pageReference}>
            <Ionicons name="book-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.pageText}>Page {item.book_page_number}</Text>
          </View>

          <View style={styles.resultTypeIndicator}>
            <Ionicons name="musical-notes-outline" size={12} color={theme.colors.secondary} />
            <Text style={styles.resultTypeText}>Recording</Text>
          </View>
        </View>

        {isConnected && (
          <TouchableOpacity
            style={styles.chevronIcon}
            onPress={() => {
              handleNavigateToRecording(item.id);
            }}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Render species item
  const renderSpeciesItem = ({ item }: { item: Species }) => {
    return (
      <TouchableOpacity
        style={styles.speciesCard}
        onPress={() => {
          handleNavigateToSpecies(item.id);
        }}
        disabled={!isConnected}
      >
        <View>
          <Text style={styles.speciesName}>{item.common_name}</Text>
          <Text style={styles.speciesScientificName}>{item.scientific_name}</Text>

          <View style={styles.resultTypeIndicator}>
            <Ionicons name="leaf-outline" size={12} color={theme.colors.secondary} />
            <Text style={styles.resultTypeText}>Species</Text>
          </View>
        </View>

        {isConnected && (
          <TouchableOpacity
            style={styles.speciesActionButton}
            onPress={() => {
              handleNavigateToSpecies(item.id);
            }}
          >
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Render offline state
  const renderOfflineState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="cloud-offline"
        size={60}
        color={theme.colors.error}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Search Unavailable</Text>
      <Text style={styles.emptyText}>
        You&apos;re currently offline. Search functionality is unavailable while offline.
      </Text>
      <TouchableOpacity
        style={styles.offlineButton}
        onPress={() => navigation.navigate("Downloads")}
      >
        <Ionicons name="download" size={20} color={theme.colors.onPrimary} />
        <Text style={styles.offlineButtonText}>View Downloads</Text>
      </TouchableOpacity>
    </View>
  );

  // Render search results
  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (totalResultCount === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search-outline"
            size={60}
            color={isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.3)"}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyText}>
            We couldn&apos;t find any results for &quot;{searchQuery}&quot;
          </Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.resultCount}>
          Found {totalResultCount} {totalResultCount === 1 ? "result" : "results"}
        </Text>

        {species.length > 0 && (
          <>
            <Text style={styles.resultsHeader}>Species</Text>
            {species.map((item) => (
              <View key={`species-${item.id}`}>{renderSpeciesItem({ item })}</View>
            ))}
          </>
        )}

        {species.length > 0 && recordings.length > 0 && <View style={styles.sectionDivider} />}

        {recordings.length > 0 && (
          <>
            <Text style={styles.resultsHeader}>Recordings</Text>
            {recordings.map((item) => (
              <View key={`recording-${item.id}`}>{renderRecordingItem({ item })}</View>
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  return (
    <View style={styles.container}>
      <BackgroundPattern />

      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Search</Text>
              <Text style={styles.subtitle}>Find recordings and species</Text>
              {!isConnected && (
                <View style={styles.offlineBadge}>
                  <Ionicons name="cloud-offline" size={12} color={theme.colors.error} />
                  <Text style={styles.offlineBadgeText}>Offline Mode</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.searchContainer, !isConnected && styles.searchContainerDisabled]}>
            <Ionicons
              name="search"
              size={20}
              color={isConnected ? theme.colors.primary : theme.colors.onSurfaceDisabled}
            />
            <TextInput
              placeholder="Search species, recordings, or pages..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={(text) => {
                if (isConnected) {
                  setSearchQuery(text);
                  handleSearch(text);
                }
              }}
              style={[styles.searchInput, !isConnected && styles.searchInputDisabled]}
              autoFocus={isConnected}
              selectionColor={theme.colors.primary}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(searchQuery)}
              editable={isConnected}
            />
            {searchQuery && isConnected && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {!isConnected ? (
        renderOfflineState()
      ) : searchQuery ? (
        <>
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chip
                selected={activeFilter === "all"}
                onPress={() => setActiveFilter("all")}
                style={styles.filterChip}
                selectedColor={theme.colors.primary}
              >
                All
              </Chip>
              <Chip
                selected={activeFilter === "species"}
                onPress={() => setActiveFilter("species")}
                style={styles.filterChip}
                selectedColor={theme.colors.primary}
              >
                Species
              </Chip>
              <Chip
                selected={activeFilter === "recordings"}
                onPress={() => setActiveFilter("recordings")}
                style={styles.filterChip}
                selectedColor={theme.colors.primary}
              >
                Recordings
              </Chip>
              <Chip
                selected={activeFilter === "pages"}
                onPress={() => setActiveFilter("pages")}
                style={styles.filterChip}
                selectedColor={theme.colors.primary}
                disabled={!/^\d+$/.test(searchQuery.trim())}
              >
                Pages
              </Chip>
            </ScrollView>
          </View>
          {renderSearchResults()}
        </>
      ) : (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.clearText}>Clear All</Text>
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
                    if (isConnected) {
                      setSearchQuery(item.query);
                      handleSearch(item.query);
                    }
                  }}
                  disabled={!isConnected}
                >
                  <View style={styles.recentItemIcon}>
                    <Ionicons name="time-outline" size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.recentItemTextContainer}>
                    <Text style={styles.recentQueryText}>{item.name}</Text>
                    <Text style={styles.recentItemTimestamp}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons
                    name="search"
                    size={20}
                    color={isConnected ? theme.colors.primary : theme.colors.onSurfaceDisabled}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `recent-${index}`}
            />
          ) : (
            <View style={styles.emptyRecentContainer}>
              <Ionicons
                name="search-outline"
                size={60}
                color={isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.3)"}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Recent Searches</Text>
              <Text style={styles.emptyText}>Your recent searches will appear here</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default SearchScreen;
