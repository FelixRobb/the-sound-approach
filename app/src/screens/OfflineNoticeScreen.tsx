import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";

import { DownloadContext } from "../context/DownloadContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { OfflineStackParamList } from "../types";

const OfflineNoticeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OfflineStackParamList>>();
  const { downloadedRecordings } = useContext(DownloadContext);
  const { theme } = useThemedStyles();

  const styles = StyleSheet.create({
    button: {
      marginBottom: 16,
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
      borderRadius: 16,
      elevation: 6,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      width: "80%",
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      marginBottom: 24,
      textAlign: "center",
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 8,
      marginTop: 16,
    },
  });

  const hasDownloads = downloadedRecordings.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={80} color={theme.colors.error} />

        <Text style={styles.title}>You&apos;re Offline</Text>

        <Text style={styles.description}>
          {hasDownloads
            ? "You are in offline mode. You can only access your downloaded recordings."
            : "You don't have any downloaded recordings to access offline. Please connect to the internet to browse and download recordings for offline use."}
        </Text>

        <Button
          mode="contained"
          icon="download"
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
          Return to Offline Content
        </Button>
      </View>
    </View>
  );
};

export default OfflineNoticeScreen;
