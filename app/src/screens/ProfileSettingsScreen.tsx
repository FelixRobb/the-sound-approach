import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackgroundPattern from "../components/BackgroundPattern";
import CustomModal from "../components/CustomModal";
import { useGlobalAudioBarHeight } from "../components/GlobalAudioBar";
import { Button } from "../components/ui";
import { AuthContext } from "../context/AuthContext";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme/typography";
import type { RootStackParamList } from "../types";

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state: authState, signOut, resetOnboarding } = useContext(AuthContext);
  const { totalStorageUsed, clearAllDownloads } = useContext(DownloadContext);
  const { theme, themeMode, setThemeMode } = useEnhancedTheme();
  const insets = useSafeAreaInsets();
  const globalAudioBarHeight = useGlobalAudioBarHeight();

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
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
    },
    actionButton: {
      marginBottom: theme.spacing.sm,
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
      zIndex: theme.zIndex.base,
    },

    cardContent: {
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
    },
    cardHeader: {
      alignItems: "center",
      flexDirection: "row",
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
    },
    cardIcon: {
      marginRight: theme.spacing.sm,
    },
    cardTitle: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurface",
      }),
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    detailContent: {
      flex: 1,
    },
    detailIcon: {
      marginRight: theme.spacing.md,
      width: theme.spacing.lg,
    },
    detailRow: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: theme.spacing.md,
    },
    detailRowLast: {
      marginBottom: 0,
    },
    downloadsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 2,
      marginBottom: theme.spacing.xl,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    downloadsContent: {
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
    },
    downloadsHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
    },
    downloadsTitle: {
      alignItems: "center",
      flexDirection: "row",
    },
    header: {
      paddingBottom: theme.spacing.xl,
      paddingTop: theme.spacing.sm + insets.top,
      zIndex: theme.zIndex.base,
    },
    headerInner: {
      paddingHorizontal: theme.spacing.xl,
    },
    profileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 4,
      marginBottom: theme.spacing.xl,
      marginTop: theme.spacing.xxl,
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
      top: -60,
      zIndex: theme.zIndex.base,
    },
    scrollContent: {
      padding: theme.spacing.md,
      paddingBottom: globalAudioBarHeight,
    },
    settingsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 2,
      marginBottom: theme.spacing.md,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    storageActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      justifyContent: "space-between",
    },
    storageBar: {
      backgroundColor: theme.colors.outline,
      borderRadius: theme.borderRadius.sm,
      height: 6,
      marginBottom: theme.spacing.md,
      overflow: "hidden",
    },
    storageBarFill: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.borderRadius.sm,
      height: "100%",
    },
    storageButton: {
      flex: 1,
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
      marginRight: theme.spacing.md,
      width: 40,
    },
    storageInfo: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
      flexDirection: "row",
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
    },
    themeOption: {
      alignItems: "center",
      borderRadius: theme.borderRadius.lg,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    themeOptionActive: {
      backgroundColor: theme.colors.tertiary,
    },
    themeOptionText: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
    },
    themeOptionTextActive: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onTertiary",
      }),
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
      padding: theme.spacing.sm,
    },
  });

  // Header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <Text
          style={createThemedTextStyle(theme, {
            size: "6xl",
            weight: "bold",
            color: "secondary",
          })}
        >
          Profile & Settings
        </Text>
        <Text
          style={createThemedTextStyle(theme, {
            size: "lg",
            weight: "normal",
            color: "onSurfaceVariant",
          })}
        >
          Manage your account and preferences
        </Text>
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
            <Text
              style={createThemedTextStyle(theme, {
                size: "base",
                weight: "normal",
                color: "onSurfaceVariant",
              })}
            >
              Email Address
            </Text>
            <Text
              style={createThemedTextStyle(theme, {
                size: "base",
                weight: "normal",
                color: "onSurface",
              })}
            >
              {authState.user?.email || "Not available"}
            </Text>
          </View>
        </View>

        <View style={[styles.detailRow, styles.detailRowLast]}>
          <View style={styles.detailIcon}>
            <Ionicons name="key-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.detailContent}>
            <Text
              style={createThemedTextStyle(theme, {
                size: "base",
                weight: "normal",
                color: "onSurfaceVariant",
              })}
            >
              Book Access Code
            </Text>
            <Text
              style={createThemedTextStyle(theme, {
                size: "base",
                weight: "normal",
                color: "onSurface",
              })}
            >
              {authState.user?.bookCode ?? "Not available"}
            </Text>
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
          <Text
            style={createThemedTextStyle(theme, {
              size: "base",
              weight: "normal",
              color: "onSurface",
            })}
          >
            Appearance
          </Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.themeRow}>
            <Text
              style={createThemedTextStyle(theme, {
                size: "base",
                weight: "normal",
                color: "onSurfaceVariant",
              })}
            >
              Theme
            </Text>
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
            <Ionicons
              name="cloud-download-outline"
              size={20}
              color={theme.colors.primary}
              style={styles.cardIcon}
            />
            <Text style={styles.cardTitle}>Downloads & Storage</Text>
          </View>
          <Text
            style={createThemedTextStyle(theme, {
              size: "base",
              weight: "normal",
              color: "primary",
            })}
          >
            {formatBytes(totalStorageUsed)}
          </Text>
        </View>

        <View style={styles.downloadsContent}>
          <View style={styles.storageInfo}>
            <View style={styles.storageIconContainer}>
              <Ionicons name="folder" size={20} color={theme.colors.onTertiary} />
            </View>
            <View style={styles.storageDetails}>
              <Text
                style={createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurface",
                })}
              >
                {formatBytes(totalStorageUsed)} used
              </Text>
              <Text
                style={createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                })}
              >
                of 500 MB available
              </Text>
            </View>
          </View>

          <View style={styles.storageBar}>
            <View style={[styles.storageBarFill, { width: `${storagePercentage}%` }]} />
          </View>

          <View style={styles.storageActions}>
            <Button
              size="md"
              style={styles.storageButton}
              variant="outline"
              onPress={() =>
                navigation.navigate("MainTabs", {
                  screen: "Downloads",
                })
              }
            >
              Manage Files
            </Button>

            <Button
              size="md"
              style={styles.storageButton}
              variant="destructive"
              onPress={handleClearAllDownloads}
            >
              Clear All
            </Button>
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
        <Button
          leftIcon={{ name: "refresh-outline", color: theme.colors.primary }}
          onPress={resetOnboarding}
          variant="default"
          size="lg"
          style={styles.actionButton}
        >
          Reset Onboarding
        </Button>
        {/* Action Buttons */}
        <Button
          leftIcon={{ name: "log-out-outline", color: theme.colors.primary }}
          onPress={handleSignOut}
          variant="default"
          size="lg"
          style={styles.actionButton}
        >
          Sign Out
        </Button>

        <Button
          leftIcon={{ name: "trash-outline", color: theme.colors.onError }}
          onPress={handleDeleteAccount}
          variant="destructive"
          size="lg"
          style={styles.actionButton}
        >
          Delete Account
        </Button>
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
            onPress: () => void confirmSignOut(),
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
            onPress: () => void confirmClearAllDownloads(),
            style: "destructive",
            loading: isClearingDownloads,
          },
        ]}
      />
    </View>
  );
};

export default ProfileSettingsScreen;
