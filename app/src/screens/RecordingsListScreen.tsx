import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AnimatedTabBar from "../components/AnimatedTabBar";
import BackgroundPattern from "../components/BackgroundPattern";
import FilterButtons from "../components/FilterButtons";
import { useGlobalAudioBarHeight } from "../components/GlobalAudioBar";
import RecordingCard from "../components/RecordingCard";
import { Input } from "../components/ui";
import { Button } from "../components/ui/Button";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { fetchRecordingsByBookOrder, fetchSpecies } from "../lib/supabase";
import { createThemedTextStyle } from "../lib/theme/typography";
import type { Recording, Species } from "../types";
import { RootStackParamList } from "../types";

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

const RecordingsListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDownloaded } = useContext(DownloadContext);
  const { theme } = useEnhancedTheme();
  const globalAudioBarHeight = useGlobalAudioBarHeight();

  const [activeTab, setActiveTab] = useState("book");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchQuery = useDebounce(searchInput, 300); // 300ms debounce delay
  const [showSearch, setShowSearch] = useState(false);
  const insets = useSafeAreaInsets();

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<"title" | "species" | "page">("page");
  const [downloadedFilter, setDownloadedFilter] = useState<"all" | "downloaded" | "not_downloaded">(
    "all"
  );

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    emptyContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: theme.spacing.xl,
    },
    emptyIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      color: theme.colors.onSurface,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.xl,
      marginHorizontal: theme.spacing.xl,
      textAlign: "center",
    },
    emptyTitle: {
      color: theme.colors.onSurface,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
    errorContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: theme.spacing.xl,
    },
    errorText: {
      color: theme.colors.error,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.xl,
      marginHorizontal: theme.spacing.xl,
      textAlign: "center",
    },
    header: {
      paddingBottom: theme.spacing.sm,
      paddingTop: theme.spacing.sm + insets.top,
      zIndex: theme.zIndex.base,
    },
    headerActions: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 1,
      gap: theme.spacing.sm,
    },
    headerInner: {
      paddingHorizontal: theme.spacing.md,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerTextContainer: {
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.lg,
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 0,
      paddingTop: 0,
    },
    loadingContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: theme.spacing.xl,
    },
    loadingText: {
      color: theme.colors.onSurface,
    },
    searchContainer: {
      alignSelf: "center",
      marginBottom: 0,
      marginHorizontal: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      width: "94%",
    },
    searchInput: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      flexDirection: "row",
      height: 46,
      overflow: "hidden",
      paddingHorizontal: theme.spacing.xs,
      position: "relative",
    },
    sectionHeader: {
      backgroundColor: theme.colors.background,
      paddingBottom: theme.spacing.sm,
      paddingLeft: theme.spacing.xl,
      paddingRight: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
    },
    sectionSubHeaderText: {
      color: theme.colors.onSurfaceVariant,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: theme.spacing.xs,
    },
    speciesAction: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: theme.spacing.sm,
    },
    speciesActionButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      elevation: 1,
      height: 32,
      justifyContent: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      width: 32,
    },
    speciesCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      elevation: 2,
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    speciesContent: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 48,
    },
    speciesInfo: {
      flex: 1,
      marginRight: theme.spacing.sm,
      minWidth: 0,
    },
    speciesName: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "bold",
        color: "onSurface",
      }),
      lineHeight: 22,
      marginBottom: theme.spacing.xxs,
    },
    speciesScientificName: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      fontStyle: "italic",
      lineHeight: 18,
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
  });

  // Fetch species
  const {
    data: species,
    isLoading: speciesLoading,
    error: speciesError,
    refetch: refetchSpecies,
  } = useQuery({
    queryKey: ["species"],
    queryFn: fetchSpecies,
  });

  // Effect to refetch data when connection is restored
  useEffect(() => {
    refetchRecordings();
    refetchSpecies();
  }, [refetchRecordings, refetchSpecies]);

  // Calculate search score for recordings based on match quality
  const getRecordingSearchScore = (recording: Recording, query: string): number => {
    if (!query) return 1; // Return high score if no query (show all)

    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Exact title match (highest priority)
    if (recording.title.toLowerCase() === lowerQuery) {
      score += 100;
    }
    // Title starts with query
    else if (recording.title.toLowerCase().startsWith(lowerQuery)) {
      score += 80;
    }
    // Title contains query
    else if (recording.title.toLowerCase().includes(lowerQuery)) {
      score += 60;
    }

    // Exact scientific name match (high priority)
    if (recording.species?.scientific_name.toLowerCase() === lowerQuery) {
      score += 90;
    }
    // Scientific name starts with query
    else if (recording.species?.scientific_name.toLowerCase().startsWith(lowerQuery)) {
      score += 70;
    }
    // Scientific name contains query
    else if (recording.species?.scientific_name.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }

    // Exact common name match (medium-high priority)
    if (recording.species?.common_name.toLowerCase() === lowerQuery) {
      score += 85;
    }
    // Common name starts with query
    else if (recording.species?.common_name.toLowerCase().startsWith(lowerQuery)) {
      score += 65;
    }
    // Common name contains query
    else if (recording.species?.common_name.toLowerCase().includes(lowerQuery)) {
      score += 45;
    }

    // Caption contains query (lower priority)
    if (recording.caption.toLowerCase().includes(lowerQuery)) {
      score += 30;
    }

    // Book page number exact match (lowest priority but still relevant)
    if (recording.book_page_number.toString() === lowerQuery) {
      score += 35;
    }
    // Book page number contains query
    else if (recording.book_page_number.toString().includes(lowerQuery)) {
      score += 15;
    }

    return score;
  };

  const getSpeciesSearchScore = (species: Species, query: string): number => {
    if (!query) return 1; // Return high score if no query (show all)

    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Exact common name match (highest priority)
    if (species.common_name.toLowerCase() === lowerQuery) {
      score += 100;
    }
    // Common name starts with query
    else if (species.common_name.toLowerCase().startsWith(lowerQuery)) {
      score += 80;
    }
    // Common name contains query
    else if (species.common_name.toLowerCase().includes(lowerQuery)) {
      score += 60;
    }

    // Exact scientific name match (high priority)
    if (species.scientific_name.toLowerCase() === lowerQuery) {
      score += 90;
    }
    // Scientific name starts with query
    else if (species.scientific_name.toLowerCase().startsWith(lowerQuery)) {
      score += 70;
    }
    // Scientific name contains query
    else if (species.scientific_name.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }

    return score;
  };

  const filteredAndSortedRecordings = React.useMemo(() => {
    if (!recordings) return [];

    return recordings
      .map((recording) => ({
        item: recording,
        score: getRecordingSearchScore(recording, debouncedSearchQuery),
      }))
      .filter(({ item, score }) => {
        // Search filter
        if (debouncedSearchQuery && score === 0) return false;

        // Download status filter
        if (downloadedFilter === "downloaded" && !isDownloaded(item.id)) return false;
        if (downloadedFilter === "not_downloaded" && isDownloaded(item.id)) return false;

        return true;
      })
      .sort((a, b) => {
        // If there's a search query, prioritize by search score first
        if (debouncedSearchQuery) {
          if (a.score !== b.score) {
            return b.score - a.score;
          }
        }

        // Then sort by selected criteria
        let comparison = 0;

        switch (sortBy) {
          case "title":
            comparison = a.item.title.localeCompare(b.item.title);
            break;
          case "species":
            comparison = (a.item.species?.common_name || "").localeCompare(
              b.item.species?.common_name || ""
            );
            break;
          case "page":
            comparison = a.item.book_page_number - b.item.book_page_number;
            break;
        }

        return sortOrder === "asc" ? comparison : -comparison;
      })
      .map(({ item }) => item);
  }, [recordings, debouncedSearchQuery, downloadedFilter, sortBy, sortOrder, isDownloaded]);

  // Enhanced species filtering and sorting with memoization
  const filteredAndSortedSpecies = React.useMemo(() => {
    if (!species) return [];

    return species
      .map((species) => ({
        item: species,
        score: getSpeciesSearchScore(species, debouncedSearchQuery),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        // If there's a search query, prioritize by search score first
        if (debouncedSearchQuery) {
          if (a.score !== b.score) {
            return b.score - a.score;
          }
        }

        // Then sort alphabetically by common name
        const comparison = a.item.common_name.localeCompare(b.item.common_name);
        return sortOrder === "asc" ? comparison : -comparison;
      })
      .map(({ item }) => item);
  }, [species, debouncedSearchQuery, sortOrder]);

  // Group recordings by species for SectionList when sorting by species
  const recordingsSections = React.useMemo(() => {
    if (sortBy !== "species" || !filteredAndSortedRecordings) return [];

    const map = new Map<string, { title: string; data: Recording[] }>();

    filteredAndSortedRecordings.forEach((rec) => {
      const commonName = rec.species?.common_name || "Unknown Species";
      const scientificName = rec.species?.scientific_name || "";
      const title = scientificName ? `${commonName} • ${scientificName}` : commonName;

      if (!map.has(commonName)) {
        map.set(commonName, { title, data: [] });
      }
      map.get(commonName)?.data.push(rec);
    });

    // Sort sections alphabetically by common name
    return Array.from(map.values()).sort((a, b) => {
      const aName = a.title.split(" • ")[0];
      const bName = b.title.split(" • ")[0];
      return aName.localeCompare(bName);
    });
  }, [filteredAndSortedRecordings, sortBy]);

  // Render recording item
  const renderRecordingItem = React.useCallback(
    ({ item }: { item: Recording }) => {
      const isItemDownloaded = isDownloaded(item.id);

      return (
        <RecordingCard
          recording={item}
          sortBy={sortBy}
          isDownloaded={isItemDownloaded}
          showSpeciesInfo={sortBy !== "species"}
          showCaption={sortBy === "species"}
          indented={sortBy === "species"}
        />
      );
    },
    [sortBy, isDownloaded]
  );

  // Render species item
  const renderSpeciesItem = React.useCallback(
    ({ item }: { item: Species }) => {
      return (
        <TouchableOpacity
          style={styles.speciesCard}
          onPress={() => {
            navigation.navigate("SpeciesDetails", { speciesId: item.id });
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${item.common_name} (${item.scientific_name})`}
          accessibilityHint="Tap to view species details and recordings"
        >
          <View style={styles.speciesContent}>
            <View style={styles.speciesInfo}>
              <Text style={styles.speciesName} numberOfLines={1} ellipsizeMode="tail">
                {item.common_name}
              </Text>
              <Text style={styles.speciesScientificName} numberOfLines={1} ellipsizeMode="tail">
                {item.scientific_name}
              </Text>
            </View>

            <View style={styles.speciesAction}>
              <View style={styles.speciesActionButton}>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.onPrimary} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [
      navigation,
      styles.speciesAction,
      styles.speciesActionButton,
      styles.speciesCard,
      styles.speciesContent,
      styles.speciesInfo,
      styles.speciesName,
      styles.speciesScientificName,
      theme.colors.onPrimary,
    ]
  );

  // Empty state component
  const EmptyState = ({ type }: { type: "recordings" | "species" }) => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={type === "recordings" ? "disc-outline" : "leaf-outline"}
        size={60}
        color={theme.colors.error}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {type === "recordings" ? "No Recordings Found" : "No Species Found"}
      </Text>
      <Text style={styles.emptyText}>
        {type === "recordings"
          ? "We couldn't find any recordings matching your search."
          : "We couldn't find any species matching your search."}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text
                style={createThemedTextStyle(theme, {
                  size: "6xl",
                  weight: "bold",
                  color: "secondary",
                })}
              >
                Library
              </Text>
              <Text
                style={createThemedTextStyle(theme, {
                  size: "lg",
                  weight: "normal",
                  color: "onSurfaceVariant",
                })}
              >
                Explore bird recordings and species
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Button
                variant="outline"
                size="icon"
                icon={{ name: showSearch ? "close" : "search" }}
                onPress={() => {
                  setShowSearch((prev) => !prev);
                  setSearchInput("");
                }}
              />
            </View>
          </View>

          {showSearch ? (
            <Input
              placeholder={activeTab === "book" ? "Search recordings..." : "Search species..."}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchInput}
              leftIcon={{ name: "search", color: theme.colors.tertiary }}
              clearButton={!!searchInput}
              onChangeText={setSearchInput}
              innerContainerStyle={styles.searchInput}
              selectionColor={theme.colors.primary}
              returnKeyType="search"
              style={styles.searchContainer}
            />
          ) : (
            <AnimatedTabBar activeTab={activeTab} onTabChange={setActiveTab} theme={theme} />
          )}
          {activeTab === "book" && (
            <FilterButtons
              theme={theme}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              downloadedFilter={downloadedFilter}
              setDownloadedFilter={setDownloadedFilter}
            />
          )}
        </View>
      </View>

      {recordingsLoading || speciesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
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
        <>
          <View style={styles.listContainer}>
            {/* Only render the active tab's FlatList */}
            {activeTab === "book" &&
              (sortBy === "species" ? (
                <SectionList
                  sections={recordingsSections}
                  contentContainerStyle={{ paddingBottom: globalAudioBarHeight }}
                  keyExtractor={(item) => `recording-${item.id}`}
                  renderItem={renderRecordingItem}
                  renderSectionHeader={({ section: { title } }) => {
                    const [commonName, scientificName] = title.split(" • ");
                    return (
                      <View style={styles.sectionHeader}>
                        <Text
                          style={createThemedTextStyle(theme, {
                            size: "lg",
                            weight: "bold",
                            color: "primary",
                          })}
                        >
                          {commonName}
                        </Text>
                        {scientificName && (
                          <Text style={styles.sectionSubHeaderText}>{scientificName}</Text>
                        )}
                      </View>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={15}
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
                  data={filteredAndSortedRecordings}
                  contentContainerStyle={{ paddingBottom: globalAudioBarHeight }}
                  renderItem={renderRecordingItem}
                  keyExtractor={(item) => `recording-${item.id}`}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={15}
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
              ))}

            {activeTab === "species" && (
              <FlatList
                data={filteredAndSortedSpecies}
                contentContainerStyle={{ paddingBottom: globalAudioBarHeight }}
                renderItem={renderSpeciesItem}
                keyExtractor={(item) => `species-${item.id}`}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={15}
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
        </>
      )}
    </View>
  );
};

export default RecordingsListScreen;
