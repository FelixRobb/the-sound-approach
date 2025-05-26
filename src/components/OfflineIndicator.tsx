import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";

import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

const OfflineIndicator = () => {
  const { isConnected } = useContext(NetworkContext);
  const { theme } = useThemedStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const screenWidth = Dimensions.get("window").width;

  const styles = StyleSheet.create({
    button: {
      backgroundColor: theme.colors.onError,
      borderRadius: 12,
      marginBottom: 12,
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    buttonText: {
      color: theme.colors.error,
      fontSize: 12,
      fontWeight: "600",
    },
    container: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.error,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      elevation: 8,
      flexDirection: "row",
      height: 60,
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      shadowRadius: 4,
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

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={18} color={theme.colors.onError} />
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
