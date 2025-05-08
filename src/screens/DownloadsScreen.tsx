"use client";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  TextInput as RNTextInput,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

import MiniAudioPlayer from "../components/MiniAudioPlayer";
import { DownloadContext } from "../context/DownloadContext";
import { ThemeContext } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { DownloadRecord } from "../types";
import { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const DownloadsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { totalStorageUsed, deleteDownload, clearAllDownloads, getDownloadedRecordings } =
    useContext(DownloadContext);
  const { isDarkMode } = useContext(ThemeContext);
  const { theme } = useThemedStyles();

  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Format bytes to human-readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Load downloaded recordings from database
  const loadDownloads = useCallback(async () => {
    setIsLoading(true);
    try {
      const downloadedRecordings = await getDownloadedRecordings();
      // Map the downloaded recordings to match the DownloadedRecording type
      const formattedRecordings = downloadedRecordings.map((record) => ({
        recording_id: record.recording_id,
        audio_path: record.audio_path,
        sonogram_path: record.sonogram_path,
        downloaded_at: record.downloaded_at,
        title: record.title,
        species_name: record.species_name,
        scientific_name: record.scientific_name,
        book_page_number: record.book_page_number,
        caption: record.caption,
      }));
      setDownloads(formattedRecordings);
    } catch (error) {
      console.error("Error loading downloads:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [getDownloadedRecordings]);

  // Check for downloads when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDownloads();
      return () => {
        // Optional cleanup if needed
      };
    }, [loadDownloads])
  );

  // Initial load when component mounts
  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  // Handle delete download
  const handleDeleteDownload = (item: DownloadRecord) => {
    Alert.alert("Delete Download", "Are you sure you want to delete this download?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteDownload(item.recording_id)
            .then(() => {
              setDownloads((prev) =>
                prev.filter((download) => download.recording_id !== item.recording_id)
              );
            })
            .catch((error) => {
              console.error("Delete error:", error);
            });
        },
      },
    ]);
  };

  // Handle clear all downloads
  const handleClearAllDownloads = () => {
    Alert.alert(
      "Clear All Downloads",
      "Are you sure you want to delete all downloads? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            clearAllDownloads()
              .then(() => {
                setDownloads([]);
              })
              .catch((error) => {
                console.error("Clear downloads error:", error);
              });
          },
        },
      ]
    );
  };

  // Filter downloads based on search query
  const filteredDownloads = downloads.filter((download) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      download.title?.toLowerCase().includes(query) ||
      download.species_name?.toLowerCase().includes(query) ||
      download.scientific_name?.toLowerCase().includes(query) ||
      (download.book_page_number && download.book_page_number.toString().includes(query))
    );
  });

  // Create styles with theme support
  const styles = StyleSheet.create({
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
    clearAllButton: {
      backgroundColor: isDarkMode ? `${theme.colors.primary}20` : `${theme.colors.primary}15`,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    clearAllText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "bold",
    },
    clearSearchButton: {
      backgroundColor: isDarkMode ? `${theme.colors.primary}20` : `${theme.colors.primary}10`,
      borderRadius: 8,
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    clearSearchText: {
      color: theme.colors.primary,
      fontWeight: "bold",
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    deleteButton: {
      alignItems: "center",
      backgroundColor: isDarkMode ? `${theme.colors.error}20` : `${theme.colors.error}10`,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    disabledButton: {
      backgroundColor: theme.colors.surfaceDisabled,
    },
    disabledButtonText: {
      color: theme.colors.onSurfaceDisabled,
    },
    downloadActions: {
      alignItems: "center",
      flexDirection: "row",
    },
    downloadCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 3,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.3 : 0.22,
      shadowRadius: 2.22,
    },
    downloadContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      paddingTop: 8,
    },
    downloadDate: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 4,
    },
    downloadHeader: {
      borderBottomColor: isDarkMode ? theme.colors.surfaceVariant : theme.colors.surfaceVariant,
      borderBottomWidth: 1,
      padding: 16,
      paddingBottom: 8,
    },
    downloadInfo: {
      flex: 1,
    },
    downloadTitle: {
      color: theme.colors.onSurface,
      fontSize: 17,
      fontWeight: "bold",
    },
    emptyCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 4,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
      width: width * 0.8,
    },
    emptyContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      marginTop: 48,
      padding: 24,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
      textAlign: "center",
    },
    emptyTitle: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 16,
      textAlign: "center",
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 4,
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
    listContent: {
      padding: 16,
      paddingBottom: 80, // Extra space for button at bottom
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 4,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 3,
      width: width * 0.8,
    },
    loadingContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: 24,
    },
    loadingText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      marginTop: 16,
      textAlign: "center",
    },
    manageStorageButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 24,
      bottom: 20,
      elevation: 4,
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 12,
      position: "absolute",
      right: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.2,
      shadowRadius: 3,
    },
    manageStorageText: {
      color: theme.colors.onPrimary,
      fontWeight: "bold",
      marginRight: 8,
    },
    pageReference: {
      alignSelf: "flex-start",
      backgroundColor: isDarkMode ? `${theme.colors.primary}20` : `${theme.colors.primary}10`,
      borderRadius: 12,
      marginBottom: 4,
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    pageText: {
      color: theme.colors.primary,
      fontSize: 12,
    },
    playButton: {
      marginRight: 16,
    },
    playButtonActive: {
      backgroundColor: isDarkMode ? `${theme.colors.primary}DD` : `${theme.colors.primary}AA`,
    },
    playButtonInner: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    profileButton: {
      borderRadius: 18,
      marginLeft: 8,
      overflow: "hidden",
    },
    profileButtonBackground: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      padding: 8,
    },
    scientificName: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontStyle: "italic",
      marginTop: 2,
    },
    searchBar: {
      alignItems: "center",
      backgroundColor: isDarkMode ? theme.colors.surfaceVariant : theme.colors.surfaceVariant,
      borderRadius: 12,
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchBarContainer: {
      marginBottom: 8,
      paddingHorizontal: 20,
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
      marginVertical: 12,
      paddingHorizontal: 16,
    },
    searchInput: {
      color: theme.colors.onSurface,
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
      paddingVertical: 10,
    },
    separator: {
      height: 16,
    },
    speciesName: {
      color: theme.colors.onSurface,
      fontSize: 15,
      marginBottom: 4,
    },
    storageInfo: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    storageInfoContainer: {
      backgroundColor: isDarkMode ? `${theme.colors.primary}15` : `${theme.colors.primary}08`,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    storageText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "500",
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
  });

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  // Custom header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Downloads</Text>
            <Text style={styles.subtitle}>Manage your offline recordings</Text>
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
              placeholder="Search downloads..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              autoFocus
              selectionColor={theme.colors.primary}
              returnKeyType="search"
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.storageInfoContainer}>
        <View style={styles.storageInfo}>
          <Text style={styles.storageText}>Storage used: {formatBytes(totalStorageUsed)}</Text>
          <TouchableOpacity
            style={[styles.clearAllButton, downloads.length === 0 && styles.disabledButton]}
            disabled={downloads.length === 0}
            onPress={handleClearAllDownloads}
          >
            <Text
              style={[styles.clearAllText, downloads.length === 0 && styles.disabledButtonText]}
            >
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render download item
  const renderDownloadItem = ({ item }: { item: DownloadRecord }) => {
    // Ensure the audioUri has the file:// prefix
    const audioUri = item.audio_path
      ? item.audio_path.startsWith("file://")
        ? item.audio_path
        : `file://${item.audio_path}`
      : null;

    return (
      <View>
        <TouchableOpacity
          style={styles.downloadCard}
          onPress={() => {
            navigation.navigate("RecordingDetails", { recordingId: item.recording_id });
          }}
        >
          <View style={styles.downloadHeader}>
            <Text style={styles.downloadTitle}>{item.title || "Unknown Recording"}</Text>
            <Text style={styles.scientificName}>{item.scientific_name || ""}</Text>
          </View>

          <View style={styles.downloadContent}>
            <View style={styles.downloadInfo}>
              <Text style={styles.speciesName}>{item.species_name || "Unknown Species"}</Text>

              {item.book_page_number && (
                <View style={styles.pageReference}>
                  <Text style={styles.pageText}>Page {item.book_page_number}</Text>
                </View>
              )}

              <Text style={styles.downloadDate}>
                Downloaded: {new Date(item.downloaded_at).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.downloadActions}>
              {/* Replace with MiniAudioPlayer */}
              {audioUri && (
                <View style={styles.playButton}>
                  <MiniAudioPlayer trackId={item.audio_path} audioUri={audioUri} size={40} />
                </View>
              )}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteDownload(item)}
              >
                <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Ionicons name="cloud-download-outline" size={60} color={theme.colors.primary} />
        <Text style={styles.emptyTitle}>{searchQuery ? "No results found" : "No Downloads"}</Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? `We couldn't find any downloads matching "${searchQuery}"`
            : "Downloaded recordings will appear here for offline listening."}
        </Text>
        {searchQuery && (
          <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery("")}>
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <Header />

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading downloads...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />

      <FlatList
        data={filteredDownloads}
        renderItem={renderDownloadItem}
        keyExtractor={(item) => item.recording_id.toString()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDownloads();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      <TouchableOpacity
        style={styles.manageStorageButton}
        onPress={() => {
          navigation.navigate("Profile");
        }}
      >
        <Text style={styles.manageStorageText}>Manage Storage</Text>
        <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

// TextInput implementation
const TextInput = (props: React.ComponentProps<typeof RNTextInput>) => {
  const { theme } = useThemedStyles();
  const styles = StyleSheet.create({
    RNTextInput: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.onSurface,
      flex: 1,
      fontSize: 16,
    },
  });
  return (
    <RNTextInput
      {...props}
      style={styles.RNTextInput}
      placeholderTextColor={theme.colors.onSurfaceDisabled}
    />
  );
};

export default DownloadsScreen;
