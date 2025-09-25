import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Dimensions } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme";

const OfflineIndicator = () => {
  const { theme } = useEnhancedTheme();
  const screenWidth = Dimensions.get("window").width;

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.error,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      elevation: 8,
      flexDirection: "row",
      height: 60,
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingLeft: 24,
      paddingVertical: 10,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      width: screenWidth,
    },
    content: {
      alignItems: "center",
      flexDirection: "row",
      flex: 1,
      marginBottom: theme.spacing.sm,
    },
    text: {
      flexShrink: 1,
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "error",
      }),
      marginLeft: theme.spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={18} color={theme.colors.error} />
        <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
          You&apos;re offline - Limited functionality available
        </Text>
      </View>
    </View>
  );
};

export default OfflineIndicator;
