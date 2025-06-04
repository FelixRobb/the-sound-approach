import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthContext } from "../context/AuthContext";
import { DownloadContext } from "../context/DownloadContext";
import { NetworkContext } from "../context/NetworkContext";
import { ThemeContext } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state: authState, signOut, deleteAccount, clearError } = useContext(AuthContext);
  const { totalStorageUsed, clearAllDownloads } = useContext(DownloadContext);
  const { theme: themeMode, setTheme } = useContext(ThemeContext);
  const { isConnected } = useContext(NetworkContext);
  const { theme } = useThemedStyles();
  const insets = useSafeAreaInsets();

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

    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Sign out error:", error);
          }
        },
      },
    ]);
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

  // Handle delete account
  const handleDeleteAccount = () => {
    if (!isConnected) {
      Alert.alert(
        "Cannot Delete Account While Offline",
        "You need to be online to delete your account.",
        [{ text: "OK" }]
      );
      return;
    }
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAccount();
          },
        },
      ]
    );
  };

  // Create styles with theme support
  const styles = StyleSheet.create({
    actionButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 3,
      flexDirection: "row",
      marginBottom: 12,
      padding: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    actionButtonDanger: {
      backgroundColor: theme.colors.errorContainer,
    },
    actionButtonDisabled: {
      backgroundColor: theme.colors.surfaceDisabled,
      opacity: 0.5,
    },
    actionButtonIcon: {
      marginRight: 16,
    },
    actionButtonText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "500",
    },
    actionButtonTextDanger: {
      color: theme.colors.onErrorContainer,
      fontWeight: "600",
    },
    actionButtonTextDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
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
    errorClose: {
      marginLeft: 8,
    },
    errorContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 12,
      flexDirection: "row",
      margin: 16,
      padding: 12,
    },
    errorMessage: {
      color: theme.colors.error,
      flex: 1,
      marginLeft: 8,
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
    infoContent: {
      flex: 1,
    },
    infoIcon: {
      alignItems: "center",
      marginRight: 16,
      width: 24,
    },
    infoItem: {
      alignItems: "center",
      flexDirection: "row",
      padding: 16,
      paddingVertical: 12,
    },
    infoLabel: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "500",
    },
    infoValue: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 2,
    },
    offlineBanner: {
      alignItems: "center",
      backgroundColor: theme.colors.error,
      borderColor: theme.colors.onError,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: "row",
      marginHorizontal: 20,
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 6,
      shadowColor: theme.colors.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    offlineBannerText: {
      color: theme.colors.onError,
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      marginLeft: 12,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 80,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 3,
      marginBottom: 16,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    sectionHeader: {
      alignItems: "center",
      borderBottomColor: theme.colors.surfaceVariant,
      borderBottomWidth: 1,
      flexDirection: "row",
      padding: 16,
      paddingBottom: 12,
    },
    sectionTitle: {
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 12,
    },
    storageActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },
    storageBar: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 6,
      height: 12,
      marginVertical: 8,
      overflow: "hidden",
    },
    storageBarFill: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: 6,
      height: "100%",
    },
    storageButton: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: 8,
      flex: 1,
      paddingVertical: 10,
    },
    storageButtonDisabled: {
      backgroundColor: theme.colors.surfaceDisabled,
    },
    storageButtonText: {
      color: theme.colors.onTertiary,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    storageButtonTextDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    storageContainer: {
      padding: 16,
    },
    storageHeader: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: 12,
    },
    storageText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      textAlign: "center",
    },
    storageTitle: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 12,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      marginTop: 2,
    },
    themeContainer: {
      padding: 16,
    },
    themeLabel: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 12,
    },
    themeOption: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      paddingVertical: 12,
    },
    themeOptionSelected: {
      backgroundColor: theme.colors.tertiary,
    },
    themeOptionText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontWeight: "500",
    },
    themeOptionTextSelected: {
      color: theme.colors.onTertiary,
      fontWeight: "600",
    },
    themeOptions: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      flexDirection: "row",
      overflow: "hidden",
    },
    title: {
      color: theme.colors.primary,
      fontSize: 28,
      fontWeight: "bold",
    },
  });

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  // Header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={22} color={theme.colors.onError} />
          <Text style={styles.offlineBannerText}>Offline Mode - Some features are unavailable</Text>
        </View>
      )}
    </View>
  );

  // Theme options component
  const ThemeSection = () => {
    const themeOptions = [
      { mode: "light", icon: "sunny-outline" as const, label: "Light" },
      { mode: "system", icon: "contrast-outline" as const, label: "Auto" },
      { mode: "dark", icon: "moon-outline" as const, label: "Dark" },
    ];

    return (
      <View style={styles.themeContainer}>
        <Text style={styles.themeLabel}>Theme Preference</Text>
        <View style={styles.themeOptions}>
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
                  themeMode === option.mode
                    ? theme.colors.onTertiary
                    : theme.colors.onSurfaceVariant
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
      </View>
    );
  };

  // Storage section component
  const StorageSection = () => {
    const storagePercentage = Math.min((totalStorageUsed / (500 * 1024 * 1024)) * 100, 100);

    return (
      <View style={styles.storageContainer}>
        <View style={styles.storageHeader}>
          <Ionicons name="folder-outline" size={20} color={theme.colors.tertiary} />
          <Text style={styles.storageTitle}>Storage Management</Text>
        </View>

        <View style={styles.storageBar}>
          <View style={[styles.storageBarFill, { width: `${storagePercentage}%` }]} />
        </View>

        <Text style={styles.storageText}>{formatBytes(totalStorageUsed)} used of 500 MB</Text>

        <View style={styles.storageActions}>
          <TouchableOpacity
            style={[styles.storageButton, !isConnected && styles.storageButtonDisabled]}
            onPress={() =>
              navigation.navigate("MainTabs", {
                screen: "Downloads",
                params: { screen: "DownloadsList" },
              })
            }
            disabled={!isConnected}
          >
            <Text
              style={[styles.storageButtonText, !isConnected && styles.storageButtonTextDisabled]}
            >
              Manage Downloads
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.storageButton, !isConnected && styles.storageButtonDisabled]}
            onPress={handleClearAllDownloads}
            disabled={!isConnected}
          >
            <Text
              style={[styles.storageButtonText, !isConnected && styles.storageButtonTextDisabled]}
            >
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.tertiary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{authState.user?.email || "Not available"}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="book-outline" size={20} color={theme.colors.tertiary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Book Code</Text>
              <Text style={styles.infoValue}>••••••••</Text>
            </View>
          </View>

          {/* Error message display */}
          {authState.error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.errorMessage}>{authState.error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorClose}>
                <Ionicons name="close" size={18} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Appearance Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>

          <ThemeSection />
        </View>

        {/* Storage Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-download-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Downloads & Storage</Text>
          </View>

          <StorageSection />
        </View>

        {/* Account Actions */}
        <TouchableOpacity
          style={[styles.actionButton, !isConnected && styles.actionButtonDisabled]}
          onPress={handleSignOut}
          disabled={!isConnected}
        >
          <View style={styles.actionButtonIcon}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={isConnected ? theme.colors.primary : theme.colors.onSurfaceDisabled}
            />
          </View>
          <Text style={[styles.actionButtonText, !isConnected && styles.actionButtonTextDisabled]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonDanger,
            !isConnected && styles.actionButtonDisabled,
          ]}
          onPress={handleDeleteAccount}
          disabled={!isConnected}
        >
          <View style={styles.actionButtonIcon}>
            <Ionicons
              name="trash-outline"
              size={24}
              color={isConnected ? theme.colors.onErrorContainer : theme.colors.onSurfaceDisabled}
            />
          </View>
          <Text
            style={[
              styles.actionButtonText,
              styles.actionButtonTextDanger,
              !isConnected && styles.actionButtonTextDisabled,
            ]}
          >
            Delete Account
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileSettingsScreen;
