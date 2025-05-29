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
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DownloadedBadge from "../components/DownloadedBadge";
import PageBadge from "../components/PageBadge";
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
  const { theme } = useThemedStyles();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults>({
    recordings: [],
    species: [],
  });
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "species" | "recordings">("all");
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    backgroundPattern: {
      backgroundColor: theme.colors.background,
      bottom: 0,
      left: 0,
      opacity: 0.6,
      position: "absolute",
      right: 0,
      top: 0,
    },
    cardFooter: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.outlineVariant,
      borderTopWidth: 1,
      flexDirection: "row",
      justifyContent: "flex-end",
      padding: 12,
    },
    clearText: {
      color: theme.colors.tertiary,
      fontWeight: "600",
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
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
    filterContainer: {
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: 1,
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    filterTab: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 80,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    filterTabIndicator: {
      backgroundColor: theme.colors.primary,
      borderRadius: 1,
      bottom: -1,
      height: 2,
      left: 0,
      position: "absolute",
      right: 0,
    },
    filterTabText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      textAlign: "center",
    },
    filterTabTextActive: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 4,
      paddingBottom: 20,
      paddingTop: 16 + insets.top,
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
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    recentItemIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.onTertiary,
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
      borderLeftColor: theme.colors.primary,
      borderLeftWidth: 4,
      borderRadius: 16,
      elevation: 3,
      marginVertical: 10,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    resultCardContent: {
      padding: 16,
    },
    resultCount: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 8,
    },
    resultHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    resultMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
    },
    resultTitle: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: "700",
    },
    resultTitleContainer: {
      flex: 1,
      marginRight: 8,
    },
    resultTypeIndicator: {
      alignItems: "center",
      backgroundColor: theme.colors.onSecondary,
      borderRadius: 8,
      flexDirection: "row",
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
      marginTop: 2,
    },
    searchContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 50,
      borderWidth: 1,
      flexDirection: "row",
      height: 46,
      marginHorizontal: 4,
      marginTop: 12,
      paddingHorizontal: 16,
    },
    searchInput: {
      color: theme.colors.onSurface,
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
      paddingVertical: 10,
    },
    sectionDivider: {
      backgroundColor: theme.colors.surfaceVariant,
      height: 1,
      marginVertical: 16,
      width: "100%",
    },
    speciesCard: {
      backgroundColor: theme.colors.surface,
      borderLeftColor: theme.colors.secondary,
      borderLeftWidth: 4,
      borderRadius: 16,
      elevation: 3,
      marginVertical: 10,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    speciesCardContent: {
      padding: 16,
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
      marginBottom: 10,
      marginTop: 2,
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
    viewDetailButton: {
      alignItems: "center",
      flexDirection: "row",
    },
    viewDetailText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "600",
      marginRight: 4,
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

  // Add a sanitize function at the component level
  const sanitizeQuery = (query: string): string => {
    return query.replace(/[%_'"\\[\]{}()*+?.,^$|#\s]/g, " ").trim();
  };

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

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
    const sanitizedQuery = sanitizeQuery(searchQuery);

    if (activeFilter === "all") {
      return searchResults;
    } else if (activeFilter === "species") {
      return { recordings: [], species: searchResults.species };
    } else if (activeFilter === "recordings") {
      return { recordings: searchResults.recordings, species: [] };
    } else if (activeFilter === "pages" && /^\d+$/.test(sanitizedQuery)) {
      // Filter recordings by page number
      const pageNumber = parseInt(sanitizedQuery, 10);
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
      >
        <View style={styles.resultCardContent}>
          <View style={styles.resultHeader}>
            <View style={styles.resultTitleContainer}>
              <Text style={styles.resultTitle}>{item.title}</Text>
              {item.species && (
                <Text style={styles.scientificName}>{item.species.scientific_name}</Text>
              )}
            </View>
            {isDownloaded(item.id) && <DownloadedBadge />}
          </View>

          <View style={styles.resultMeta}>
            <PageBadge page={item.book_page_number} />

            <View style={styles.resultTypeIndicator}>
              <Ionicons name="musical-notes-outline" size={12} color={theme.colors.secondary} />
              <Text style={styles.resultTypeText}>Recording</Text>
            </View>
          </View>
        </View>

        {isConnected && (
          <View style={styles.cardFooter}>
            <View>{/* You could add additional info here if needed */}</View>
            <TouchableOpacity
              style={styles.viewDetailButton}
              onPress={() => {
                handleNavigateToRecording(item.id);
              }}
            >
              <Text style={styles.viewDetailText}>View Details</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
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
      >
        <View style={styles.speciesCardContent}>
          <View>
            <Text style={styles.speciesName}>{item.common_name}</Text>
            <Text style={styles.speciesScientificName}>{item.scientific_name}</Text>
            <View style={styles.resultMeta}>
              <View style={styles.resultTypeIndicator}>
                <Ionicons name="leaf-outline" size={12} color={theme.colors.secondary} />
                <Text style={styles.resultTypeText}>Species</Text>
              </View>
            </View>
          </View>
        </View>

        {isConnected && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.viewDetailButton}
              onPress={() => {
                handleNavigateToSpecies(item.id);
              }}
            >
              <Text style={styles.viewDetailText}>View Details</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
            color={theme.colors.surface}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyText}>
            We couldn&apos;t find any results for &quot;{sanitizeQuery(searchQuery)}&quot;
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
            </View>
          </View>

          <View style={styles.searchContainer}>
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
              style={styles.searchInput}
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
          {searchQuery && (
            <>
              <View style={styles.filterContainer}>
                <TouchableOpacity onPress={() => setActiveFilter("all")} style={styles.filterTab}>
                  <Text
                    style={[
                      styles.filterTabText,
                      activeFilter === "all" && styles.filterTabTextActive,
                    ]}
                  >
                    All
                  </Text>
                  {activeFilter === "all" && <View style={styles.filterTabIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveFilter("species")}
                  style={styles.filterTab}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      activeFilter === "species" && styles.filterTabTextActive,
                    ]}
                  >
                    Species
                  </Text>
                  {activeFilter === "species" && <View style={styles.filterTabIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveFilter("recordings")}
                  style={styles.filterTab}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      activeFilter === "recordings" && styles.filterTabTextActive,
                    ]}
                  >
                    Recordings
                  </Text>
                  {activeFilter === "recordings" && <View style={styles.filterTabIndicator} />}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {searchQuery ? (
        <>{renderSearchResults()}</>
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
                    setSearchQuery(item.query);
                    handleSearch(item.query);
                  }}
                >
                  <View style={styles.recentItemIcon}>
                    <Ionicons name="time-outline" size={22} color={theme.colors.tertiary} />
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
                    color={isConnected ? theme.colors.secondary : theme.colors.onSurfaceDisabled}
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
                color={theme.colors.primary}
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
