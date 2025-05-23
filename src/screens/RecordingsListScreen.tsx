"use client";

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
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MiniAudioPlayer from "../components/MiniAudioPlayer";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getBestAudioUri } from "../lib/mediaUtils";
import { fetchRecordingsByBookOrder, fetchSpecies } from "../lib/supabase";
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
  const { isConnected } = useContext(NetworkContext);
  const { isDownloaded, getDownloadPath } = useContext(DownloadContext);
  const { theme, isDarkMode } = useThemedStyles();

  const [activeTab, setActiveTab] = useState("book");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchQuery = useDebounce(searchInput, 300); // 300ms debounce delay
  const [showSearch, setShowSearch] = useState(false);
  const insets = useSafeAreaInsets();

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<"title" | "species" | "page">("page");
  const [showFilters, setShowFilters] = useState(false);
  const [downloadedFilter, setDownloadedFilter] = useState<"all" | "downloaded" | "not_downloaded">(
    "all"
  );

  const styles = StyleSheet.create({
    activeBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      height: 8,
      position: "absolute",
      right: 6,
      top: 6,
      width: 8,
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    activeTabText: {
      color: theme.colors.onPrimary,
      fontWeight: "600",
    },
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
    caption: {
      color: theme.colors.onSurface,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    captionContainer: {
      flex: 1,
      marginRight: 12,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    downloadedIndicator: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      flexDirection: "row",
      marginLeft: 8,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    downloadedText: {
      color: theme.colors.onSurface,
      fontSize: 12,
      marginLeft: 4,
    },
    dropdownArrow: {
      backgroundColor: theme.colors.surface,
      height: 8,
      position: "absolute",
      right: 20,
      top: -4,
      transform: [{ rotate: "45deg" }],
      width: 8,
    },
    dropdownDivider: {
      backgroundColor: theme.colors.outlineVariant,
      height: 1,
      marginVertical: 8,
      opacity: 0.5,
    },
    dropdownOption: {
      alignItems: "center",
      borderRadius: 8,
      flexDirection: "row",
      minHeight: 36,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    dropdownOptionActive: {
      backgroundColor: `${theme.colors.primary}15`,
    },
    dropdownOptionText: {
      color: theme.colors.onSurface,
      flex: 1,
      fontSize: 14,
      marginLeft: 10,
    },
    dropdownOptionTextActive: {
      color: theme.colors.primary,
      fontWeight: "500",
    },
    dropdownOptions: {
      gap: 2,
    },
    dropdownResetButton: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginHorizontal: 8,
      marginTop: 4,
      paddingVertical: 8,
    },
    dropdownResetText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: "500",
      marginLeft: 6,
    },
    dropdownSection: {
      paddingHorizontal: 4,
    },
    dropdownSectionTitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 8,
      marginLeft: 12,
      textTransform: "uppercase",
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
    errorContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: 40,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 16,
      marginBottom: 24,
      marginHorizontal: 24,
      textAlign: "center",
    },
    filterDropdown: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 8,
      minWidth: 200,
      paddingVertical: 12,
      position: "absolute" as const,
      right: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      top: 80 + insets.top,
      zIndex: 1000,
    },
    // eslint-disable-next-line react-native/no-color-literals
    filterOverlay: {
      backgroundColor: "transparent",
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 999,
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
    headerActions: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    headerButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      height: 40,
      justifyContent: "center",
      position: "relative",
      width: 40,
    },
    headerButtonActive: {
      backgroundColor: `${theme.colors.primary}15`,
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
    listContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    loadingContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: 40,
    },
    loadingText: {
      color: theme.colors.onSurface,
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
    offlineBanner: {
      alignItems: "center",
      backgroundColor: isDarkMode ? `${theme.colors.error}20` : `${theme.colors.error}10`,
      borderColor: theme.colors.error,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      margin: 16,
      padding: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    offlineBannerButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      flexDirection: "row",
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    offlineBannerButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: "bold",
      marginLeft: 8,
    },
    offlineBannerIcon: {
      marginBottom: 16,
    },
    offlineBannerText: {
      color: theme.colors.onSurface,
      fontSize: 18,
      marginHorizontal: 20,
      textAlign: "center",
    },
    offlineTab: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceDisabled,
      borderRadius: 20,
      flexDirection: "row",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    offlineTabText: {
      color: theme.colors.onSurfaceDisabled,
      fontSize: 14,
      marginLeft: 6,
    },
    pageReference: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.surface,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pageText: {
      color: theme.colors.onSurface,
      fontSize: 12,
    },
    recordingCard: {
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
    recordingContent: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    recordingHeader: {
      marginBottom: 8,
    },
    recordingTitle: {
      color: theme.colors.onSurface,
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
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
      borderRadius: 20,
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
    speciesAction: {
      marginLeft: 8,
    },
    speciesActionButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 15,
      height: 30,
      justifyContent: "center",
      width: 30,
    },
    speciesCard: {
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
    speciesContent: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    speciesName: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      marginTop: 2,
    },
    tab: {
      alignItems: "center",
      borderRadius: 20,
      flexDirection: "row",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    tabBar: {
      alignSelf: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: "row",
      marginTop: 12,
      padding: 4,
      width: "94%",
    },
    tabText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginLeft: 6,
    },
    title: {
      color: theme.colors.primary,
      fontSize: 28,
      fontWeight: "bold",
    },
    titleContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
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
    enabled: isConnected, // Only fetch when online
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
    enabled: isConnected, // Only fetch when online
  });

  // Effect to refetch data when connection is restored
  useEffect(() => {
    if (isConnected) {
      // Refetch data when we come back online
      refetchRecordings();
      refetchSpecies();
    }
  }, [isConnected, refetchRecordings, refetchSpecies]);

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

  // Filter Panel Component - add this before the main component return
  const FilterDropdown = () => (
    <View style={styles.filterDropdown}>
      <View style={styles.dropdownArrow} />
      <View style={styles.dropdownSection}>
        {activeTab === "book" && (
          <>
            <Text style={styles.dropdownSectionTitle}>Sort by</Text>
            <View style={styles.dropdownOptions}>
              {[
                { key: "page", label: "Page", icon: "book" },
                { key: "title", label: "Title", icon: "text" },
                { key: "species", label: "Species", icon: "leaf" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.dropdownOption,
                    sortBy === option.key && styles.dropdownOptionActive,
                  ]}
                  onPress={() => setSortBy(option.key as typeof sortBy)}
                >
                  <Ionicons
                    name={option.icon as React.ComponentProps<typeof Ionicons>["name"]}
                    size={16}
                    color={
                      sortBy === option.key ? theme.colors.primary : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      sortBy === option.key && styles.dropdownOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.key && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.dropdownDivider} />
          </>
        )}

        <View style={styles.dropdownSection}>
          <Text style={styles.dropdownSectionTitle}>Order</Text>
          <View style={styles.dropdownOptions}>
            <TouchableOpacity
              style={[styles.dropdownOption, sortOrder === "asc" && styles.dropdownOptionActive]}
              onPress={() => setSortOrder("asc")}
            >
              <Ionicons
                name="arrow-up"
                size={16}
                color={sortOrder === "asc" ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.dropdownOptionText,
                  sortOrder === "asc" && styles.dropdownOptionTextActive,
                ]}
              >
                A → Z
              </Text>
              {sortOrder === "asc" && (
                <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropdownOption, sortOrder === "desc" && styles.dropdownOptionActive]}
              onPress={() => setSortOrder("desc")}
            >
              <Ionicons
                name="arrow-down"
                size={16}
                color={sortOrder === "desc" ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.dropdownOptionText,
                  sortOrder === "desc" && styles.dropdownOptionTextActive,
                ]}
              >
                Z → A
              </Text>
              {sortOrder === "desc" && (
                <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === "book" && (
          <>
            <View style={styles.dropdownDivider} />
            <View style={styles.dropdownSection}>
              <Text style={styles.dropdownSectionTitle}>Filter</Text>
              <View style={styles.dropdownOptions}>
                {[
                  { key: "all", label: "All", icon: "list" },
                  { key: "downloaded", label: "Downloaded", icon: "cloud-done" },
                  { key: "not_downloaded", label: "Not Downloaded", icon: "cloud-outline" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dropdownOption,
                      downloadedFilter === option.key && styles.dropdownOptionActive,
                    ]}
                    onPress={() => setDownloadedFilter(option.key as typeof downloadedFilter)}
                  >
                    <Ionicons
                      name={option.icon as React.ComponentProps<typeof Ionicons>["name"]}
                      size={16}
                      color={
                        downloadedFilter === option.key
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        downloadedFilter === option.key && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {downloadedFilter === option.key && (
                      <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
        <View style={styles.dropdownDivider} />

        <TouchableOpacity
          style={styles.dropdownResetButton}
          onPress={() => {
            setSortBy("page");
            setSortOrder("asc");
            setDownloadedFilter("all");
            setShowFilters(false);
          }}
        >
          <Ionicons name="refresh" size={14} color={theme.colors.primary} />
          <Text style={styles.dropdownResetText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render recording item
  const renderRecordingItem = ({ item }: { item: Recording }) => {
    const isItemDownloaded = isDownloaded(item.id);

    return (
      <TouchableOpacity
        style={styles.recordingCard}
        onPress={() => {
          navigation.navigate("RecordingDetails", { recordingId: item.id });
        }}
      >
        <View style={styles.recordingHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.recordingTitle}>{item.title}</Text>
            {isItemDownloaded && (
              <View style={styles.downloadedIndicator}>
                <Ionicons name="cloud-done" size={14} color={isDarkMode ? "#81C784" : "#2E7D32"} />
                <Text style={styles.downloadedText}>Downloaded</Text>
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

          {(() => {
            const uri = getBestAudioUri(item, isDownloaded, getDownloadPath, isConnected);
            return uri ? <MiniAudioPlayer trackId={item.id} audioUri={uri} size={36} /> : null;
          })()}
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
            <Text style={styles.scientificName}>{item.scientific_name}</Text>
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
        color={isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.3)"}
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

  // Offline banner component
  const OfflineBanner = () => (
    <View style={styles.offlineBanner}>
      <Ionicons
        name="cloud-offline"
        size={48}
        color={theme.colors.error}
        style={styles.offlineBannerIcon}
      />
      <Text style={styles.offlineBannerText}>
        You&apos;re currently offline. Only downloaded content is available.
      </Text>
      <TouchableOpacity
        style={styles.offlineBannerButton}
        onPress={() => navigation.navigate("Downloads")}
      >
        <Ionicons name="download" size={20} color={theme.colors.onPrimary} />
        <Text style={styles.offlineBannerButtonText}>View Downloads</Text>
      </TouchableOpacity>
    </View>
  );

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Library</Text>
              <Text style={styles.subtitle}>Explore bird recordings and species</Text>
              {!isConnected && (
                <View style={styles.offlineBadge}>
                  <Ionicons name="cloud-offline" size={12} color={theme.colors.error} />
                  <Text style={styles.offlineBadgeText}>Offline Mode</Text>
                </View>
              )}
            </View>
            {isConnected && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    (sortBy !== "page" || sortOrder !== "asc" || downloadedFilter !== "all") &&
                      styles.headerButtonActive,
                  ]}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Ionicons
                    name="options"
                    size={20}
                    color={
                      sortBy !== "page" || sortOrder !== "asc" || downloadedFilter !== "all"
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  {(sortBy !== "page" || sortOrder !== "asc" || downloadedFilter !== "all") && (
                    <View style={styles.activeBadge} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => {
                    setShowSearch((prev) => !prev);
                    setSearchInput("");
                    setShowFilters(false);
                  }}
                >
                  <Ionicons
                    name={showSearch ? "close" : "search"}
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {showSearch && isConnected ? (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.primary} />
              <TextInput
                placeholder={activeTab === "book" ? "Search recordings..." : "Search species..."}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={searchInput}
                onChangeText={setSearchInput}
                style={styles.searchInput}
                autoFocus
                selectionColor={theme.colors.primary}
                returnKeyType="search"
              />
              {searchInput && (
                <TouchableOpacity onPress={() => setSearchInput("")}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.tabBar}>
              {isConnected ? (
                <>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === "book" && styles.activeTab]}
                    onPress={() => setActiveTab("book")}
                  >
                    <Ionicons
                      name="book-outline"
                      size={18}
                      color={
                        activeTab === "book"
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text style={[styles.tabText, activeTab === "book" && styles.activeTabText]}>
                      By Book Order
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === "species" && styles.activeTab]}
                    onPress={() => setActiveTab("species")}
                  >
                    <Ionicons
                      name="leaf-outline"
                      size={18}
                      color={
                        activeTab === "species"
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text style={[styles.tabText, activeTab === "species" && styles.activeTabText]}>
                      By Species
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.offlineTab}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={18}
                    color={theme.colors.onSurfaceDisabled}
                  />
                  <Text style={styles.offlineTabText}>Offline Mode</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {!isConnected && <OfflineBanner />}

      {!isConnected ? (
        <View style={styles.listContainer}>
          <FlatList
            data={[]}
            renderItem={() => null}
            ListEmptyComponent={<EmptyState type="recordings" />}
          />
        </View>
      ) : recordingsLoading || speciesLoading ? (
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
        isConnected && (
          <>
            <View style={styles.listContainer}>
              {/* Only render the active tab's FlatList */}
              {activeTab === "book" && (
                <FlatList
                  data={filteredAndSortedRecordings}
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
              )}
              {activeTab === "species" && (
                <FlatList
                  data={filteredAndSortedSpecies}
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
            {showFilters && <FilterDropdown />}
          </>
        )
      )}
      {showFilters && (
        <TouchableOpacity
          style={styles.filterOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        />
      )}
    </View>
  );
};

export default RecordingsListScreen;
