import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme/typography";
import { RootStackParamList, SpeciesCardProps } from "../types";

export default function SpeciesCard({ species, sortBy, onPress }: SpeciesCardProps) {
  const { theme } = useEnhancedTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("SpeciesDetails", { speciesId: species.id });
    }
  };

  const styles = StyleSheet.create({
    speciesAction: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: theme.spacing.sm,
    },
    speciesActionButton: {
      alignItems: "center",
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    speciesCard: {
      alignItems: "center",
      backgroundColor: theme.colors.transparent,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
      flexDirection: "row",
      marginHorizontal: theme.spacing.xs,
      marginVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    speciesContent: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 48,
    },
    speciesInfo: {
      flex: 1,
      marginRight: theme.spacing.sm,
      minWidth: 0,
    },
    speciesName: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "bold",
        color: "onSurface",
      }),
      lineHeight: 22,
      marginBottom: theme.spacing.xxs,
    },
    speciesPosterContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      elevation: 3,
      flexShrink: 0,
      height: 54,
      justifyContent: "center",
      marginRight: theme.spacing.md,
      position: "relative",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      width: 54,
    },
    speciesPosterOverlay: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.borderRadius.lg - 1,
      bottom: 1,
      justifyContent: "center",
      left: 1,
      position: "absolute",
      right: 1,
      top: 1,
    },
    speciesScientificName: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      lineHeight: 18,
      marginTop: theme.spacing.xxs,
    },
  });

  return (
    <TouchableOpacity
      style={styles.speciesCard}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${species.common_name} (${species.scientific_name})`}
      accessibilityHint="Tap to view species details and recordings"
    >
      <View style={styles.speciesContent}>
        <View style={styles.speciesPosterContainer}>
          <View style={styles.speciesPosterOverlay}>
            <MaterialCommunityIcons name="bird" size={24} color={theme.colors.onPrimaryContainer} />
          </View>
        </View>
        <View style={styles.speciesInfo}>
          <Text style={styles.speciesName} numberOfLines={1} ellipsizeMode="tail">
            {sortBy === "speciesscientific" ? species.scientific_name : species.common_name}
          </Text>
          <Text style={styles.speciesScientificName} numberOfLines={1} ellipsizeMode="tail">
            {sortBy === "speciesscientific" ? species.common_name : species.scientific_name}
          </Text>
        </View>

        <View style={styles.speciesAction}>
          <View style={styles.speciesActionButton}>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
