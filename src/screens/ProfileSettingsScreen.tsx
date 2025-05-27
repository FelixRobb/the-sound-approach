"use client";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { List } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthContext } from "../context/AuthContext";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { ThemeContext } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state: authState, signOut } = useContext(AuthContext);
  const { totalStorageUsed, clearAllDownloads } = useContext(DownloadContext);
  const { theme: themeMode, setTheme } = useContext(ThemeContext);
  const { isConnected } = useContext(NetworkContext);
  const { theme } = useThemedStyles();
  const insets = useSafeAreaInsets();

  // Create styles based on theme
  const styles = StyleSheet.create({
    backgroundPattern: {
      backgroundColor: theme.colors.background,
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
    disabledItem: {
      opacity: 0.5,
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 4,
      paddingBottom: 20,
      paddingTop: 16 + insets.top,
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
      shadowOpacity: 0.3,
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
      backgroundColor: theme.colors.tertiary,
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
      gap: 6,
      justifyContent: "center",
      paddingHorizontal: 4,
      paddingVertical: 8,
    },
    themeOptionContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      flexDirection: "row",
      marginBottom: 8,
      marginHorizontal: 16,
      marginTop: 8,
      overflow: "hidden",
    },
    themeOptionSelected: {
      backgroundColor: theme.colors.tertiary,
    },
    themeOptionText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: "500",
    },
    themeOptionTextSelected: {
      color: theme.colors.onPrimary,
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
    if (!isConnected) {
      Alert.alert("Cannot Sign Out While Offline", "You need to be online to sign out.", [
        { text: "OK" },
      ]);
      return;
    }

    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  // Handle clear all downloads
  const handleClearAllDownloads = () => {
    if (!isConnected) {
      Alert.alert(
        "Cannot Clear Downloads While Offline",
        "You need to be online to clear all downloaded recordings.",
        [{ text: "OK" }]
      );
      return;
    }

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
          <View>
            <Text style={styles.title}>Profile & Settings</Text>
            <Text style={styles.subtitle}>Customize your experience</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Theme options component
  const ThemeOptions = () => {
    const themeOptions = [
      { mode: "light", icon: "sunny-outline" as const, label: "Light" },
      { mode: "system", icon: "contrast-outline" as const, label: "System" },
      { mode: "dark", icon: "moon-outline" as const, label: "Dark" },
    ];

    return (
      <View style={styles.themeOptionContainer}>
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.mode}
            style={[styles.themeOption, themeMode === option.mode && styles.themeOptionSelected]}
            onPress={() => setTheme(option.mode as "light" | "dark" | "system")}
            activeOpacity={0.7}
          >
            <Ionicons
              name={option.icon}
              size={18}
              color={
                themeMode === option.mode ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.themeOptionText,
                themeMode === option.mode && styles.themeOptionTextSelected,
              ]}
            >
              {option.label}
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
            left={(props) => <List.Icon {...props} icon="email" color={theme.colors.tertiary} />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />

          <List.Item
            title="Book Code"
            description="••••••••"
            left={(props) => <List.Icon {...props} icon="book" color={theme.colors.tertiary} />}
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
            title="Theme"
            description="Choose your preferred theme"
            left={(props) => (
              <List.Icon {...props} icon="theme-light-dark" color={theme.colors.tertiary} />
            )}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />

          <ThemeOptions />
        </View>

        {/* Storage Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder-outline" size={20} color={theme.colors.tertiary} />
            <Text style={styles.sectionTitle}>Storage</Text>
          </View>

          <List.Item
            title="Offline Recordings"
            description="Manage downloaded recordings"
            left={(props) => <List.Icon {...props} icon="download" color={theme.colors.tertiary} />}
            onPress={() => navigation.navigate("MainTabs", { screen: "Downloads" })}
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
            disabled={!isConnected}
            style={[styles.listItem, !isConnected && styles.disabledItem]}
            titleStyle={[styles.listItemTitle, { color: theme.colors.error }]}
            descriptionStyle={styles.listItemDescription}
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity onPress={handleSignOut} disabled={!isConnected}>
          <List.Item
            title="Sign Out"
            left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.primary} />}
            style={[styles.sectionCard, styles.logoutButton, !isConnected && styles.disabledItem]}
            titleStyle={[styles.listItemTitle, styles.listItemSignOut]}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileSettingsScreen;
