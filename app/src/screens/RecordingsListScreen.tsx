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
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AnimatedTabBar from "../components/AnimatedTabBar";
import BackgroundPattern from "../components/BackgroundPattern";
import DownloadedBadge from "../components/DownloadedBadge";
import { useGlobalAudioBarHeight } from "../components/GlobalAudioBar";
import MiniAudioPlayer from "../components/MiniAudioPlayer";
import PageBadge from "../components/PageBadge";
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
    recordingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    recordingLeftSection: {
      flex: 1,
      minWidth: 0,
    },
    recordingBadges: {
      marginTop: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 0,
    },
    recordingSpecies: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.xs,
    },
    scientificName: {
      color: theme.colors.onSurfaceVariant,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      flex: 1,
      marginRight: theme.spacing.xs,
    },
    audioPlayerContainer: {
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginLeft: theme.spacing.md,
    },
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
    filterButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.lg,
      elevation: 1,
      flexDirection: "row",
      marginRight: theme.spacing.sm,
      marginVertical: theme.spacing.xs,
      minHeight: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowOpacity: 0.15,
    },
    filterButtonIcon: {
      marginRight: theme.spacing.xs,
    },
    filterButtonText: {
      color: theme.colors.onSurfaceVariant,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
    },
    filterButtonTextActive: {
      color: theme.colors.onPrimary,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onPrimary",
      }),
    },
    filterButtonsContainer: {
      marginHorizontal: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    filterDivider: {
      alignSelf: "center",
      backgroundColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.xs,
      height: 24,
      marginHorizontal: theme.spacing.sm,
      opacity: 0.4,
      width: theme.spacing.sm,
    },
    filterRow: {
      alignItems: "center",
      flexDirection: "row",
      paddingHorizontal: theme.spacing.sm,
    },
    filterSectionTitle: {
      alignSelf: "center",
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginLeft: 0,
      marginRight: theme.spacing.sm,
      textTransform: "uppercase",
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
    scrollViewFilters: {
      alignItems: "center",
      paddingRight: theme.spacing.sm,
    },
    searchContainer: {
      marginBottom: 0,
      marginHorizontal: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      alignSelf: "center",
      width: "94%",
    },
    searchInput: {
      alignItems: "center",
      height: 46,
      flexDirection: "row",
      overflow: "hidden",
      paddingHorizontal: theme.spacing.xs,
      position: "relative",
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    speciesAction: {
      marginLeft: 8,
    },
    speciesActionButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      height: 30,
      justifyContent: "center",
      width: 30,
    },
    speciesCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 0.5 },
      shadowOpacity: 0.4,
      shadowRadius: 1,
      elevation: 2,
    },
    headerTextContainer: {
      marginLeft: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    speciesContent: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    speciesName: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "bold",
        color: "primary",
      }),
      marginBottom: theme.spacing.xs,
    },
    sectionHeader: {
      backgroundColor: theme.colors.background,
      paddingLeft: theme.spacing.xl,
      paddingRight: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.sm,
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
    recordingCardIndented: {
      marginLeft: theme.spacing.xl,
    },
    caption: {
      color: theme.colors.onSurfaceVariant,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: theme.spacing.xs,
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

  const filteredAndSortedRecordings = recordings
    ?.map((recording) => ({
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

  // Enhanced species filtering and sorting
  const filteredAndSortedSpecies = species
    ?.map((species) => ({
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
    return Array.from(map.values());
  }, [filteredAndSortedRecordings, sortBy]);

  // Render recording item
  const renderRecordingItem = ({ item }: { item: Recording }) => {
    const isItemDownloaded = isDownloaded(item.id);

    return (
      <TouchableOpacity
        style={[styles.recordingCard, sortBy === "species" && styles.recordingCardIndented]}
        onPress={() => {
          navigation.navigate("RecordingDetails", { recordingId: item.id });
        }}
        activeOpacity={0.72}
      >
        <View style={styles.recordingLeftSection}>
          <Text
            style={createThemedTextStyle(theme, {
              size: "xl",
              weight: "bold",
              color: "primary",
            })}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {sortBy !== "species" && (
            <View style={styles.recordingSpecies}>
              <Text
                style={createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                })}
                numberOfLines={1}
              >
                {item.species?.common_name}
              </Text>
              <Text style={styles.scientificName} numberOfLines={1}>
                {" "}
                • {item.species?.scientific_name}
              </Text>
            </View>
          )}
          {sortBy === "species" && (
            <View style={styles.recordingSpecies}>
              <Text style={styles.caption} numberOfLines={2}>
                {item.caption}
              </Text>
            </View>
          )}

          <View style={styles.recordingBadges}>
            <PageBadge page={item.book_page_number} />
            {isItemDownloaded && <DownloadedBadge />}
          </View>
        </View>

        <View style={styles.audioPlayerContainer}>
          <MiniAudioPlayer recording={item} size={40} />
        </View>
      </TouchableOpacity>
    );
  };

  // Render species item
  const renderSpeciesItem = ({ item }: { item: Species }) => {
    return (
      <TouchableOpacity
        style={styles.speciesCard}
        onPress={() => {
          navigation.navigate("SpeciesDetails", { speciesId: item.id });
        }}
      >
        <View style={styles.speciesContent}>
          <View>
            <Text style={styles.speciesName}>{item.common_name}</Text>
            <Text
              style={createThemedTextStyle(theme, {
                size: "base",
                weight: "normal",
                color: "onSurfaceVariant",
              })}
            >
              {item.scientific_name}
            </Text>
          </View>

          <View style={styles.speciesAction}>
            <View style={styles.speciesActionButton}>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
                  color: "primary",
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
            <View style={styles.filterButtonsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewFilters}
              >
                <View style={styles.filterRow}>
                  <Text style={styles.filterSectionTitle}>Sort By</Text>
                  <TouchableOpacity
                    style={[styles.filterButton, sortBy === "page" && styles.filterButtonActive]}
                    onPress={() => setSortBy("page")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="book-outline"
                      size={14}
                      color={
                        sortBy === "page" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                      }
                      style={styles.filterButtonIcon}
                    />
                    <Text
                      style={[
                        createThemedTextStyle(theme, {
                          size: "base",
                          weight: "normal",
                          color: "onSurfaceVariant",
                        }),
                        sortBy === "page" &&
                          createThemedTextStyle(theme, {
                            size: "base",
                            weight: "normal",
                            color: "onPrimary",
                          }),
                      ]}
                    >
                      Page
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, sortBy === "title" && styles.filterButtonActive]}
                    onPress={() => setSortBy("title")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="text-outline"
                      size={14}
                      color={
                        sortBy === "title" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                      }
                      style={styles.filterButtonIcon}
                    />
                    <Text
                      style={[
                        createThemedTextStyle(theme, {
                          size: "base",
                          weight: "normal",
                          color: "onSurfaceVariant",
                        }),
                        sortBy === "title" &&
                          createThemedTextStyle(theme, {
                            size: "base",
                            weight: "normal",
                            color: "onPrimary",
                          }),
                      ]}
                    >
                      Title
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, sortBy === "species" && styles.filterButtonActive]}
                    onPress={() => setSortBy("species")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="leaf-outline"
                      size={14}
                      color={
                        sortBy === "species"
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                      style={styles.filterButtonIcon}
                    />
                    <Text
                      style={[
                        styles.filterButtonText,
                        sortBy === "species" && styles.filterButtonTextActive,
                      ]}
                    >
                      Species
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, sortOrder === "desc" && styles.filterButtonActive]}
                    onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={sortOrder === "asc" ? "arrow-down-outline" : "arrow-up-outline"}
                      size={14}
                      color={
                        sortOrder === "desc"
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                      style={styles.filterButtonIcon}
                    />
                    <Text
                      style={[
                        createThemedTextStyle(theme, {
                          size: "base",
                          weight: "normal",
                          color: "onSurfaceVariant",
                        }),
                        sortOrder === "desc" &&
                          createThemedTextStyle(theme, {
                            size: "base",
                            weight: "normal",
                            color: "onPrimary",
                          }),
                      ]}
                    >
                      {sortOrder === "asc"
                        ? sortBy === "page"
                          ? "1→100"
                          : sortBy === "title"
                            ? "A→Z"
                            : "A→Z"
                        : sortBy === "page"
                          ? "100→1"
                          : sortBy === "title"
                            ? "Z→A"
                            : "Z→A"}
                    </Text>
                  </TouchableOpacity>

                  {/* Divider between groups */}
                  <View style={styles.filterDivider} />
                  <Text style={styles.filterSectionTitle}>Filter By</Text>

                  {/* Filter By Buttons */}
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      downloadedFilter === "all" && styles.filterButtonActive,
                    ]}
                    onPress={() => setDownloadedFilter("all")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="albums-outline"
                      size={14}
                      color={
                        downloadedFilter === "all"
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                      style={styles.filterButtonIcon}
                    />
                    <Text
                      style={[
                        createThemedTextStyle(theme, {
                          size: "base",
                          weight: "normal",
                          color: "onSurfaceVariant",
                        }),
                        downloadedFilter === "all" &&
                          createThemedTextStyle(theme, {
                            size: "base",
                            weight: "normal",
                            color: "onPrimary",
                          }),
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      downloadedFilter === "downloaded" && styles.filterButtonActive,
                    ]}
                    onPress={() => setDownloadedFilter("downloaded")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="cloud-done-outline"
                      size={14}
                      color={
                        downloadedFilter === "downloaded"
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                      style={styles.filterButtonIcon}
                    />
                    <Text
                      style={[
                        styles.filterButtonText,
                        downloadedFilter === "downloaded" && styles.filterButtonTextActive,
                      ]}
                    >
                      Downloaded
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      downloadedFilter === "not_downloaded" && styles.filterButtonActive,
                    ]}
                    onPress={() => setDownloadedFilter("not_downloaded")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="cloud-outline"
                      size={14}
                      color={
                        downloadedFilter === "not_downloaded"
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                      style={styles.filterButtonIcon}
                    />
                    <Text
                      style={[
                        styles.filterButtonText,
                        downloadedFilter === "not_downloaded" && styles.filterButtonTextActive,
                      ]}
                    >
                      Online Only
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
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
                  keyExtractor={(item) => item.id}
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
              ))}

            {activeTab === "species" && (
              <FlatList
                data={filteredAndSortedSpecies}
                contentContainerStyle={{ paddingBottom: globalAudioBarHeight }}
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
        </>
      )}
    </View>
  );
};

export default RecordingsListScreen;
