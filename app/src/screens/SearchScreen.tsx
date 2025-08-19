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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackgroundPattern from "../components/BackgroundPattern";
import DownloadedBadge from "../components/DownloadedBadge";
import { useGlobalAudioBarHeight } from "../components/GlobalAudioBar";
import MiniAudioPlayer from "../components/MiniAudioPlayer";
import PageBadge from "../components/PageBadge";
import { Input } from "../components/ui";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { searchRecordings, type SearchResults } from "../lib/supabase";
import { createThemedTextStyle } from "../lib/theme";
import type { Recording, RootStackParamList, Species } from "../types";

// Custom debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Define a type for search history items
type SearchHistoryItem = {
  name: string;
  timestamp: string;
  query: string;
  resultType: "recording" | "species";
  resultId: string;
};

const SearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDownloaded } = useContext(DownloadContext);
  const { theme } = useEnhancedTheme();
  const globalAudioBarHeight = useGlobalAudioBarHeight();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce delay
  const [searchResults, setSearchResults] = useState<SearchResults>({
    recordings: [],
    species: [],
  });
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "species" | "recordings">("all");
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
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
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginBottom: theme.spacing.sm,
      marginHorizontal: theme.spacing.sm,
      textAlign: "center",
    },
    emptyTitle: {
      ...createThemedTextStyle(theme, {
        size: "2xl",
        weight: "bold",
        color: "onSurfaceVariant",
      }),
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    filterTab: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 80,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    filterTabIndicator: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.xs,
      bottom: -1,
      height: 2,
      left: 0,
      position: "absolute",
      right: 0,
    },
    filterTabText: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      textAlign: "center",
    },
    filterTabTextActive: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
    },
    header: {
      paddingBottom: theme.spacing.md,
      paddingTop: theme.spacing.sm + insets.top,
      zIndex: theme.zIndex.base,
    },
    headerInner: {
      paddingHorizontal: theme.spacing.xl,
    },
    listContent: {
      padding: theme.spacing.md,
      paddingBottom: globalAudioBarHeight,
    },
    loadingContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: theme.spacing.sm,
    },
    loadingText: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onBackground",
      }),
      marginTop: theme.spacing.sm,
    },
    recentContainer: {
      padding: theme.spacing.md,
      paddingBottom: globalAudioBarHeight,
    },
    recentHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    recentItem: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
      flexDirection: "row",
      marginBottom: 12,
      padding: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    recentItemContent: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      marginRight: theme.spacing.sm,
    },
    recentItemAction: {
      padding: theme.spacing.xs,
    },
    recentItemIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.onTertiary,
      borderRadius: theme.borderRadius.lg,
      height: theme.spacing.lg,
      justifyContent: "center",
      marginRight: theme.spacing.sm,
      width: theme.spacing.lg,
    },
    recentItemTextContainer: {
      flex: 1,
    },
    recentItemTimestamp: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: theme.spacing.xs,
    },
    recentQueryText: {
      flex: 1,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurface",
      }),
    },
    resultCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      marginVertical: 8,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    resultCardContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    resultCardHeader: {
      borderBottomColor: theme.colors.surfaceVariant,
      borderBottomWidth: 1,
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    resultCardLeft: {
      flex: 1,
    },
    resultCardRight: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: theme.spacing.sm,
    },
    resultCount: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "primary",
      }),
      marginTop: theme.spacing.sm,
    },
    resultMeta: {
      alignItems: "flex-start",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    resultTitle: {
      ...createThemedTextStyle(theme, {
        size: "xl",
        weight: "bold",
        color: "primary",
      }),
      marginBottom: theme.spacing.xs,
    },
    resultsHeader: {
      color: theme.colors.primary,
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    scientificName: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      fontStyle: "italic",
      marginTop: theme.spacing.xs,
    },
    searchInputContainer: {
      marginTop: theme.spacing.sm,
    },
    searchInput: {
      borderRadius: theme.borderRadius.full,
    },
    sectionDivider: {
      backgroundColor: theme.colors.surfaceVariant,
      height: 1,
      marginVertical: theme.spacing.sm,
      width: "100%",
    },
    separator: {
      height: theme.spacing.sm,
    },
    speciesName: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.xs,
    },
    typeIndicator: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.sm,
      flexDirection: "row",
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      minHeight: 20,
    },
    typeIndicatorText: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginLeft: theme.spacing.xs,
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

          // Filter to only include valid SearchHistoryItem objects with required fields
          const validSearches = parsedSearches
            .map((item: string | SearchHistoryItem) => {
              if (typeof item === "string") {
                // Skip old string format items since we can't navigate directly without resultId
                return null;
              }
              return item;
            })
            .filter(
              (item: SearchHistoryItem | null): item is SearchHistoryItem =>
                item !== null &&
                !!item.resultType &&
                !!item.resultId &&
                (item.resultType === "recording" || item.resultType === "species")
            );

          // Filter out duplicates by resultType+resultId, keeping only the most recent
          const uniqueSearches: SearchHistoryItem[] = [];
          const seenItems = new Set<string>();

          validSearches.forEach((item: SearchHistoryItem) => {
            const key = `${item.resultType}-${item.resultId}`;
            if (!seenItems.has(key)) {
              seenItems.add(key);
              uniqueSearches.push(item);
            }
          });

          setRecentSearches(uniqueSearches);

          // If we found and removed duplicates, update storage
          if (uniqueSearches.length !== validSearches.length) {
            await AsyncStorage.setItem("recentSearches", JSON.stringify(uniqueSearches));
          }
        }
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    };

    loadRecentSearches();
  }, []);

  // Save recent searches to storage with additional metadata
  const saveRecentSearch = async (
    itemName: string,
    resultType: "recording" | "species",
    resultId: string
  ) => {
    if (!itemName.trim()) return;

    try {
      // Create a search item with metadata
      const searchItem: SearchHistoryItem = {
        name: itemName,
        timestamp: new Date().toISOString(),
        query: searchQuery, // Store the original query too
        resultType,
        resultId,
      };

      // Get existing searches
      const savedSearches = await AsyncStorage.getItem("recentSearches");
      const searches: SearchHistoryItem[] = savedSearches ? JSON.parse(savedSearches) : [];

      // Add to recent searches (avoid duplicates by resultType+resultId and limit to 10)
      const updatedSearches = [
        searchItem,
        ...searches.filter(
          (s: SearchHistoryItem) => !(s.resultType === resultType && s.resultId === resultId)
        ),
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
    setHasSearched(true);

    try {
      const results = await searchRecordings(query);
      setSearchResults(results);

      // Update the active filter based on results
      if (results.recordings.length > 0 && results.species.length === 0) {
        setActiveFilter("recordings");
      } else if (results.species.length > 0 && results.recordings.length === 0) {
        setActiveFilter("species");
      } else {
        setActiveFilter("all");
      }

      // Don't save search yet - we'll save it when user clicks on a result
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle debounced search
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      handleSearch(debouncedSearchQuery);
    } else {
      setSearchResults({ recordings: [], species: [] });
      setIsLoading(false);
    }
  }, [debouncedSearchQuery]);

  // Handle navigation to recording details and save search
  const handleNavigateToRecording = (recordingId: string) => {
    // Find the recording by ID
    const recording = searchResults.recordings.find((rec) => rec.id === recordingId);
    if (recording) {
      // Save the recording title with type and ID
      saveRecentSearch(recording.title, "recording", recording.id);
    }
    navigation.navigate("RecordingDetails", { recordingId });
  };

  // Handle navigation to species details and save search
  const handleNavigateToSpecies = (speciesId: string) => {
    // Find the species by ID
    const species = searchResults.species.find((sp) => sp.id === speciesId);
    if (species) {
      // Save the species common name with type and ID
      saveRecentSearch(species.common_name, "species", species.id);
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
    // Determine the best audio URI (downloaded or remote HQ) for the mini player

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => {
          handleNavigateToRecording(item.id);
        }}
      >
        <View style={styles.resultCardHeader}>
          <Text style={styles.resultTitle}>{item.title}</Text>
          {item.species && (
            <Text style={styles.scientificName}>{item.species.scientific_name}</Text>
          )}
        </View>

        <View style={styles.resultCardContent}>
          <View style={styles.resultCardLeft}>
            <Text style={styles.speciesName}>{item.species?.common_name || "Unknown Species"}</Text>

            <View style={styles.resultMeta}>
              <PageBadge page={item.book_page_number} />

              <View style={styles.typeIndicator}>
                <Ionicons
                  name="musical-notes-outline"
                  size={12}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.typeIndicatorText}>Recording</Text>
              </View>
              {/* Download badge displayed inline with metadata */}
              {isDownloaded(item.id) && <DownloadedBadge compact />}
            </View>
          </View>

          {/* Mini player shown on the right */}
          <View style={styles.resultCardRight}>
            <MiniAudioPlayer recording={item} size={34} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render species item
  const renderSpeciesItem = ({ item }: { item: Species }) => {
    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => {
          handleNavigateToSpecies(item.id);
        }}
      >
        <View style={styles.resultCardHeader}>
          <Text style={styles.resultTitle}>{item.common_name}</Text>
          <Text style={styles.scientificName}>{item.scientific_name}</Text>
        </View>

        <View style={styles.resultCardContent}>
          <View style={styles.resultCardLeft}>
            <View style={styles.resultMeta}>
              <View style={styles.typeIndicator}>
                <Ionicons name="leaf-outline" size={12} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.typeIndicatorText}>Species</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render search results
  const renderSearchResults = () => {
    if (isLoading && !hasSearched) {
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
        {recordings.length > 0 && (
          <>
            <Text style={styles.resultsHeader}>Recordings</Text>
            {recordings.map((item) => (
              <View key={`recording-${item.id}`}>{renderRecordingItem({ item })}</View>
            ))}
          </>
        )}

        {species.length > 0 && recordings.length > 0 && <View style={styles.sectionDivider} />}

        {species.length > 0 && (
          <>
            <Text style={styles.resultsHeader}>Species</Text>
            {species.map((item) => (
              <View key={`species-${item.id}`}>{renderSpeciesItem({ item })}</View>
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <BackgroundPattern />

      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text
            style={createThemedTextStyle(theme, {
              size: "6xl",
              weight: "bold",
              color: "primary",
            })}
          >
            Search
          </Text>
          <Text
            style={createThemedTextStyle(theme, {
              size: "lg",
              weight: "normal",
              color: "onSurfaceVariant",
            })}
          >
            Find recordings and species
          </Text>

          <Input
            placeholder="Search species and recordings"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchQuery}
            leftIcon={{ name: "search", color: theme.colors.tertiary }}
            clearButton={!!searchQuery}
            onChangeText={setSearchQuery}
            innerContainerStyle={styles.searchInput}
            selectionColor={theme.colors.primary}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(debouncedSearchQuery)}
            textAlignVertical="center"
            containerStyle={styles.searchInputContainer}
          />

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

      {debouncedSearchQuery ? (
        <>{renderSearchResults()}</>
      ) : (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text
              style={createThemedTextStyle(theme, {
                size: "lg",
                weight: "normal",
                color: "primary",
              })}
            >
              Recent Searches
            </Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text
                  style={createThemedTextStyle(theme, {
                    size: "lg",
                    weight: "normal",
                    color: "primary",
                  })}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recentSearches.length > 0 ? (
            <FlatList
              data={recentSearches}
              renderItem={({ item }) => (
                <View style={styles.recentItem}>
                  {/* Main content: tap to navigate directly */}
                  <TouchableOpacity
                    style={styles.recentItemContent}
                    onPress={() => {
                      if (item.resultType === "recording" && item.resultId) {
                        navigation.navigate("RecordingDetails", { recordingId: item.resultId });
                      } else if (item.resultType === "species" && item.resultId) {
                        navigation.navigate("SpeciesDetails", { speciesId: item.resultId });
                      }
                    }}
                  >
                    <View style={styles.recentItemIcon}>
                      <Ionicons
                        name={
                          item.resultType === "recording"
                            ? "musical-notes-outline"
                            : item.resultType === "species"
                              ? "leaf-outline"
                              : "time-outline"
                        }
                        size={22}
                        color={theme.colors.tertiary}
                      />
                    </View>
                    <View style={styles.recentItemTextContainer}>
                      <Text style={styles.recentQueryText}>{item.name}</Text>
                      <Text style={styles.recentItemTimestamp}>
                        {new Date(item.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
                  </TouchableOpacity>

                  {/* Secondary action: re-search */}
                  <TouchableOpacity
                    style={styles.recentItemAction}
                    onPress={() => {
                      setSearchQuery(item.query);
                      handleSearch(item.query);
                    }}
                  >
                    <Ionicons name="search" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => `recent-${item.name}`}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={{ paddingBottom: globalAudioBarHeight }}
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
