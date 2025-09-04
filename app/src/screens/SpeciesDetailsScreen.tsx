import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";

import BackgroundPattern from "../components/BackgroundPattern";
import DetailHeader from "../components/DetailHeader";
import { useGlobalAudioBarHeight } from "../components/GlobalAudioBar";
import LoadingScreen from "../components/LoadingScreen";
import RecordingCard from "../components/RecordingCard";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { fetchRecordingsBySpecies } from "../lib/supabase";
import { createThemedTextStyle } from "../lib/theme";
import type { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const SpeciesDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "SpeciesDetails">>();
  const { isDownloaded } = useContext(DownloadContext);
  const { theme } = useEnhancedTheme();
  const globalAudioBarHeight = useGlobalAudioBarHeight();

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
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      marginBottom: globalAudioBarHeight,
      overflow: "hidden",
      padding: theme.spacing.md,
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
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    emptyText: {
      color: theme.colors.onSurface,
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurface",
      }),
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
    errorCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 4,
      padding: theme.spacing.md,
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
      padding: theme.spacing.md,
    },
    errorText: {
      color: theme.colors.onSurface,
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
    errorTitle: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "bold",
        color: "error",
      }),
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    goBackButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    goBackText: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurface",
      }),
    },
    recordingCountBadge: {
      backgroundColor: theme.colors.onPrimary,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    recordingCountText: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "bold",
        color: "onSurface",
      }),
    },
    recordingsList: {
      borderRadius: theme.borderRadius.md,
      overflow: "hidden",
    },
    retryButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    retryText: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurface",
      }),
      marginLeft: theme.spacing.sm,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
  });

  // Handle retry
  const handleRetry = () => {
    void refetch();
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
      <BackgroundPattern />
      <DetailHeader title={speciesName} subtitle={scientificName} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Recordings Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text
              style={createThemedTextStyle(theme, {
                size: "xl",
                weight: "bold",
                color: "onSurface",
              })}
            >
              Recordings
            </Text>
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
              {recordings.map((item) => (
                <RecordingCard
                  key={item.id}
                  recording={item}
                  sortBy="speciescommon"
                  isDownloaded={isDownloaded(item.id)}
                  indented={false}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default SpeciesDetailsScreen;
