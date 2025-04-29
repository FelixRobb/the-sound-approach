"use client"

import { useContext } from "react"
import { View, Text, StyleSheet } from "react-native"
import { Button } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { NetworkContext } from "../context/NetworkContext"
import { DownloadContext } from "../context/DownloadContext"
import { RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useThemedStyles } from "../hooks/useThemedStyles"

const OfflineNoticeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { isConnected } = useContext(NetworkContext)
  const { downloadedRecordings } = useContext(DownloadContext)
  const { theme, isDarkMode } = useThemedStyles()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      width: "80%",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 16,
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    description: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 24,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    },
    button: {
      marginBottom: 16,
      width: "100%",
    },
    dismissButton: {
      width: "100%",
      borderColor: theme.colors.primary,
    },
    noDownloadsText: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 24,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
      fontStyle: "italic",
    },
    reconnectedContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 24,
      padding: 12,
      backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
      borderRadius: 8,
      width: "100%",
    },
    reconnectedText: {
      marginLeft: 8,
      fontSize: 14,
      color: isDarkMode ? '#81C784' : '#2E7D32',
      flex: 1,
    },
  });

  const hasDownloads = downloadedRecordings.length > 0

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={80} color={theme.colors.error} />

        <Text style={styles.title}>You're Offline</Text>

        <Text style={styles.description}>
          {hasDownloads
            ? "You can still access your downloaded recordings while offline."
            : "You don't have any downloaded recordings to access offline."}
        </Text>

        {hasDownloads ? (
          <Button
            mode="contained"
            icon="download"
            onPress={() => {
              navigation.navigate("Downloads")
            }}
            style={styles.button}
          >
            View Downloads
          </Button>
        ) : (
          <Text style={styles.noDownloadsText}>
            Connect to the internet to browse and download recordings for offline use.
          </Text>
        )}

        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()} 
          style={styles.dismissButton}
          textColor={theme.colors.primary}
        >
          Dismiss
        </Button>

        {isConnected && (
          <View style={styles.reconnectedContainer}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.reconnectedText}>You're back online! You can now access all content.</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default OfflineNoticeScreen
