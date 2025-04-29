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

const OfflineNoticeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { isConnected } = useContext(NetworkContext)
  const { downloadedRecordings } = useContext(DownloadContext)

  const hasDownloads = downloadedRecordings.length > 0

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={80} color="#B00020" />

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

        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.dismissButton}>
          Dismiss
        </Button>

        {isConnected && (
          <View style={styles.reconnectedContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
            <Text style={styles.reconnectedText}>You're back online! You can now access all content.</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: "#666666",
  },
  button: {
    marginBottom: 16,
    width: "100%",
  },
  dismissButton: {
    width: "100%",
  },
  noDownloadsText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    color: "#666666",
    fontStyle: "italic",
  },
  reconnectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    width: "100%",
  },
  reconnectedText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2E7D32",
    flex: 1,
  },
})

export default OfflineNoticeScreen
