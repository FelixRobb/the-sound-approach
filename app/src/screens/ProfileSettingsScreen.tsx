import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackgroundPattern from "../components/BackgroundPattern";
import CustomModal from "../components/CustomModal";
import { AuthContext } from "../context/AuthContext";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import type { RootStackParamList } from "../types";

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state: authState, signOut, resetOnboarding } = useContext(AuthContext);
  const { totalStorageUsed, clearAllDownloads } = useContext(DownloadContext);
  const { theme, themeMode, setThemeMode } = useEnhancedTheme();
  const insets = useSafeAreaInsets();

  // Modal states
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showClearDownloadsModal, setShowClearDownloadsModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isClearingDownloads, setIsClearingDownloads] = useState(false);

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
  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  // Handle clear all downloads
  const handleClearAllDownloads = () => {
    setShowClearDownloadsModal(true);
  };

  const confirmClearAllDownloads = async () => {
    setIsClearingDownloads(true);
    try {
      await clearAllDownloads();
    } catch (error) {
      console.error("Clear downloads error:", error);
    } finally {
      setIsClearingDownloads(false);
      setShowClearDownloadsModal(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    navigation.navigate("DeleteAccount");
  };

  const styles = StyleSheet.create({
    accountDetails: {
      paddingBottom: 20,
      paddingHorizontal: 24,
      paddingTop: 60,
    },
    actionButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
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
    avatarContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.outline,
      borderRadius: theme.borderRadius.full,
      borderWidth: 4,
      elevation: 16,
      height: 100,
      justifyContent: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
      width: 100,
      zIndex: 300,
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
      borderRadius: theme.borderRadius.lg,
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
      paddingBottom: 20,
      paddingTop: 8 + insets.top,
      zIndex: 1,
    },
    headerInner: {
      paddingHorizontal: 20,
    },
    profileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
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
      borderRadius: theme.borderRadius.lg,
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
      borderRadius: theme.borderRadius.sm,
      height: 6,
      marginBottom: 16,
      overflow: "hidden",
    },
    storageBarFill: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.borderRadius.sm,
      height: "100%",
    },
    storageButton: {
      alignItems: "center",
      borderRadius: theme.borderRadius.md,
      flex: 1,
      paddingVertical: 12,
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
    storageButtonTextPrimary: {
      color: theme.colors.onTertiary,
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
      borderRadius: theme.borderRadius.lg,
      height: 40,
      justifyContent: "center",
      marginRight: 16,
      width: 40,
    },
    storageInfo: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
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
      borderRadius: theme.borderRadius.lg,
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
      color: theme.colors.onTertiary,
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
      borderRadius: theme.borderRadius.lg,
      flexDirection: "row",
      padding: 2,
    },
    title: {
      color: theme.colors.primary,
      fontSize: theme.typography.headlineLarge.fontSize,
      fontWeight: "bold",
    },
  });

  // Header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>
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
            <Text style={styles.detailValue}>{authState.user?.bookCode ?? "Not available"}</Text>
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
                  onPress={() => setThemeMode(option.mode as "light" | "dark" | "system")}
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
              style={[styles.storageButton, styles.storageButtonSecondary]}
              onPress={() =>
                navigation.navigate("MainTabs", {
                  screen: "Downloads",
                })
              }
            >
              <Text style={[styles.storageButtonText, styles.storageButtonTextSecondary]}>
                Manage Files
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.storageButton, styles.storageButtonPrimary]}
              onPress={handleClearAllDownloads}
            >
              <Text style={[styles.storageButtonText, styles.storageButtonTextPrimary]}>
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
        <TouchableOpacity style={styles.actionButton} onPress={resetOnboarding}>
          <View style={styles.actionButtonIcon}>
            <Ionicons name="refresh-outline" size={22} color={theme.colors.primary} />
          </View>
          <Text style={styles.actionButtonText}>Reset Onboarding</Text>
        </TouchableOpacity>
        {/* Action Buttons */}
        <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
          <View style={styles.actionButtonIcon}>
            <Ionicons name="log-out-outline" size={22} color={theme.colors.primary} />
          </View>
          <Text style={styles.actionButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleDeleteAccount}
        >
          <View style={styles.actionButtonIcon}>
            <Ionicons name="trash-outline" size={22} color={theme.colors.onErrorContainer} />
          </View>
          <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sign Out Modal */}
      <CustomModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to sign in again to access your account."
        icon="log-out-outline"
        iconColor={theme.colors.primary}
        buttons={[
          {
            text: "Cancel",
            onPress: () => setShowSignOutModal(false),
            style: "cancel",
          },
          {
            text: "Sign Out",
            onPress: confirmSignOut,
            style: "destructive",
            loading: isSigningOut,
          },
        ]}
      />

      {/* Clear Downloads Modal */}
      <CustomModal
        visible={showClearDownloadsModal}
        onClose={() => setShowClearDownloadsModal(false)}
        title="Clear All Downloads"
        message="Are you sure you want to delete all downloads? This action cannot be undone and you'll need to download recordings again for offline use."
        icon="trash-outline"
        iconColor={theme.colors.error}
        buttons={[
          {
            text: "Cancel",
            onPress: () => setShowClearDownloadsModal(false),
            style: "cancel",
          },
          {
            text: "Clear All",
            onPress: confirmClearAllDownloads,
            style: "destructive",
            loading: isClearingDownloads,
          },
        ]}
      />
    </View>
  );
};

export default ProfileSettingsScreen;
