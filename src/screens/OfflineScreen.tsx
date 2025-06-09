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
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MiniAudioPlayer from "../components/MiniAudioPlayer";
import PageBadge from "../components/PageBadge";
import { DownloadContext } from "../context/DownloadContext";
import NavigationAudioStopper from "../hooks/NavigationAudioStopper";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { DownloadRecord } from "../types";
import { OfflineStackParamList } from "../types";

const { width } = Dimensions.get("window");

const OfflineScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OfflineStackParamList>>();
  const { totalStorageUsed, getDownloadedRecordings } = useContext(DownloadContext);
  const { theme } = useThemedStyles();
  const insets = useSafeAreaInsets();

  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Create styles with theme support
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
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
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
      shadowOpacity: 0.3,
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
      borderBottomColor: theme.colors.surfaceVariant,
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
      shadowOpacity: 0.3,
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
    infoButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 22,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    listContent: {
      padding: 16,
      paddingBottom: 80,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 4,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
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
    offlineBanner: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 12,
      flexDirection: "row",
      marginHorizontal: 20,
      marginVertical: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: theme.colors.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    offlineBannerText: {
      color: theme.colors.onErrorContainer,
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      marginLeft: 12,
    },
    pageBadgeWrapper: {
      alignSelf: "flex-start",
      marginVertical: 2,
    },
    playButton: {
      marginRight: 16,
    },
    scientificName: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontStyle: "italic",
      marginTop: 2,
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
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      flexDirection: "row",
      marginHorizontal: 20,
      marginVertical: 8,
      padding: 16,
    },
    storageInfoIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.tertiary,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      marginRight: 12,
      width: 40,
    },
    storageInfoText: {
      flex: 1,
    },
    storageMainText: {
      color: theme.colors.onSurface,
      fontSize: 15,
      fontWeight: "600",
    },
    storageSubText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      marginTop: 2,
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
  });

  // Ensure the audioUri has the file:// prefix and is well-formed
  const ensureFileUri = (path: string) => {
    if (!path) return null;
    if (path.startsWith("file://")) return path;
    // Remove any accidental double slashes after file://
    return "file://" + path.replace(/^\/+/, "");
  };

  // Render download item
  const renderDownloadItem = ({ item }: { item: DownloadRecord }) => {
    const audioUri = ensureFileUri(item.audio_path);

    const handleItemPress = () => {
      Alert.alert(
        "Offline Mode",
        "Recording details are not available while offline. You can still play downloaded recordings.",
        [{ text: "OK" }]
      );
    };

    return (
      <View>
        <TouchableOpacity style={styles.downloadCard} onPress={handleItemPress}>
          <View style={styles.downloadHeader}>
            <Text style={styles.downloadTitle}>{item.title || "Unknown Recording"}</Text>
            <Text style={styles.scientificName}>{item.scientific_name || ""}</Text>
          </View>

          <View style={styles.downloadContent}>
            <View style={styles.downloadInfo}>
              <Text style={styles.speciesName}>{item.species_name || "Unknown Species"}</Text>

              {item.book_page_number && (
                <View style={styles.pageBadgeWrapper}>
                  <PageBadge page={item.book_page_number} />
                </View>
              )}

              <Text style={styles.downloadDate}>
                Downloaded: {new Date(item.downloaded_at).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.downloadActions}>
              {audioUri && (
                <View style={styles.playButton}>
                  <MiniAudioPlayer trackId={item.recording_id} audioUri={audioUri} size={40} />
                </View>
              )}
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
        <Ionicons name="cloud-offline-outline" size={60} color={theme.colors.primary} />
        <Text style={styles.emptyTitle}>No Offline Content</Text>
        <Text style={styles.emptyText}>
          You don&apos;t have any downloaded recordings. Connect to the internet to browse and
          download recordings for offline use.
        </Text>
      </View>
    </View>
  );

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  // Custom header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Offline Mode</Text>
            <Text style={styles.subtitle}>Your downloaded recordings</Text>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => navigation.navigate("OfflineNotice")}
          >
            <Ionicons name="information-outline" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.offlineBanner}>
        <Ionicons name="cloud-offline-outline" size={22} color={theme.colors.onErrorContainer} />
        <Text style={styles.offlineBannerText}>
          You&apos;re offline - Only downloaded content is available
        </Text>
      </View>

      {downloads.length > 0 && (
        <View style={styles.storageInfo}>
          <View style={styles.storageInfoIcon}>
            <Ionicons name="folder" size={20} color={theme.colors.onTertiary} />
          </View>
          <View style={styles.storageInfoText}>
            <Text style={styles.storageMainText}>
              {downloads.length} recording{downloads.length !== 1 ? "s" : ""} available
            </Text>
            <Text style={styles.storageSubText}>
              Using {formatBytes(totalStorageUsed)} of storage
            </Text>
          </View>
        </View>
      )}
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
            <Text style={styles.loadingText}>Loading offline content...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavigationAudioStopper />

      <BackgroundPattern />
      <Header />

      <FlatList
        data={downloads}
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
    </View>
  );
};

export default OfflineScreen;
