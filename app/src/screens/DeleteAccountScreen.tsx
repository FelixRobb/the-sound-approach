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
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Input } from "../components/ui";
import { AuthContext } from "../context/AuthContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import type { RootStackParamList } from "../types";
import { createThemedTextStyle } from "../lib/theme/typography";

const DeleteAccountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { deleteAccount } = useContext(AuthContext);
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();
  const confirmTextInputRef = useRef<TextInput>(null);

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
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginTop: 12,
      padding: 16,
    },
    cancelButtonText: {
      color: theme.colors.primary,
      fontSize: theme.typography.labelMedium.fontSize,
      fontWeight: theme.typography.labelMedium.fontWeight,
    },
    confirmText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: theme.typography.labelMedium.fontSize,
      marginTop: 4,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    deleteButton: {
      alignItems: "center",
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.md,
      marginTop: 20,
      padding: 16,
    },
    deleteButtonDisabled: {
      opacity: 0.5,
    },
    deleteButtonText: {
      color: theme.colors.onError,
      fontSize: theme.typography.labelMedium.fontSize,
      fontWeight: theme.typography.labelMedium.fontWeight,
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: theme.borderRadius.lg,
      borderBottomRightRadius: theme.borderRadius.lg,
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
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      color: theme.colors.onSurface,
      fontSize: theme.typography.labelMedium.fontSize,
      fontWeight: theme.typography.labelMedium.fontWeight,
      marginBottom: 8,
    },
    scrollContent: {
      padding: 20,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: theme.typography.labelMedium.fontSize,
      marginTop: 2,
    },
    title: {
      ...createThemedTextStyle(theme, { size: "lg", weight: "bold", color: "error" }),
    },
    warningCard: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.borderRadius.lg,
      marginBottom: 24,
      padding: 20,
    },
    warningText: {
      color: theme.colors.onErrorContainer,
      fontSize: theme.typography.bodyMedium.fontSize,
      lineHeight: 20,
    },
    warningTitle: {
      color: theme.colors.onErrorContainer,
      fontSize: theme.typography.titleLarge.fontSize,
      fontWeight: theme.typography.titleLarge.fontWeight,
      marginBottom: 8,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.subtitle}>This action cannot be undone</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Warning</Text>
          <Text style={styles.warningText}>
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
            onChangeText={setConfirmText}
            placeholder="Type DELETE MY ACCOUNT"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
          />
          <Text style={styles.confirmText}>This helps prevent accidental deletions</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            (isLoading || confirmText !== "DELETE MY ACCOUNT" || !password) &&
              styles.deleteButtonDisabled,
          ]}
          onPress={handleDeleteAccount}
          disabled={isLoading || confirmText !== "DELETE MY ACCOUNT" || !password}
        >
          <Text style={styles.deleteButtonText}>
            {isLoading ? "Deleting Account..." : "Delete My Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DeleteAccountScreen;
