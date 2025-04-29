"use client"

import React, { useContext, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions, TouchableOpacity } from "react-native"
import { List, Switch, Divider, RadioButton } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"
import { DownloadContext } from "../context/DownloadContext"
import { ThemeContext } from "../context/ThemeContext"
import { supabase } from "../lib/supabase"
import { RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useThemedStyles } from "../hooks/useThemedStyles"

const { width } = Dimensions.get("window")

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { state: authState, signOut } = useContext(AuthContext)
  const { totalStorageUsed, clearAllDownloads } = useContext(DownloadContext)
  const { theme: themeMode, isDarkMode, setTheme } = useContext(ThemeContext)
  const { theme } = useThemedStyles()

  const [isDeleting, setIsDeleting] = useState(false)
  const [showThemeOptions, setShowThemeOptions] = useState(false)

  // Create styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backgroundPattern: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDarkMode ? 
        `${theme.colors.primary}08` : // Very transparent primary color
        `${theme.colors.primary}05`,
      opacity: 0.6,
    },
    header: {
      paddingTop: 50,
      paddingHorizontal: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginLeft: 8,
      color: theme.colors.onSurface,
    },
    content: {
      padding: 16,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      padding: 4,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 4,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
      color: theme.colors.primary,
    },
    listItem: {
      paddingVertical: 6,
    },
    listItemTitle: {
      color: theme.colors.onSurface,
    },
    listItemDescription: {
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    },
    button: {
      marginTop: 8,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    dangerButton: {
      backgroundColor: theme.colors.error,
    },
    logoutButton: {
      marginTop: 24,
      marginHorizontal: 16,
      marginBottom: 32,
    },
    themeOptionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 8,
    },
    themeOption: {
      alignItems: 'center',
      width: width / 3.5,
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
    },
    themeOptionLight: {
      backgroundColor: '#FFFFFF',
      borderColor: themeMode === 'light' ? theme.colors.primary : '#E0E0E0',
    },
    themeOptionDark: {
      backgroundColor: '#121212',
      borderColor: themeMode === 'dark' ? theme.colors.primary : '#333333',
    },
    themeOptionSystem: {
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
      borderColor: themeMode === 'system' ? theme.colors.primary : isDarkMode ? '#333333' : '#E0E0E0',
      overflow: 'hidden',
    },
    themeOptionDivider: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 2,
      left: '50%',
      backgroundColor: isDarkMode ? '#FFFFFF' : '#121212',
    },
    themeOptionText: {
      marginTop: 8,
      fontWeight: '500',
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    themeOptionIcon: {
      padding: 8,
      borderRadius: 20,
    },
    storageBar: {
      height: 8,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 4,
      marginTop: 8,
      marginBottom: 4,
      marginHorizontal: 16,
      overflow: 'hidden',
    },
    storageBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
    },
    storageText: {
      fontSize: 12,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      textAlign: 'right',
      marginRight: 16,
    },
  });

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
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>
      </View>
    </View>
  )

  // Theme options component
  const ThemeOptions = () => (
    <View style={styles.themeOptionContainer}>
      <TouchableOpacity 
        style={[styles.themeOption, styles.themeOptionLight]} 
        onPress={() => setTheme('light')}
      >
        <Ionicons 
          name="sunny" 
          size={24} 
          color={themeMode === 'light' ? theme.colors.primary : "#333"}
          style={styles.themeOptionIcon}
        />
        <Text style={styles.themeOptionText}>Light</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.themeOption, styles.themeOptionDark]} 
        onPress={() => setTheme('dark')}
      >
        <Ionicons 
          name="moon" 
          size={24} 
          color={themeMode === 'dark' ? theme.colors.primary : "#FFF"}
          style={styles.themeOptionIcon}
        />
        <Text style={[styles.themeOptionText, { color: '#FFF' }]}>Dark</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.themeOption, styles.themeOptionSystem]} 
        onPress={() => setTheme('system')}
      >
        <View style={styles.themeOptionDivider} />
        <Ionicons 
          name="contrast" 
          size={24} 
          color={themeMode === 'system' ? theme.colors.primary : isDarkMode ? "#FFF" : "#333"}
          style={styles.themeOptionIcon}
        />
        <Text style={styles.themeOptionText}>System</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          
          <List.Item
            title="Email"
            description={authState.user?.email || "Not available"}
            left={(props) => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          
          <List.Item 
            title="Book Code" 
            description="••••••••" 
            left={(props) => <List.Icon {...props} icon="book" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
        </View>

        {/* Appearance Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>
          
          <List.Item
            title="Dark Mode"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" color={theme.colors.primary} />}
            right={() => <Switch value={isDarkMode} onValueChange={() => setTheme(isDarkMode ? "light" : "dark")} color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
          />
          
          <List.Item
            title="Theme"
            description={themeMode === "system" ? "Follow system" : themeMode === "dark" ? "Dark" : "Light"}
            left={(props) => <List.Icon {...props} icon="palette" color={theme.colors.primary} />}
            onPress={() => setShowThemeOptions(!showThemeOptions)}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
            right={(props) => (
              <List.Icon 
                {...props} 
                icon={showThemeOptions ? "chevron-up" : "chevron-down"} 
                color={theme.colors.primary} 
              />
            )}
          />
          
          {showThemeOptions && <ThemeOptions />}
        </View>

        {/* Storage Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Storage</Text>
          </View>
          
          <List.Item
            title="Offline Recordings"
            description="Manage downloaded recordings"
            left={(props) => <List.Icon {...props} icon="download" color={theme.colors.primary} />}
            onPress={() => navigation.navigate("Downloads")}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          
          <View style={styles.storageBar}>
            <View style={[styles.storageBarFill, { width: `${Math.min((totalStorageUsed / (500 * 1024 * 1024)) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.storageText}>{formatBytes(totalStorageUsed)} used of 500 MB</Text>
          
          <List.Item
            title="Clear All Downloads"
            description="Free up storage space"
            left={(props) => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
            onPress={handleClearAllDownloads}
            style={styles.listItem}
            titleStyle={[styles.listItemTitle, { color: theme.colors.error }]}
            descriptionStyle={styles.listItemDescription}
          />
        </View>

        {/* Security Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          
          <List.Item
            title="Change Password"
            left={(props) => <List.Icon {...props} icon="key" color={theme.colors.primary} />}
            onPress={() => Alert.alert("Coming Soon", "This feature will be available in a future update.")}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
          />
          
          <List.Item
            title="Delete Account"
            description="Permanently remove all your data"
            left={(props) => <List.Icon {...props} icon="account-remove" color={theme.colors.error} />}
            onPress={handleDeleteAccount}
            style={styles.listItem}
            titleStyle={[styles.listItemTitle, { color: theme.colors.error }]}
            descriptionStyle={styles.listItemDescription}
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity onPress={handleSignOut}>
          <List.Item
            title="Sign Out"
            left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.primary} />}
            style={[styles.sectionCard, styles.logoutButton]}
            titleStyle={[styles.listItemTitle, { textAlign: 'center', fontWeight: '500' }]}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

export default ProfileSettingsScreen
