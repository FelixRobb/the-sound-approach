"use client";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useContext } from "react";
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

import MiniAudioPlayer from "../components/MiniAudioPlayer";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getAudioUri } from "../lib/mediaUtils";
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

  const styles = StyleSheet.create({
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    activeTabText: {
      color: theme.colors.onPrimary,
      fontWeight: "600",
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
    iconButton: {
      padding: 8,
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

  // Check if offline and no data
  useEffect(() => {
    if (!isConnected && (!recordings || recordings.length === 0)) {
      navigation.navigate("OfflineNotice");
    }
  }, [isConnected, recordings, navigation]);

  // Filter recordings based on search query
  const filteredRecordings = recordings?.filter((recording) => {
    if (!debouncedSearchQuery) return true;

    const query = debouncedSearchQuery.toLowerCase();
    return (
      recording.title.toLowerCase().includes(query) ||
      recording.caption.toLowerCase().includes(query) ||
      recording.species?.common_name.toLowerCase().includes(query) ||
      recording.species?.scientific_name.toLowerCase().includes(query) ||
      recording.book_page_number.toString().includes(query)
    );
  });

  // Filter species based on search query
  const filteredSpecies = species?.filter((species) => {
    if (!debouncedSearchQuery) return true;

    const query = debouncedSearchQuery.toLowerCase();
    return (
      species.common_name.toLowerCase().includes(query) ||
      species.scientific_name.toLowerCase().includes(query)
    );
  });

  // Render recording item
  const renderRecordingItem = ({ item }: { item: Recording }) => {
    const isItemDownloaded = isDownloaded(item.id);
    const audioUri = getAudioUri(item, isDownloaded, getDownloadPath, isConnected);

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

          {audioUri && (
            <MiniAudioPlayer
              trackId={item.audio_id}
              audioUri={audioUri}
              size={36}
              showLoading={false}
            />
          )}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Library</Text>
              <Text style={styles.subtitle}>Explore bird recordings and species</Text>
            </View>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowSearch((prev) => !prev)}
            >
              <Ionicons
                name={showSearch ? "close" : "search"}
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {showSearch ? (
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
              <TouchableOpacity
                style={[styles.tab, activeTab === "book" && styles.activeTab]}
                onPress={() => setActiveTab("book")}
              >
                <Ionicons
                  name="book-outline"
                  size={18}
                  color={
                    activeTab === "book" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
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
                    activeTab === "species" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                  }
                />
                <Text style={[styles.tabText, activeTab === "species" && styles.activeTabText]}>
                  By Species
                </Text>
              </TouchableOpacity>
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
  );
};

export default RecordingsListScreen;
