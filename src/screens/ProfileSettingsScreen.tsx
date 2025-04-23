"use client"

import { useContext, useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Appbar, List, Switch, Button, Divider } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { AuthContext } from "../context/AuthContext"
import { DownloadContext } from "../context/DownloadContext"
import { ThemeContext } from "../context/ThemeContext"
import { supabase } from "../lib/supabase"

const ProfileSettingsScreen = () => {
  const navigation = useNavigation()
  const { state: authState, signOut } = useContext(AuthContext)
  const { totalStorageUsed, clearAllDownloads } = useContext(DownloadContext)
  const { theme, isDarkMode, setTheme } = useContext(ThemeContext)

  const [isDeleting, setIsDeleting] = useState(false)

  // Format bytes to human-readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure you want to delete your account? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true)
          try {
            await supabase.functions.invoke("delete-account")

            // Sign out after deletion
            await signOut()
          } catch (error) {
            console.error("Delete account error:", error)
            Alert.alert("Error", "Failed to delete account. Please try again later.")
          } finally {
            setIsDeleting(false)
          }
        },
      },
    ])
  }

  // Handle clear all downloads
  const handleClearAllDownloads = () => {
    Alert.alert("Clear All Downloads", "Are you sure you want to delete all downloads? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          try {
            await clearAllDownloads()
            Alert.alert("Success", "All downloads have been cleared.")
          } catch (error) {
            console.error("Clear downloads error:", error)
            Alert.alert("Error", "Failed to clear downloads. Please try again later.")
          }
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Profile & Settings" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title="Email"
            description={authState.user?.email || "Not available"}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <List.Item title="Book Code" description="••••••••" left={(props) => <List.Icon {...props} icon="book" />} />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => <Switch value={isDarkMode} onValueChange={() => setTheme(isDarkMode ? "light" : "dark")} />}
          />
          <List.Item
            title="Theme"
            description={theme === "system" ? "Follow system" : theme === "dark" ? "Dark" : "Light"}
            left={(props) => <List.Icon {...props} icon="palette" />}
            onPress={() => {
              Alert.alert("Select Theme", "Choose your preferred theme", [
                {
                  text: "Light",
                  onPress: () => setTheme("light"),
                },
                {
                  text: "Dark",
                  onPress: () => setTheme("dark"),
                },
                {
                  text: "System",
                  onPress: () => setTheme("system"),
                },
              ])
            }}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Storage</List.Subheader>
          <List.Item
            title="Storage Used"
            description={formatBytes(totalStorageUsed)}
            left={(props) => <List.Icon {...props} icon="folder" />}
          />
          <Button mode="outlined" icon="delete" onPress={handleClearAllDownloads} style={styles.clearButton}>
            Clear All Downloads
          </Button>
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="App Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="The Sound Approach"
            description="© 2023 All Rights Reserved"
            left={(props) => <List.Icon {...props} icon="copyright" />}
          />
          <List.Item
            title="Privacy Policy"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            onPress={() => {
              // Open privacy policy
            }}
          />
          <List.Item
            title="Terms of Service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => {
              // Open terms of service
            }}
          />
          <List.Item
            title="Contact Support"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => {
              // Open support contact
            }}
          />
        </List.Section>

        <View style={styles.buttonContainer}>
          <Button mode="outlined" icon="logout" onPress={handleSignOut} style={styles.signOutButton}>
            Sign Out
          </Button>

          <Button
            mode="text"
            icon="delete"
            onPress={handleDeleteAccount}
            loading={isDeleting}
            disabled={isDeleting}
            style={styles.deleteButton}
            textColor="#B00020"
          >
            Delete Account
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingBottom: 32,
  },
  clearButton: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  buttonContainer: {
    padding: 16,
  },
  signOutButton: {
    marginBottom: 16,
  },
  deleteButton: {
    marginBottom: 16,
  },
})

export default ProfileSettingsScreen
