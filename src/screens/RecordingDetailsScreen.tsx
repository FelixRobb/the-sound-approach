"use client";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useContext, useEffect, useMemo } from "react";
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

import FullAudioPlayer from "../components/FullAudioPlayer";
import { useAudio } from "../context/AudioContext";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getAudioUri, getSonogramUri } from "../lib/mediaUtils";
import { fetchRecordingById } from "../lib/supabase";
import { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const RecordingDetailsScreen = () => {
  const { theme } = useThemedStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RecordingDetails">>();
  const { isConnected } = useContext(NetworkContext);
  const { downloadRecording, isDownloaded, getDownloadPath, downloads } =
    useContext(DownloadContext);
  const { notifyScreenChange } = useAudio();

  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  // Notify audio context about screen change
  useEffect(() => {
    notifyScreenChange(`RecordingDetails-${route.params.recordingId}`);
  }, [notifyScreenChange, route.params.recordingId]);

  const styles = StyleSheet.create({
    backButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      marginRight: 12,
      width: 40,
    },
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
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 16,
      marginLeft: 8,
      padding: 8,
    },
    downloadedText: {
      color: theme.colors.primary,
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
      color: theme.colors.primary,
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
    header: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      elevation: 4,
      flexDirection: "row",
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 50,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    headerTitle: {
      color: theme.colors.onSurfaceVariant,
      flex: 1,
      fontSize: 18,
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
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 12,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    pageText: {
      color: theme.colors.primary,
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

  // Only static values in StyleSheet
  const styles = StyleSheet.create({
    activeControlButton: {
      backgroundColor: theme.colors.primary,
    },
    activeControlText: {},
    audioRetryButton: {
      alignItems: 'center',
      alignSelf: 'center',
      borderRadius: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    audioRetryText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    backButton: {
      borderRadius: 20,
      padding: 8,
    },
    backgroundPattern: {
      bottom: 0,
      left: 0,
      opacity: 0.5,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
    },
    card: {
      borderRadius: 12,
      elevation: 2,
      marginTop: 16,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
    },
    closeButton: {
      borderRadius: 20,
      padding: 8,
      position: 'absolute',
      right: 20,
      top: 50,
      zIndex: 1000,
    },
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: 32,
      paddingHorizontal: 16,
    },
    controlButton: {
      alignItems: 'center',
      borderRadius: 99,
      justifyContent: 'center',
    },
    disabledControlButton: {
      opacity: 0.5,
    },
    downloadButtonContainer: {
      alignItems: 'center',
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      marginHorizontal: 16,
      marginVertical: 16,
      paddingVertical: 12,
    },
    downloadButtonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    downloadedContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      padding: 16,
    },
    downloadedText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    downloadingContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      padding: 16,
    },
    downloadingText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    errorCard: {
      alignItems: 'center',
      borderRadius: 12,
      elevation: 2,
      padding: 24,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      width: '90%',
    },
    errorContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    errorText: {
      fontSize: 14,
      marginBottom: 24,
      textAlign: 'center',
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 16,
    },
    expandButton: {
      borderRadius: 20,
      padding: 8,
    },
    fullscreenContainer: {
      alignItems: 'center',
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 999,
    },
    fullscreenImage: {
      height: width * 0.8,
      width: width,
    },
    goBackButton: {
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      width: '100%',
    },
    goBackText: {
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      alignItems: 'center',
      elevation: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 10,
      paddingHorizontal: 16,
      paddingTop: 45,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 3,
      zIndex: 10,
    },
    headerDownloadedIndicator: {
      alignItems: 'center',
      borderRadius: 4,
      flexDirection: 'row',
      marginLeft: 8,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      marginLeft: 12,
    },
    loadingAudioContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    loadingAudioText: {
      fontSize: 14,
      marginLeft: 8,
    },
    loadingCard: {
      alignItems: 'center',
      borderRadius: 12,
      elevation: 2,
      padding: 24,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      width: '80%',
    },
    loadingContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 16,
      marginTop: 16,
    },
    loopButton: {
      marginHorizontal: 10,
    },
    mainButton: {
      height: 60,
      width: 60,
    },
    offlineText: {
      fontSize: 14,
      marginLeft: 6,
    },
    offlineWarning: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      paddingBottom: 16,
    },
    pageReference: {
      alignSelf: 'flex-start',
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pageText: {
      fontSize: 12,
    },
    playButton: {
      marginHorizontal: 10,
    },
    playerContainer: {
      padding: 16,
    },
    playerHeader: {
      alignItems: 'center',
      height: 120,
      justifyContent: 'center',
      overflow: 'hidden',
      width: '100%',
    },
    primaryControls: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 16,
    },
    retryButton: {
      alignItems: 'center',
      borderRadius: 8,
      marginBottom: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
      width: '100%',
    },
    retryText: {
      fontSize: 16,
      fontWeight: '600',
    },
    scientificName: {
      fontSize: 14,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 8,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 4,
    },
    slider: {
      height: 40,
      width: '100%',
    },
    smallButton: {
      height: 40,
      width: 40,
    },
    sonogramContainer: {
      alignItems: 'center',
      height: 200,
      justifyContent: 'center',
      marginBottom: 16,
      width: '100%',
    },
    sonogramImage: {
      height: '100%',
      width: '100%',
    },
    speciesActionButton: {
      alignItems: 'center',
      borderRadius: 15,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    speciesHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
    },
    speciesInfo: {
      flex: 1,
    },
    speciesName: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    speedButton: {
      marginHorizontal: 10,
    },
    speedControlContainer: {
      marginTop: 8,
    },
    speedLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    speedOption: {
      alignItems: 'center',
      borderRadius: 20,
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    speedOptionText: {
      fontSize: 14,
      fontWeight: '600',
    },
    speedOptions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    speedText: {
      fontSize: 12,
      fontWeight: '700',
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    timeText: {
      fontSize: 12,
    },
    waveformPlaceholder: {
      alignItems: 'center',
      height: '100%',
      justifyContent: 'center',
      width: '100%',
    },
    waveformPreview: {
      height: '100%',
      width: '100%',
    },
  });

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Loading...</Text>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: loadingAudioTextColor }]}>Loading recording details...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Render error state
  if (error || !recording) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Error</Text>
        </View>

        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
            <Text style={[styles.errorTitle, { color: theme.colors.onSurface }]}>Unable to Load Recording</Text>
            <Text style={[styles.errorText, { color: errorTextColor }]}>
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#2E7D32" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>{recording.title}</Text>
            {isDownloaded(recording.id) && (
              <View style={[styles.headerDownloadedIndicator, { backgroundColor: headerDownloadedIndicatorBg }]}>
                <Ionicons 
                  name="cloud-done" 
                  size={14} 
                  color={cloudDoneColor} 
                />
                <Text style={{ 
                    marginLeft: 4, 
                    fontSize: 12, 
                    color: cloudDoneColor 
                  }}>
                  Downloaded
                </Text>
              </View>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Species Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity
                style={[styles.speciesHeader, { backgroundColor: theme.colors.surface }]}
                onPress={() => {
                  navigation.navigate("SpeciesDetails", { speciesId: recording.species_id });
                }}
              >
                <View style={[styles.speciesInfo, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.speciesName, { color: theme.colors.onSurface }]}>{recording.species?.common_name}</Text>
                  <Text style={[styles.scientificName, { color: scientificNameColor }]}>{recording.species?.scientific_name}</Text>

                  <View style={[styles.pageReference, { backgroundColor: pageReferenceBg }]}>
                    <Text style={[styles.pageText, { color: pageTextColor }]}>Page {recording.book_page_number}</Text>
                  </View>
                </View>
                <View style={[styles.speciesActionButton, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Audio Player Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
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
                  <View style={[styles.waveformPlaceholder, { backgroundColor: theme.colors.surface }]}>
                    <Ionicons name="musical-notes" size={32} color={theme.colors.onSurface} />
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
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Description</Text>
              <Text style={[styles.caption, { color: captionColor }]}>{recording.caption}</Text>
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
                    <Ionicons name="expand" size={20} color={expandIconColor} />
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
                  style={[styles.sonogramImage, { backgroundColor: theme.colors.surface }]}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Download Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              {getDownloadStatus() === "completed" ? (
                <View style={[styles.downloadedContainer, { backgroundColor: theme.colors.surface }]}>
                  <Ionicons name="cloud-done" size={28} color={cloudDoneColor} />
                  <Text style={[styles.downloadedText, { color: theme.colors.onSurface }]}>Available Offline</Text>
                </View>
              ) : getDownloadStatus() === "downloading" ? (
                <View style={[styles.downloadingContainer, { backgroundColor: theme.colors.surface }]}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.downloadingText, { color: downloadingTextColor }]}>Downloading...</Text>
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
                  <Ionicons name="cloud-download" size={22} color={downloadIconColor} />
                  <Text style={[styles.downloadButtonText, { color: downloadTextColor }]}>Download for Offline Use</Text>
                </TouchableOpacity>
              )}

              {!isConnected && getDownloadStatus() === "idle" && (
                <View style={[styles.offlineWarning, { backgroundColor: theme.colors.surface }]}>
                  <Ionicons name="wifi" size={16} color={wifiIconColor} />
                  <Text style={[styles.offlineText, { color: theme.colors.onSurface }]}>Connect to download this recording</Text>
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
