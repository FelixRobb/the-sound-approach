"use client";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { List, Switch } from "react-native-paper";

import { AuthContext } from "../context/AuthContext";
import { DownloadContext } from "../context/DownloadContext";
import { ThemeContext } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types";

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state: authState, signOut } = useContext(AuthContext);
  const { totalStorageUsed, clearAllDownloads } = useContext(DownloadContext);
  const { theme: themeMode, isDarkMode, setTheme } = useContext(ThemeContext);
  const { theme } = useThemedStyles();

  const [showThemeOptions, setShowThemeOptions] = useState(false);

  // Create styles based on theme
  const styles = StyleSheet.create({
    backgroundPattern: {
      backgroundColor: isDarkMode
        ? `${theme.colors.primary}08` // Very transparent primary color
        : `${theme.colors.primary}05`,
      bottom: 0,
      left: 0,
      opacity: 0.6,
      position: "absolute",
      right: 0,
      top: 0,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      padding: 16,
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 4,
      paddingBottom: 20,
      paddingTop: 50,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      zIndex: 1,
    },
    headerInner: {
      paddingHorizontal: 20,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerText: {
      flex: 1,
      marginLeft: 12,
    },
    listItem: {
      paddingVertical: 6,
    },
    listItemDescription: {
      color: theme.colors.onSurfaceVariant,
    },
    listItemSignOut: {
      fontWeight: "500",
      textAlign: "center",
    },
    listItemTitle: {
      color: theme.colors.onSurface,
    },
    logoutButton: {
      marginBottom: 32,
      marginHorizontal: 16,
      marginTop: 24,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 2,
      marginBottom: 16,
      padding: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 4,
    },
    sectionHeader: {
      alignItems: "center",
      borderBottomColor: theme.colors.surfaceVariant,
      borderBottomWidth: 1,
      flexDirection: "row",
      padding: 12,
    },
    sectionTitle: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    storageBar: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 4,
      height: 8,
      marginBottom: 4,
      marginHorizontal: 16,
      marginTop: 8,
      overflow: "hidden",
    },
    storageBarFill: {
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      height: "100%",
    },
    storageText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginRight: 16,
      textAlign: "right",
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      marginTop: 2,
    },
    themeOption: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      padding: 12,
    },
    themeOptionBorder: {
      borderColor: theme.colors.outline,
      borderRightWidth: 1,
    },
    themeOptionContainer: {
      borderRadius: 12,
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 8,
      overflow: "hidden",
    },
    themeOptionIcon: {
      marginRight: 8,
    },
    themeOptionSelected: {
      backgroundColor: theme.colors.surface,
    },
    themeOptionText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontWeight: "500",
    },
    themeOptionTextSelected: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    title: {
      color: theme.colors.primary,
      fontSize: 28,
      fontWeight: "bold",
    },
  });

  // Format bytes to human-readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.functions.invoke("delete-account");

              // Sign out after deletion
              await signOut();
            } catch (error) {
              console.error("Delete account error:", error);
              Alert.alert("Error", "Failed to delete account. Please try again later.");
            }
          },
        },
      ]
    );
  };

  // Handle clear all downloads
  const handleClearAllDownloads = () => {
    Alert.alert(
      "Clear All Downloads",
      "Are you sure you want to delete all downloads? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllDownloads();
              Alert.alert("Success", "All downloads have been cleared.");
            } catch (error) {
              console.error("Clear downloads error:", error);
              Alert.alert("Error", "Failed to clear downloads. Please try again later.");
            }
          },
        },
      ]
    );
  };

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  // Header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Profile & Settings</Text>
            <Text style={styles.subtitle}>Customize your experience</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Theme options component
  const ThemeOptions = () => {
    const getIconColor = (mode: string) => {
      if (themeMode === mode) {
        return theme.colors.primary;
      }
      return isDarkMode ? theme.colors.onSurfaceVariant : theme.colors.onSurfaceVariant;
    };

    const themeOptions = [
      { mode: "light", icon: "sunny-outline" as const, label: "Light" },
      { mode: "system", icon: "contrast-outline" as const, label: "System" },
      { mode: "dark", icon: "moon-outline" as const, label: "Dark" },
    ];

    return (
      <View style={[styles.themeOptionContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        {themeOptions.map((item, index) => (
          <TouchableOpacity
            key={item.mode}
            style={[
              styles.themeOption,
              themeMode === item.mode && styles.themeOptionSelected,
              index < 2 && styles.themeOptionBorder,
            ]}
            onPress={() => setTheme(item.mode as "light" | "dark" | "system")}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={getIconColor(item.mode)}
              style={styles.themeOptionIcon}
            />
            <Text
              style={[
                styles.themeOptionText,
                themeMode === item.mode && styles.themeOptionTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

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
            left={(props) => (
              <List.Icon {...props} icon="theme-light-dark" color={theme.colors.primary} />
            )}
            right={() => (
              <Switch
                value={isDarkMode}
                onValueChange={() => setTheme(isDarkMode ? "light" : "dark")}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
          />

          <List.Item
            title="Theme"
            description={
              themeMode === "system" ? "Follow system" : themeMode === "dark" ? "Dark" : "Light"
            }
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
            <View
              style={[
                styles.storageBarFill,
                { width: `${Math.min((totalStorageUsed / (500 * 1024 * 1024)) * 100, 100)}%` },
              ]}
            />
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
            onPress={() =>
              Alert.alert("Coming Soon", "This feature will be available in a future update.")
            }
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
          />

          <List.Item
            title="Delete Account"
            description="Permanently remove all your data"
            left={(props) => (
              <List.Icon {...props} icon="account-remove" color={theme.colors.error} />
            )}
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
            titleStyle={[styles.listItemTitle, styles.listItemSignOut]}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileSettingsScreen;
