import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthContext } from "../context/AuthContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

const DeleteAccountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { deleteAccount } = useContext(AuthContext);
  const { isConnected } = useContext(NetworkContext);
  const { theme } = useThemedStyles();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!isConnected) {
      Alert.alert(
        "Cannot Delete Account While Offline",
        "You need to be online to delete your account.",
        [{ text: "OK" }]
      );
      return;
    }

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
      borderRadius: 12,
      marginTop: 12,
      padding: 16,
    },
    cancelButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    confirmText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 4,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    deleteButton: {
      alignItems: "center",
      backgroundColor: theme.colors.error,
      borderRadius: 12,
      marginTop: 20,
      padding: 16,
    },
    deleteButtonDisabled: {
      opacity: 0.5,
    },
    deleteButtonText: {
      color: theme.colors.onError,
      fontSize: 16,
      fontWeight: "600",
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
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      borderWidth: 1,
      color: theme.colors.onSurface,
      fontSize: 16,
      padding: 12,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 8,
    },
    scrollContent: {
      padding: 20,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      marginTop: 2,
    },
    title: {
      color: theme.colors.error,
      fontSize: 28,
      fontWeight: "bold",
    },
    warningCard: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 16,
      marginBottom: 24,
      padding: 20,
    },
    warningText: {
      color: theme.colors.onErrorContainer,
      fontSize: 14,
      lineHeight: 20,
    },
    warningTitle: {
      color: theme.colors.onErrorContainer,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 8,
    },
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
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
            {"\n\n"}This action cannot be undone. Please make sure you have backed up any important
            data before proceeding.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter your password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Type &quot;DELETE MY ACCOUNT&quot; to confirm</Text>
          <TextInput
            style={styles.input}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="Type DELETE MY ACCOUNT"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={styles.confirmText}>This helps prevent accidental deletions</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            (!isConnected || isLoading || confirmText !== "DELETE MY ACCOUNT" || !password) &&
              styles.deleteButtonDisabled,
          ]}
          onPress={handleDeleteAccount}
          disabled={!isConnected || isLoading || confirmText !== "DELETE MY ACCOUNT" || !password}
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
