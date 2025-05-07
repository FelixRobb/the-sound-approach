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
import { useAudio } from "../context/AudioContext";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getAudioUri } from "../lib/mediaUtils";
import { fetchRecordingsByBookOrder, fetchSpecies } from "../lib/supabase";
import type { Recording, Species } from "../types";
import { RootStackParamList } from "../types";

const RecordingsListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isConnected } = useContext(NetworkContext);
  const { isDownloaded, getDownloadPath } = useContext(DownloadContext);
  const { notifyScreenChange } = useAudio();
  const { theme, isDarkMode } = useThemedStyles();

  const [activeTab, setActiveTab] = useState("book");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const styles = StyleSheet.create({
    backgroundPattern: {
      backgroundColor: isDarkMode
        ? `${theme.colors.primary}08` // Very transparent primary color
        : `${theme.colors.primary}05`,
      bottom: 0,
      left: 0,
      opacity: 0.5,
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
    listContainer: {
      flex: 1,
      paddingBottom: 16,
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
    headerRedesigned: {
      backgroundColor: isDarkMode ? `${theme.colors.surface}E6` : `${theme.colors.surface}F2`,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      elevation: 6,
      paddingBottom: 20,
      paddingHorizontal: 20,
      paddingTop: 50,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
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
    titleContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerContentRedesigned: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    headerTitleRedesigned: {
      color: theme.colors.primary,
      fontSize: 30,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant || theme.colors.onSurface,
      fontSize: 15,
      marginTop: 4,
      opacity: 0.8,
    },

    // Updated tab bar styles
    tabBarRedesigned: {
      alignSelf: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 30,
      borderWidth: 1,
      elevation: 3,
      flexDirection: "row",
      marginBottom: 4,
      marginTop: 8,
      padding: 6,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      width: "95%",
    },
    // eslint-disable-next-line react-native/no-color-literals
    tabRedesigned: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderRadius: 24,
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    activeTabRedesigned: {
      backgroundColor: theme.colors.primary,
      elevation: 3,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    tabTextRedesigned: {
      color: isDarkMode
        ? theme.colors.onSurfaceVariant || theme.colors.onSurface
        : theme.colors.onSurfaceVariant || theme.colors.onSurface,
      fontSize: 15,
      fontWeight: "600",
      marginLeft: 8,
    },
    activeTabTextRedesigned: {
      color: theme.colors.onPrimary,
      fontWeight: "700",
    },
    tabIcon: {
      marginRight: 2,
    },

    // Updated search bar styles
    iconButtonRedesigned: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      elevation: 3,
      height: 40,
      justifyContent: "center",
      marginLeft: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      width: 40,
    },
    searchBarContainer: {
      marginBottom: 10,
      marginTop: -8,
      paddingHorizontal: 16,
      zIndex: 5,
    },
    customSearchBar: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant || theme.colors.surface,
      borderRadius: 24,
      elevation: 3,
      flexDirection: "row",
      height: 48,
      paddingHorizontal: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    customSearchInput: {
      backgroundColor: "transparent",
      color: theme.colors.onSurface,
      flex: 1,
      fontSize: 17,
      paddingHorizontal: 8,
      paddingVertical: 0,
    },
    clearButton: {
      alignItems: "center",
      borderRadius: 20,
      justifyContent: "center",
      padding: 8,
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
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
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
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      species.common_name.toLowerCase().includes(query) ||
      species.scientific_name.toLowerCase().includes(query)
    );
  });

  // Notify audio context about screen change
  useEffect(() => {
    notifyScreenChange("RecordingsList");
  }, [notifyScreenChange]);

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

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  // Redesigned Header component with search icon and conditional tab/search bar
  const Header = () => (
    <View style={styles.headerRedesigned}>
      <View style={styles.headerContentRedesigned}>
        <View>
          <Text style={styles.headerTitleRedesigned}>Library</Text>
          <Text style={styles.headerSubtitle}>Explore bird recordings and species</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButtonRedesigned}
          onPress={() => setShowSearch((prev) => !prev)}
        >
          <Ionicons name="search" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      {showSearch ? (
        <View style={styles.searchBarContainer}>
          <View style={styles.customSearchBar}>
            <Ionicons
              name="search"
              size={22}
              color={theme.colors.primary}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ marginLeft: 12, marginRight: 6 }}
            />
            <TextInput
              placeholder={activeTab === "book" ? "Search recordings..." : "Search species..."}
              placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.customSearchInput}
              autoFocus
              selectionColor={theme.colors.primary}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <Ionicons name="close-circle" size={22} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setShowSearch(false)} style={styles.clearButton}>
                <Ionicons name="close" size={22} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.tabBarRedesigned}>
          <TouchableOpacity
            style={[styles.tabRedesigned, activeTab === "book" && styles.activeTabRedesigned]}
            onPress={() => setActiveTab("book")}
          >
            <Ionicons
              name="book-outline"
              size={18}
              color={activeTab === "book" ? theme.colors.onPrimary : theme.colors.primary}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabTextRedesigned,
                activeTab === "book" && styles.activeTabTextRedesigned,
              ]}
            >
              By Book Order
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabRedesigned, activeTab === "species" && styles.activeTabRedesigned]}
            onPress={() => setActiveTab("species")}
          >
            <Ionicons
              name="leaf-outline"
              size={18}
              color={activeTab === "species" ? theme.colors.onPrimary : theme.colors.primary}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabTextRedesigned,
                activeTab === "species" && styles.activeTabTextRedesigned,
              ]}
            >
              By Species
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
      <BackgroundPattern />
      <Header />

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
