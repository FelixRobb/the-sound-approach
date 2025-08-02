import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";

import BackgroundPattern from "../components/BackgroundPattern";
import DetailHeader from "../components/DetailHeader";
import DownloadedBadge from "../components/DownloadedBadge";
import LoadingScreen from "../components/LoadingScreen";
import MiniAudioPlayer from "../components/MiniAudioPlayer";
import PageBadge from "../components/PageBadge";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import NavigationAudioStopper from "../hooks/NavigationAudioStopper";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getBestAudioUri } from "../lib/mediaUtils";
import { fetchRecordingsBySpecies } from "../lib/supabase";
import type { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const SpeciesDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "SpeciesDetails">>();
  const { isConnected } = useContext(NetworkContext);
  const { isDownloaded, getDownloadPath } = useContext(DownloadContext);
  const { theme } = useThemedStyles();

  const { speciesId } = route.params;
  // Fetch recordings for this species
  const {
    data: recordings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["species-recordings", speciesId],
    queryFn: () => fetchRecordingsBySpecies(speciesId),
  });

  // Create styles with theme support
  const styles = StyleSheet.create({
    badgeRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
    },
    caption: {
      color: theme.colors.onSurface,
      fontSize: 14,
      lineHeight: 20,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 3,
      marginBottom: 16,
      overflow: "hidden",
      padding: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    divider: {
      backgroundColor: theme.colors.surface,
      height: 1,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    emptyText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      marginTop: 16,
      textAlign: "center",
    },
    errorCard: {
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
    errorContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: 24,
    },
    errorText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      lineHeight: 22,
      marginBottom: 24,
      textAlign: "center",
    },
    errorTitle: {
      color: theme.colors.error,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 8,
      marginTop: 16,
    },
    goBackButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    goBackText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "500",
    },
    recordingContent: {
      flex: 1,
      paddingRight: 12,
    },
    recordingCountBadge: {
      backgroundColor: theme.colors.onPrimary,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    recordingCountText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "bold",
    },
    recordingItem: {
      alignItems: "center",
      flexDirection: "row",
      paddingVertical: 16,
    },
    recordingMeta: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: 8,
    },
    recordingTitle: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 6,
    },
    recordingsList: {
      borderRadius: 12,
      overflow: "hidden",
    },
    retryButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    retryText: {
      color: theme.colors.onSurface,
      fontSize: 14,
      marginLeft: 8,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: 16,
    },
    sectionTitle: {
      color: theme.colors.primary,
      flex: 1,
      fontSize: 18,
      fontWeight: "600",
    },
  });

  // Handle retry
  const handleRetry = () => {
    refetch();
  };

  // Render loading state
  if (isLoading) {
    return <LoadingScreen title="Loading Species..." />;
  }

  // Render error state
  if (error || !recordings) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <DetailHeader title="Error" />

        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Unable to Load Species</Text>
            <Text style={styles.errorText}>
              &quot;Something went wrong. Please try again.&quot;
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
              <Text style={styles.goBackText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Get species name from first recording
  const speciesName =
    recordings.length > 0 && recordings[0].species
      ? recordings[0].species.common_name
      : "Unknown Species";

  // Get scientific name from first recording
  const scientificName =
    recordings.length > 0 && recordings[0].species ? recordings[0].species.scientific_name : "";

  return (
    <View style={styles.container}>
      <NavigationAudioStopper />
      <BackgroundPattern />
      <DetailHeader title={speciesName} subtitle={scientificName} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Recordings Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recordings</Text>
            <View style={styles.recordingCountBadge}>
              <Text style={styles.recordingCountText}>{recordings.length}</Text>
            </View>
          </View>

          {recordings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes" size={48} color={theme.colors.primary} />
              <Text style={styles.emptyText}>No recordings available</Text>
            </View>
          ) : (
            <View style={styles.recordingsList}>
              {recordings.map((item) => {
                return (
                  <View key={item.id}>
                    <TouchableOpacity
                      style={styles.recordingItem}
                      onPress={() => {
                        navigation.navigate("RecordingDetails", { recordingId: item.id });
                      }}
                    >
                      <View style={styles.recordingContent}>
                        <Text style={styles.recordingTitle}>{item.title}</Text>
                        <View style={styles.recordingMeta}>
                          <View style={styles.badgeRow}>
                            <PageBadge page={item.book_page_number} iconSize={14} />
                            {isDownloaded(item.id) && <DownloadedBadge iconSize={14} />}
                          </View>
                        </View>
                        <Text style={styles.caption} numberOfLines={2}>
                          {item.caption}
                        </Text>
                      </View>

                      {(() => {
                        const uri = getBestAudioUri(
                          item,
                          isDownloaded,
                          getDownloadPath,
                          isConnected
                        );
                        return uri ? (
                          <MiniAudioPlayer trackId={item.id} audioUri={uri} size={36} />
                        ) : null;
                      })()}
                    </TouchableOpacity>
                    {recordings.indexOf(item) < recordings.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default SpeciesDetailsScreen;
