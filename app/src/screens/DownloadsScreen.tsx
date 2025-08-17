import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackgroundPattern from "../components/BackgroundPattern";
import CustomModal from "../components/CustomModal";
import MiniAudioPlayer from "../components/MiniAudioPlayer";
import PageBadge from "../components/PageBadge";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme/typography";
import type { DownloadRecord, RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const DownloadsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { totalStorageUsed, deleteDownload, clearAllDownloads, getDownloadedRecordings } =
    useContext(DownloadContext);
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();

  const showBackButton =
    route.name === "DownloadsManager" ||
    (!!route.params && (route.params as { showBackButton?: boolean }).showBackButton === true);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [selectedDownload, setSelectedDownload] = useState<DownloadRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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
      setDownloads(downloadedRecordings);
    } catch (error) {
      console.error("Error loading downloads:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [getDownloadedRecordings]);

  // Check for downloads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
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
    setSelectedDownload(item);
    setShowDeleteModal(true);
  };

  // Handle clear all downloads
  const handleClearAllDownloads = () => {
    setShowClearAllModal(true);
  };

  const confirmDeleteDownload = async () => {
    if (!selectedDownload) return;

    setIsDeleting(true);
    try {
      await deleteDownload(selectedDownload.recording_id);
      setDownloads((prev) =>
        prev.filter((download) => download.recording_id !== selectedDownload.recording_id)
      );
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedDownload(null);
    }
  };

  const confirmClearAllDownloads = async () => {
    setIsClearing(true);
    try {
      await clearAllDownloads();
      setDownloads([]);
    } catch (error) {
      console.error("Clear downloads error:", error);
    } finally {
      setIsClearing(false);
      setShowClearAllModal(false);
    }
  };

  // Create styles with theme support
  const styles = StyleSheet.create({
    headerRowInner: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    backButton: {
      alignItems: "center",
      borderRadius: theme.borderRadius.lg,
      height: 40,
      justifyContent: "center",
      marginRight: 12,
      width: 40,
    },

    clearAllButton: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    clearAllButtonDisabled: {
      opacity: 0.5,
    },
    clearAllText: {
      ...createThemedTextStyle(theme, { size: "xs", weight: "medium", color: "onTertiary" }),
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    deleteButton: {
      alignItems: "center",
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.full,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    downloadActions: {
      alignItems: "center",
      flexDirection: "row",
    },
    downloadCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
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
      ...createThemedTextStyle(theme, { size: "xs", weight: "normal", color: "onSurfaceVariant" }),
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
      ...createThemedTextStyle(theme, { size: "sm", weight: "medium", color: "onSurface" }),
    },
    emptyCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
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
      fontSize: theme.typography.labelSmall.fontSize,
      lineHeight: 20,
      marginTop: 8,
      textAlign: "center",
    },
    emptyTitle: {
      color: theme.colors.onSurface,
      fontSize: theme.typography.labelLarge.fontSize,
      fontWeight: theme.typography.labelLarge.fontWeight,
      marginTop: 16,
      textAlign: "center",
    },
    header: {
      paddingTop: 8 + insets.top,
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
      paddingBottom: 80,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
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
      ...createThemedTextStyle(theme, { size: "sm", weight: "medium", color: "onSurface" }),
      marginTop: 16,
      textAlign: "center",
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
      fontSize: theme.typography.labelSmall.fontSize,
      fontStyle: "italic",
      marginTop: 2,
    },
    separator: {
      height: 16,
    },
    speciesName: {
      color: theme.colors.onSurface,
      fontSize: theme.typography.labelSmall.fontSize,
      marginBottom: 4,
    },
    storageInfo: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    storageInfoContainer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    storageText: {
      color: theme.colors.tertiary,
      fontSize: theme.typography.labelSmall.fontSize,
      fontWeight: theme.typography.labelSmall.fontWeight,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: theme.typography.labelSmall.fontSize,
      marginTop: 2,
    },
  });

  // Custom header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.headerRow}>
          <View style={styles.headerRowInner}>
            {showBackButton && (
              <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            <View>
              <Text
                style={createThemedTextStyle(theme, {
                  size: "xl",
                  weight: "bold",
                  color: "primary",
                })}
              >
                Downloads
              </Text>
              <Text style={styles.subtitle}>Manage your offline recordings</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.storageInfoContainer}>
        <View style={styles.storageInfo}>
          <Text style={styles.storageText}>Storage used: {formatBytes(totalStorageUsed)}</Text>
          <TouchableOpacity
            style={[styles.clearAllButton, downloads.length === 0 && styles.clearAllButtonDisabled]}
            disabled={downloads.length === 0}
            onPress={handleClearAllDownloads}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render download item
  const renderDownloadItem = ({ item }: { item: DownloadRecord }) => {
    const handleItemPress = () => {
      navigation.navigate("RecordingDetails", { recordingId: item.recording_id });
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
              <View style={styles.playButton}>
                <MiniAudioPlayer recording={item.recording} size={40} />
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteDownload(item)}
              >
                <Ionicons name="trash-outline" size={22} color={theme.colors.onError} />
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
        <Text style={styles.emptyTitle}>No Downloads</Text>
        <Text style={styles.emptyText}>
          Downloaded recordings will appear here for offline listening.
        </Text>
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

      {/* Delete Download Modal */}
      <CustomModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDownload(null);
        }}
        title="Delete Download"
        message={`Are you sure you want to delete "${selectedDownload?.title || "this recording"}"? You'll need to download it again for offline use.`}
        icon="trash-outline"
        iconColor={theme.colors.error}
        buttons={[
          {
            text: "Cancel",
            onPress: () => {
              setShowDeleteModal(false);
              setSelectedDownload(null);
            },
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: confirmDeleteDownload,
            style: "destructive",
            loading: isDeleting,
          },
        ]}
      />

      {/* Clear All Downloads Modal */}
      <CustomModal
        visible={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Clear All Downloads"
        message="Are you sure you want to delete all downloads? This action cannot be undone and you'll need to download recordings again for offline use."
        icon="trash-outline"
        iconColor={theme.colors.error}
        buttons={[
          {
            text: "Cancel",
            onPress: () => setShowClearAllModal(false),
            style: "cancel",
          },
          {
            text: "Clear All",
            onPress: confirmClearAllDownloads,
            style: "destructive",
            loading: isClearing,
          },
        ]}
      />
    </View>
  );
};

export default DownloadsScreen;
