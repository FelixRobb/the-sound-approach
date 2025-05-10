import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";

import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

const OfflineIndicator = () => {
  const { isConnected } = useContext(NetworkContext);
  const { theme } = useThemedStyles();

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: theme.colors.error,
      borderBottomColor: theme.colors.onError,
      borderBottomWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: 8,
      width: "100%",
    },
    text: {
      color: theme.colors.onError,
      fontSize: 15,
      fontWeight: "600",
      marginLeft: 8,
    },
  });

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline" size={18} color={theme.colors.onError} />
      <Text style={styles.text}>You&apos;re offline - Limited functionality available</Text>
    </View>
  );
};

export default OfflineIndicator;
