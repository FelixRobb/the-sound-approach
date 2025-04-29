"use client"

import React, { useContext, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions, TouchableOpacity } from "react-native"
import { List, Switch } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"
import { DownloadContext } from "../context/DownloadContext"
import { ThemeContext } from "../context/ThemeContext"
import { supabase } from "../lib/supabase"
import { RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

const { width } = Dimensions.get("window")

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
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

  // Background pattern
  const BackgroundPattern = () => (
    <View style={styles.backgroundPattern} />
  )

  // Header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="settings-outline" size={24} color="#2E7D32" />
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={20} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          
          <List.Item
            title="Email"
            description={authState.user?.email || "Not available"}
            left={(props) => <List.Icon {...props} icon="email" color="#2E7D32" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          
          <List.Item 
            title="Book Code" 
            description="••••••••" 
            left={(props) => <List.Icon {...props} icon="book" color="#2E7D32" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
        </View>

        {/* Appearance Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>
          
          <List.Item
            title="Dark Mode"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" color="#2E7D32" />}
            right={() => <Switch value={isDarkMode} onValueChange={() => setTheme(isDarkMode ? "light" : "dark")} color="#2E7D32" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
          />
          
          <List.Item
            title="Theme"
            description={theme === "system" ? "Follow system" : theme === "dark" ? "Dark" : "Light"}
            left={(props) => <List.Icon {...props} icon="palette" color="#2E7D32" />}
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
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
        </View>

        {/* Storage Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder-outline" size={20} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Storage</Text>
          </View>
          
          <List.Item
            title="Storage Used"
            description={formatBytes(totalStorageUsed)}
            left={(props) => <List.Icon {...props} icon="folder" color="#2E7D32" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearAllDownloads}
            >
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Clear All Downloads</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#2E7D32" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          
          <List.Item
            title="App Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" color="#2E7D32" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          
          <List.Item
            title="The Sound Approach"
            description="© 2023 All Rights Reserved"
            left={(props) => <List.Icon {...props} icon="copyright" color="#2E7D32" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          
          <TouchableOpacity>
            <List.Item
              title="Privacy Policy"
              left={(props) => <List.Icon {...props} icon="shield-account" color="#2E7D32" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color="#666666" />}
              style={styles.listItem}
              titleStyle={styles.listItemTitle}
            />
          </TouchableOpacity>
          
          <TouchableOpacity>
            <List.Item
              title="Terms of Service"
              left={(props) => <List.Icon {...props} icon="file-document" color="#2E7D32" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color="#666666" />}
              style={styles.listItem}
              titleStyle={styles.listItemTitle}
            />
          </TouchableOpacity>
          
          <TouchableOpacity>
            <List.Item
              title="Contact Support"
              left={(props) => <List.Icon {...props} icon="help-circle" color="#2E7D32" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color="#666666" />}
              style={styles.listItem}
              titleStyle={styles.listItemTitle}
            />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.accountActionsContainer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Text style={styles.deleteButtonText}>Deleting...</Text>
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#B00020" />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  backgroundPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginLeft: 8,
  },
  backButton: {
    padding: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginLeft: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
  listItemTitle: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  listItemDescription: {
    fontSize: 14,
    color: "#666666",
  },
  buttonWrapper: {
    padding: 16,
    paddingTop: 8,
  },
  actionButton: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  accountActionsContainer: {
    padding: 16,
  },
  signOutButton: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  signOutButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "rgba(176, 0, 32, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: "#B00020",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
})

export default ProfileSettingsScreen
