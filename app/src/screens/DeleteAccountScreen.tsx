import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext, useState, useRef } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGlobalAudioBarHeight } from "../components/GlobalAudioBar";
import { Button, Input } from "../components/ui";
import { AuthContext } from "../context/AuthContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme/typography";
import type { RootStackParamList } from "../types";

const DeleteAccountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { deleteAccount } = useContext(AuthContext);
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();
  const confirmTextInputRef = useRef<TextInput>(null);
  const globalAudioBarHeight = useGlobalAudioBarHeight();

  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      Alert.alert("Error", "Please type 'DELETE MY ACCOUNT' to confirm.");
      return;
    }

    if (!password) {
      Alert.alert("Error", "Please enter your password to confirm deletion.");
      return;
    }

    setIsLoading(true);
    try {
      await deleteAccount(password);
    } catch (error) {
      console.error("Delete account error:", error);
      if (error instanceof Error && error.message.includes("Invalid password")) {
        Alert.alert("Error", "Invalid password. Please try again.");
      } else {
        Alert.alert("Error", "Failed to delete account. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    cancelButton: {
      marginBottom: theme.spacing.md,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    deleteButton: {
      marginVertical: theme.spacing.md,
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: theme.borderRadius.lg,
      borderBottomRightRadius: theme.borderRadius.lg,
      elevation: 4,
      paddingBottom: theme.spacing.xl,
      paddingTop: theme.spacing.sm + insets.top,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      zIndex: theme.zIndex.base,
    },
    headerInner: {
      paddingHorizontal: theme.spacing.xl,
    },
    inputContainer: {
      marginBottom: theme.spacing.md,
    },
    inputLabel: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.sm,
    },
    scrollContent: {
      paddingBottom: globalAudioBarHeight,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
    },
    warningCard: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.xl,
      padding: theme.spacing.xl,
    },
    warningTitle: {
      ...createThemedTextStyle(theme, {
        size: "6xl",
        weight: "bold",
        color: "onErrorContainer",
      }),
      marginBottom: theme.spacing.sm,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text
            style={createThemedTextStyle(theme, {
              size: "6xl",
              weight: "bold",
              color: "error",
            })}
          >
            Delete Account
          </Text>
          <Text
            style={createThemedTextStyle(theme, {
              size: "base",
              weight: "normal",
              color: "onSurfaceVariant",
            })}
          >
            This action cannot be undone
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Warning</Text>
          <Text
            style={createThemedTextStyle(theme, {
              size: "base",
              weight: "normal",
              color: "onErrorContainer",
            })}
          >
            Deleting your account will permanently remove all your data, including:
            {"\n\n"}• All downloaded recordings
            {"\n"}• Your account information
            {"\n"}• Your book code activation
            {"\n"}• All preferences and settings
            {"\n\n"}This action cannot be undone.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter your password</Text>
          <Input
            type="password"
            showPasswordToggle
            leftIcon={{ name: "lock-closed-outline" }}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => confirmTextInputRef.current?.focus()}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Type &quot;DELETE MY ACCOUNT&quot; to confirm</Text>
          <Input
            ref={confirmTextInputRef}
            leftIcon={{ name: "trash-outline" }}
            value={confirmText}
            onChangeText={(text) => setConfirmText(text.toUpperCase())}
            placeholder="Type DELETE MY ACCOUNT"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
          />
          <Text
            style={createThemedTextStyle(theme, {
              size: "base",
              weight: "normal",
              color: "onSurfaceVariant",
            })}
          >
            This helps prevent accidental deletions
          </Text>
        </View>

        <Button
          variant="destructive"
          fullWidth
          size="lg"
          onPress={() => void handleDeleteAccount()}
          disabled={isLoading || confirmText !== "DELETE MY ACCOUNT" || !password}
          style={styles.deleteButton}
        >
          {isLoading ? "Deleting Account..." : "Delete My Account"}
        </Button>

        <Button
          variant="outline"
          fullWidth
          size="lg"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DeleteAccountScreen;
