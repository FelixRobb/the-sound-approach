import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import type { OfflineStackParamList } from "../types";

const OfflineIndicator = () => {
  const { theme } = useEnhancedTheme();
  const navigation = useNavigation<NativeStackNavigationProp<OfflineStackParamList>>();
  const screenWidth = Dimensions.get("window").width;

  const styles = StyleSheet.create({
    button: {
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.md,
      marginBottom: 12,
      marginLeft: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    buttonText: {
      color: theme.colors.onError,
      fontSize: 12,
      fontWeight: "600",
    },
    // eslint-disable-next-line react-native/no-color-literals
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
      shadowColor: "000",
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
      marginBottom: 12,
    },
    text: {
      color: theme.colors.error,
      flexShrink: 1,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 8,
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
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("OfflineNotice")}>
        <Text style={styles.buttonText}>Info</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OfflineIndicator;
