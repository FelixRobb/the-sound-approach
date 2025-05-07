import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: ReactNode;
}

const DetailHeader = ({ title, subtitle, rightElement }: DetailHeaderProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemedStyles();

  const styles = StyleSheet.create({
    backButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      marginRight: 12,
      width: 40,
    },
    header: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 4,
      flexDirection: "row",
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 50,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      zIndex: 1,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      fontStyle: "italic",
      marginTop: 2,
    },
    title: {
      color: theme.colors.primary,
      fontSize: 22,
      fontWeight: "bold",
    },
    titleContainer: {
      flex: 1,
    },
  });

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
    </View>
  );
};

export default DetailHeader;
