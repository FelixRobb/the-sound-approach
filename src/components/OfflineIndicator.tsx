import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

const OfflineIndicator = () => {
  const { isConnected } = useContext(NetworkContext);
  const { theme } = useThemedStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const styles = StyleSheet.create({
    button: {
      backgroundColor: theme.colors.onError,
      borderRadius: 12,
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
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("OfflineNotice")}>
        <Text style={styles.buttonText}>Info</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OfflineIndicator;
