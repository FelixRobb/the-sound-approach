import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { useGlobalAudioBarHeight } from "../../components/GlobalAudioBar";
import { DownloadContext } from "../../context/DownloadContext";
import { useEnhancedTheme } from "../../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../../lib/theme";
import type { OfflineStackParamList } from "../../types";

const OfflineNoticeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OfflineStackParamList>>();
  const { downloadedRecordings } = useContext(DownloadContext);
  const { theme } = useEnhancedTheme();
  const globalAudioBarHeight = useGlobalAudioBarHeight();
  const styles = StyleSheet.create({
    button: {
      marginBottom: theme.spacing.md,
      width: "100%",
    },
    container: {
      alignItems: "center",
      backgroundColor: theme.colors.background,
      flex: 1,
      justifyContent: "center",
    },
    content: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 6,
      padding: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      width: "80%",
    },
    description: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
    title: {
      ...createThemedTextStyle(theme, {
        size: "2xl",
        weight: "bold",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
  });

  const hasDownloads = downloadedRecordings.length > 0;

  return (
    <View style={[styles.container, { paddingBottom: globalAudioBarHeight }]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={80} color={theme.colors.error} />

        <Text style={styles.title}>You&apos;re Offline</Text>

        <Text style={styles.description}>
          {hasDownloads
            ? "You are in offline mode. You can only access your downloaded recordings."
            : "You don't have any downloaded recordings to access offline. Please connect to the internet to browse and download recordings for offline use."}
        </Text>

        <TouchableOpacity
          onPress={() => {
            try {
              // First try to go back (dismiss the modal)
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Fallback: navigate to OfflineMain
                navigation.navigate("OfflineMain");
              }
            } catch (error) {
              console.error("Navigation error:", error);
            }
          }}
          style={styles.button}
        >
          <Ionicons name="download-outline" size={20} color={theme.colors.onSurface} />
          Return to Offline Content
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OfflineNoticeScreen;
