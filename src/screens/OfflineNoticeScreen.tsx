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
import React from "react"

const OfflineNoticeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { isConnected } = useContext(NetworkContext)
  const { downloadedRecordings } = useContext(DownloadContext)
  const { theme, colors, isDarkMode } = useThemedStyles()

  const styles = StyleSheet.create({
    button: {
      marginBottom: 16,
      width: "100%",
    },
    container: {
      alignItems: "center",
      backgroundColor: colors.dark.overlay,
      flex: 1,
      justifyContent: "center",
    },
    content: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 6,
      padding: 24,
      shadowColor: theme.colors.onSurface,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      width: "80%",
    },
    description: {
      color: colors.textSecondary,
      fontSize: 16,
      marginBottom: 24,
      textAlign: "center",
    },
    dismissButton: {
      borderColor: theme.colors.primary,
      width: "100%",
    },
    noDownloadsText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontStyle: "italic",
      marginBottom: 24,
      textAlign: "center",
    },
    reconnectedContainer: {
      alignItems: "center",
      backgroundColor: isDarkMode ? colors.alpha.success[20] : colors.alpha.success[10],
      borderRadius: 8,
      flexDirection: "row",
      marginTop: 24,
      padding: 12,
      width: "100%",
    },
    reconnectedText: {
      color: isDarkMode ? colors.dark.text : colors.light.text,
      flex: 1,
      fontSize: 14,
      marginLeft: 8,
      opacity: 0.8,
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 8,
      marginTop: 16,
    },
  });

  const hasDownloads = downloadedRecordings.length > 0

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={80} color={theme.colors.error} />

        <Text style={styles.title}>You&apos;re Offline</Text>

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
            <Text>View Downloads</Text>
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
          <Text>Dismiss</Text>
        </Button>

        {isConnected && (
          <View style={styles.reconnectedContainer}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.reconnectedText}>You&apos;re back online! You can now access all content.</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default OfflineNoticeScreen
