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
  TextInput,
  ScrollView,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AnimatedTabBar from "../components/AnimatedTabBar";
import BackgroundPattern from "../components/BackgroundPattern";
import DownloadedBadge from "../components/DownloadedBadge";
import MiniAudioPlayer from "../components/MiniAudioPlayer";
import PageBadge from "../components/PageBadge";
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
  const { theme } = useThemedStyles();

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
      borderRadius: 16,
      marginHorizontal: 12,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    recordingTitle: {
      color: theme.colors.onSurface,
      fontSize: 17,
      fontWeight: "600",
      lineHeight: 18,
      flex: 1,
      marginRight: 8,
    },
    recordingLeftSection: {
      flex: 1,
      minWidth: 0,
    },
    recordingBadges: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 0,
    },
    recordingSpecies: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 3,
    },
    commonName: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: "500",
      lineHeight: 16,
    },
    scientificName: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      fontStyle: "italic",
      lineHeight: 14,
      opacity: 0.8,
    },
    audioPlayerContainer: {
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginLeft: 12,
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
    filterButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 20,
      elevation: 1,
      flexDirection: "row",
      marginRight: 10,
      marginVertical: 2,
      minHeight: 32,
      paddingHorizontal: 14,
      paddingVertical: 7,
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
      marginRight: 6,
    },
    filterButtonText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: "500",
    },
    filterButtonTextActive: {
      color: theme.colors.onPrimary,
      fontWeight: "600",
    },
    filterButtonsContainer: {
      marginHorizontal: 8,
      marginTop: 8,
    },
    filterDivider: {
      alignSelf: "center",
      backgroundColor: theme.colors.outlineVariant,
      borderRadius: 1,
      height: 24,
      marginHorizontal: 10,
      opacity: 0.4,
      width: 1.5,
    },
    filterRow: {
      alignItems: "center",
      flexDirection: "row",
      paddingHorizontal: 8,
    },
    filterSectionTitle: {
      alignSelf: "center",
      color: theme.colors.onSurfaceVariant,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.5,
      marginLeft: 0,
      marginRight: 8,
      opacity: 0.7,
      textTransform: "uppercase",
    },
    header: {
      paddingBottom: 8,
      paddingTop: 8 + insets.top,
      zIndex: 1,
    },
    headerActions: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 1,
      gap: 8,
    },
    headerInner: {
      paddingHorizontal: 20,
    },
    headerButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 22,
      height: 44,
      justifyContent: "center",
      paddingHorizontal: 0,
      position: "relative",
      width: 44,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    listContainer: {
      paddingTop: 0,
      flex: 1,
      paddingHorizontal: 0,
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
    scrollViewFilters: {
      alignItems: "center",
      paddingRight: 8,
    },
    searchContainer: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: "row",
      height: 46,
      marginHorizontal: 4,
      marginTop: 12,
      paddingHorizontal: 16,
      width: "94%",
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
      marginHorizontal: 12,
      marginVertical: 4,
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 0.5 },
      shadowOpacity: 0.4,
      shadowRadius: 1,
      elevation: 2,
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
    title: {
      color: theme.colors.primary,
      fontSize: 28,
      fontWeight: "bold",
    },
    sectionHeader: {
      backgroundColor: theme.colors.background,
      paddingLeft: 20,
      paddingRight: 20,
      paddingTop: 20,
      paddingBottom: 8,
    },
    sectionHeaderText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: "bold",
    },
    sectionSubHeaderText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontStyle: "italic",
      marginTop: 2,
    },
    recordingCardIndented: {
      marginLeft: 32,
    },
    caption: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontStyle: "italic",
      marginTop: 2,
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
    const uri = getBestAudioUri(item, isDownloaded, getDownloadPath, isConnected);

    return (
      <TouchableOpacity
        style={[styles.recordingCard, sortBy === "species" && styles.recordingCardIndented]}
        onPress={() => {
          navigation.navigate("RecordingDetails", { recordingId: item.id });
        }}
        activeOpacity={0.72}
      >
        <View style={styles.recordingLeftSection}>
          <Text style={styles.recordingTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {sortBy !== "species" && (
            <View style={styles.recordingSpecies}>
              <Text style={styles.commonName} numberOfLines={1}>
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

        {uri && (
          <View style={styles.audioPlayerContainer}>
            <MiniAudioPlayer recording={item} size={40} />
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
        color={theme.colors.surface}
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
            <View>
              <Text style={styles.title}>Library</Text>
              <Text style={styles.subtitle}>Explore bird recordings and species</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  setShowSearch((prev) => !prev);
                  setSearchInput("");
                }}
              >
                <Ionicons
                  name={showSearch ? "close" : "search"}
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          </View>

          {showSearch ? (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.tertiary} />
              <TextInput
                placeholder={activeTab === "book" ? "Search recordings..." : "Search species..."}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={searchInput}
                onChangeText={setSearchInput}
                style={styles.searchInput}
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
                        styles.filterButtonText,
                        sortBy === "page" && styles.filterButtonTextActive,
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
                        styles.filterButtonText,
                        sortBy === "title" && styles.filterButtonTextActive,
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
                        styles.filterButtonText,
                        sortOrder === "desc" && styles.filterButtonTextActive,
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
                        styles.filterButtonText,
                        downloadedFilter === "all" && styles.filterButtonTextActive,
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
                  keyExtractor={(item) => item.id}
                  renderItem={renderRecordingItem}
                  renderSectionHeader={({ section: { title } }) => {
                    const [commonName, scientificName] = title.split(" • ");
                    return (
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>{commonName}</Text>
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
