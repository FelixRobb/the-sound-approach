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
  const { state: authState, signOut } = useContext(AuthContext);
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
    navigation.navigate("DeleteAccount");
  };

  const styles = StyleSheet.create({
    accountDetails: {
      borderTopColor: theme.colors.surfaceVariant,
      borderTopWidth: 1,
      paddingBottom: 20,
      paddingHorizontal: 24,
      paddingTop: 60,
    },
    actionButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 2,
      flexDirection: "row",
      marginBottom: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    actionButtonDanger: {
      backgroundColor: theme.colors.errorContainer,
    },
    actionButtonDisabled: {
      backgroundColor: theme.colors.surfaceDisabled,
      opacity: 0.6,
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
    avatarContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.surface,
      borderRadius: 50,
      borderWidth: 4,
      elevation: 8,
      height: 100,
      justifyContent: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      width: 100,
      zIndex: 300,
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
    cardContent: {
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    cardHeader: {
      alignItems: "center",
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    cardIcon: {
      marginRight: 12,
    },
    cardTitle: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "600",
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    detailContent: {
      flex: 1,
    },
    detailIcon: {
      marginRight: 16,
      width: 20,
    },
    detailLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: "500",
      marginBottom: 2,
    },
    detailRow: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: 16,
    },
    detailRowLast: {
      marginBottom: 0,
    },
    detailValue: {
      color: theme.colors.onSurface,
      fontSize: 15,
      fontWeight: "600",
    },
    downloadsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 2,
      marginBottom: 24,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    downloadsContent: {
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    downloadsHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    downloadsTitle: {
      alignItems: "center",
      flexDirection: "row",
    },
    downloadsTitleText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 12,
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
      paddingVertical: 8,
      shadowColor: theme.colors.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    offlineBannerText: {
      color: theme.colors.onError,
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 12,
    },
    profileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      elevation: 4,
      marginBottom: 24,
      marginTop: 50,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    profileHeader: {
      alignItems: "center",
      left: 0,
      position: "absolute",
      right: 0,
      top: -50,
      zIndex: 400,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    settingsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 2,
      marginBottom: 16,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    storageActions: {
      flexDirection: "row",
      gap: 12,
    },
    storageBar: {
      backgroundColor: theme.colors.outline,
      borderRadius: 4,
      height: 6,
      marginBottom: 16,
      overflow: "hidden",
    },
    storageBarFill: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: 4,
      height: "100%",
    },
    storageButton: {
      alignItems: "center",
      borderRadius: 10,
      flex: 1,
      paddingVertical: 12,
    },
    storageButtonDisabled: {
      backgroundColor: theme.colors.surfaceDisabled,
      opacity: 0.6,
    },
    storageButtonPrimary: {
      backgroundColor: theme.colors.tertiary,
    },
    storageButtonSecondary: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.outline,
      borderWidth: 1,
    },
    storageButtonText: {
      fontSize: 14,
      fontWeight: "600",
    },
    storageButtonTextDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    storageButtonTextPrimary: {
      color: theme.colors.onPrimary,
    },
    storageButtonTextSecondary: {
      color: theme.colors.onSurfaceVariant,
    },
    storageDetails: {
      flex: 1,
    },
    storageIconContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.tertiary,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      marginRight: 16,
      width: 40,
    },
    storageInfo: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      flexDirection: "row",
      marginBottom: 16,
      padding: 16,
    },
    storageMainText: {
      color: theme.colors.onSurface,
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 2,
    },
    storageSubText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
    storageUsed: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      marginTop: 2,
    },
    themeLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    themeOption: {
      alignItems: "center",
      borderRadius: 18,
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    themeOptionActive: {
      backgroundColor: theme.colors.tertiary,
    },
    themeOptionText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: "500",
    },
    themeOptionTextActive: {
      color: theme.colors.onPrimary,
      fontWeight: "600",
    },
    themeRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    themeSelector: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 20,
      flexDirection: "row",
      padding: 2,
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
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={20} color={theme.colors.onError} />
          <Text style={styles.offlineBannerText}>Offline Mode - Limited functionality</Text>
        </View>
      )}
    </View>
  );

  // Profile card with account details
  const ProfileCard = () => (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={50} color={theme.colors.onPrimary} />
        </View>
      </View>
      <View style={styles.accountDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{authState.user?.email || "Not available"}</Text>
          </View>
        </View>

        <View style={[styles.detailRow, styles.detailRowLast]}>
          <View style={styles.detailIcon}>
            <Ionicons name="key-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Book Access Code</Text>
            <Text style={styles.detailValue}>••••••••</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Theme settings card
  const ThemeCard = () => {
    const themeOptions = [
      { mode: "light", label: "Light" },
      { mode: "system", label: "Auto" },
      { mode: "dark", label: "Dark" },
    ];

    return (
      <View style={styles.settingsCard}>
        <View style={styles.cardHeader}>
          <Ionicons
            name="color-palette-outline"
            size={20}
            color={theme.colors.primary}
            style={styles.cardIcon}
          />
          <Text style={styles.cardTitle}>Appearance</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.themeRow}>
            <Text style={styles.themeLabel}>Theme</Text>
            <View style={styles.themeSelector}>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.mode}
                  style={[
                    styles.themeOption,
                    themeMode === option.mode && styles.themeOptionActive,
                  ]}
                  onPress={() => setTheme(option.mode as "light" | "dark" | "system")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      themeMode === option.mode && styles.themeOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Downloads card
  const DownloadsCard = () => {
    const storagePercentage = Math.min((totalStorageUsed / (500 * 1024 * 1024)) * 100, 100);

    return (
      <View style={styles.downloadsCard}>
        <View style={styles.downloadsHeader}>
          <View style={styles.downloadsTitle}>
            <Ionicons name="cloud-download-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.downloadsTitleText}>Downloads & Storage</Text>
          </View>
          <Text style={styles.storageUsed}>{formatBytes(totalStorageUsed)}</Text>
        </View>

        <View style={styles.downloadsContent}>
          <View style={styles.storageInfo}>
            <View style={styles.storageIconContainer}>
              <Ionicons name="folder" size={20} color={theme.colors.onTertiary} />
            </View>
            <View style={styles.storageDetails}>
              <Text style={styles.storageMainText}>{formatBytes(totalStorageUsed)} used</Text>
              <Text style={styles.storageSubText}>of 500 MB available</Text>
            </View>
          </View>

          <View style={styles.storageBar}>
            <View style={[styles.storageBarFill, { width: `${storagePercentage}%` }]} />
          </View>

          <View style={styles.storageActions}>
            <TouchableOpacity
              style={[
                styles.storageButton,
                styles.storageButtonSecondary,
                !isConnected && styles.storageButtonDisabled,
              ]}
              onPress={() =>
                navigation.navigate("MainTabs", {
                  screen: "Downloads",
                  params: { screen: "DownloadsList" },
                })
              }
              disabled={!isConnected}
            >
              <Text
                style={[
                  styles.storageButtonText,
                  styles.storageButtonTextSecondary,
                  !isConnected && styles.storageButtonTextDisabled,
                ]}
              >
                Manage Files
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.storageButton,
                styles.storageButtonPrimary,
                !isConnected && styles.storageButtonDisabled,
              ]}
              onPress={handleClearAllDownloads}
              disabled={!isConnected}
            >
              <Text
                style={[
                  styles.storageButtonText,
                  styles.storageButtonTextPrimary,
                  !isConnected && styles.storageButtonTextDisabled,
                ]}
              >
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ProfileCard />
        <ThemeCard />
        <DownloadsCard />

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.actionButton, !isConnected && styles.actionButtonDisabled]}
          onPress={handleSignOut}
          disabled={!isConnected}
        >
          <View style={styles.actionButtonIcon}>
            <Ionicons
              name="log-out-outline"
              size={22}
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
              size={22}
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
