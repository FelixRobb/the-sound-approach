"use client";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

import DetailHeader from "../components/DetailHeader";
import FullAudioPlayer from "../components/FullAudioPlayer";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getAudioUri, getSonogramUri } from "../lib/mediaUtils";
import { fetchRecordingById } from "../lib/supabase";
import type { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const RecordingDetailsScreen = () => {
  const { theme } = useThemedStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RecordingDetails">>();
  const { isConnected } = useContext(NetworkContext);
  const { downloadRecording, isDownloaded, getDownloadPath, downloads } =
    useContext(DownloadContext);

  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  const styles = StyleSheet.create({
    caption: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 24,
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
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    closeButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      position: "absolute",
      right: 20,
      top: 40,
      width: 40,
      zIndex: 20,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    disabledDownloadButton: {
      opacity: 0.5,
    },
    downloadButtonContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: 16,
    },
    downloadButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    downloadedContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: 12,
    },
    downloadedIndicator: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      marginLeft: 8,
      padding: 8,
    },
    downloadedText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 12,
    },
    downloadingContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: 16,
    },
    downloadingText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      marginLeft: 12,
    },
    errorCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 4,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
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
      color: theme.colors.onSurfaceVariant,
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
    expandButton: {
      padding: 4,
    },
    fullscreenContainer: {
      backgroundColor: theme.colors.surface,
      flex: 1,
      zIndex: 10,
    },
    fullscreenImage: {
      flex: 1,
    },
    goBackButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      marginRight: 12,
      width: 40,
    },
    goBackText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "bold",
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 4,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
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
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      marginTop: 16,
    },
    offlineText: {
      color: theme.colors.error,
      fontSize: 14,
      marginLeft: 6,
    },
    offlineWarning: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 8,
    },
    pageReference: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    pageText: {
      color: theme.colors.onPrimary,
      fontSize: 12,
      fontWeight: "500",
    },
    playerHeader: {
      borderRadius: 12,
      height: 80,
      marginBottom: 16,
      overflow: "hidden",
    },
    retryButton: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    retryText: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      marginLeft: 8,
    },
    scientificName: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontStyle: "italic",
      marginBottom: 8,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 12,
    },
    sonogramContainer: {
      backgroundColor: theme.colors.onSurfaceVariant,
      borderRadius: 12,
      overflow: "hidden",
    },
    sonogramImage: {
      height: 200,
      width: "100%",
    },
    speciesActionButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    speciesHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    speciesInfo: {
      flex: 1,
    },
    speciesName: {
      color: theme.colors.primary,
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 4,
    },
    waveformPlaceholder: {
      alignItems: "center",
      backgroundColor: theme.colors.onSurfaceVariant,
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    waveformPreview: {
      height: "100%",
      width: "100%",
    },
  });

  // Fetch recording details
  const {
    data: recording,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recording", route.params.recordingId],
    queryFn: () => fetchRecordingById(route.params.recordingId),
  });

  // Get download status
  const getDownloadStatus = () => {
    if (!recording) return "idle";

    if (isDownloaded(recording.id)) {
      return "completed";
    }

    return downloads[recording.id]?.status || "idle";
  };

  // Handle download button press
  const handleDownload = async () => {
    if (!recording || !isConnected) return;

    try {
      await downloadRecording(recording);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Download Error", "Failed to download the recording. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  // Get audio URI for the player - memoized to prevent repeated requests
  const audioUri = useMemo(() => {
    if (!recording) return null;
    return getAudioUri(recording, isDownloaded, getDownloadPath, isConnected);
  }, [recording, isDownloaded, isConnected, getDownloadPath]);

  // Get sonogram image URI - memoized to prevent repeated requests
  const sonogramUri = useMemo(() => {
    if (!recording) return null;
    return getSonogramUri(recording, isDownloaded, getDownloadPath, isConnected);
  }, [recording, isDownloaded, isConnected, getDownloadPath]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <DetailHeader title="Loading..." />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading recording details...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Render error state
  if (error || !recording) {
    return (
      <View style={styles.container}>
        <DetailHeader title="Error" />
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Unable to Load Recording</Text>
            <Text style={styles.errorText}>
              {!isConnected
                ? "You're offline. This recording is not available offline."
                : "Something went wrong. Please try again."}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
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

  return (
    <View style={styles.container}>
      {isImageFullscreen ? (
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setIsImageFullscreen(false);
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{
              uri: sonogramUri || "https://placeholder.svg?height=400&width=800&text=Sonogram",
            }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <>
          <DetailHeader
            title={recording.title}
            subtitle={recording.species?.scientific_name}
            rightElement={
              isDownloaded(recording.id) && (
                <View style={styles.downloadedIndicator}>
                  <Ionicons name="cloud-done" size={16} color={theme.colors.onPrimary} />
                </View>
              )
            }
          />

          <ScrollView contentContainerStyle={styles.content}>
            {/* Species Card */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.speciesHeader}
                onPress={() => {
                  if (isConnected) {
                    navigation.navigate("SpeciesDetails", { speciesId: recording.species_id });
                  }
                }}
                disabled={!isConnected}
              >
                <View style={styles.speciesInfo}>
                  <Text style={styles.speciesName}>{recording.species?.common_name}</Text>
                  <Text style={styles.scientificName}>{recording.species?.scientific_name}</Text>

                  <View style={styles.pageReference}>
                    <Text style={styles.pageText}>Page {recording.book_page_number}</Text>
                  </View>
                </View>
                {isConnected && (
                  <View style={styles.speciesActionButton}>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Audio Player Card */}
            <View style={styles.card}>
              {/* Player Visualization */}
              <View style={styles.playerHeader}>
                {sonogramUri ? (
                  <Image
                    source={{
                      uri:
                        sonogramUri ||
                        "https://placeholder.svg?height=200&width=400&text=Sonogram+Not+Available",
                    }}
                    style={styles.waveformPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.waveformPlaceholder}>
                    <Ionicons name="musical-notes" size={32} color="#E0E0E0" />
                  </View>
                )}
              </View>

              {/* Audio Player Component */}
              <FullAudioPlayer
                trackId={recording.audio_id}
                audioUri={audioUri}
                hasNetworkConnection={isConnected}
              />
            </View>

            {/* Description Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.caption}>{recording.caption}</Text>
            </View>

            {/* Sonogram Card */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sonogram</Text>
                {sonogramUri && (
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setIsImageFullscreen(true)}
                  >
                    <Ionicons name="expand" size={20} color="#2E7D32" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.sonogramContainer}>
                <Image
                  source={{
                    uri:
                      sonogramUri ||
                      "https://placeholder.svg?height=200&width=400&text=Sonogram+Not+Available",
                  }}
                  style={styles.sonogramImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Download Card */}
            <View style={styles.card}>
              {getDownloadStatus() === "completed" ? (
                <View style={styles.downloadedContainer}>
                  <Ionicons name="cloud-done" size={28} color="#2E7D32" />
                  <Text style={styles.downloadedText}>Available Offline</Text>
                </View>
              ) : getDownloadStatus() === "downloading" ? (
                <View style={styles.downloadingContainer}>
                  <ActivityIndicator size="small" color="#2E7D32" />
                  <Text style={styles.downloadingText}>Downloading...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.downloadButtonContainer,
                    !isConnected && styles.disabledDownloadButton,
                  ]}
                  onPress={handleDownload}
                  disabled={!isConnected}
                >
                  <Ionicons name="cloud-download" size={22} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download for Offline Use</Text>
                </TouchableOpacity>
              )}

              {!isConnected && getDownloadStatus() === "idle" && (
                <View style={styles.offlineWarning}>
                  <Ionicons name="wifi" size={16} color="#B00020" />
                  <Text style={styles.offlineText}>Connect to download this recording</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default RecordingDetailsScreen;
