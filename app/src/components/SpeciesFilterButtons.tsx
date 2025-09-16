import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

import type { Theme } from "../lib/theme/types";
import { createThemedTextStyle } from "../lib/theme/typography";

interface SpeciesFilterButtonsProps {
  theme: Theme;
  sortBy: "speciescommon" | "speciesscientific";
  setSortBy: (value: "speciescommon" | "speciesscientific") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
}

const SpeciesFilterButtons: React.FC<SpeciesFilterButtonsProps> = ({
  theme,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) => {
  const styles = StyleSheet.create({
    filterButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 1,
      flexDirection: "row",
      marginRight: theme.spacing.sm,
      marginVertical: theme.spacing.xs,
      minHeight: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowOpacity: 0.15,
    },
    filterButtonIcon: {
      marginRight: theme.spacing.xs,
    },
    filterButtonsContainer: {
      marginHorizontal: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    filterDivider: {
      alignSelf: "center",
      backgroundColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.xs,
      height: 24,
      marginHorizontal: theme.spacing.sm,
      opacity: 0.4,
      width: theme.spacing.sm,
    },
    filterRow: {
      alignItems: "center",
      flexDirection: "row",
      paddingHorizontal: theme.spacing.sm,
    },
    filterSectionTitle: {
      alignSelf: "center",
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginLeft: 0,
      marginRight: theme.spacing.sm,
      textTransform: "uppercase",
    },
    scrollViewFilters: {
      alignItems: "center",
      paddingRight: theme.spacing.sm,
    },
  });

  const getSortOrderDisplayText = () => {
    return sortOrder === "asc" ? "A→Z" : "Z→A";
  };

  return (
    <View style={styles.filterButtonsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewFilters}
      >
        <View style={styles.filterRow}>
          <Text style={styles.filterSectionTitle}>Sort By</Text>

          {/* Common Name Sort Button */}
          <TouchableOpacity
            style={[styles.filterButton, sortBy === "speciescommon" && styles.filterButtonActive]}
            onPress={() => setSortBy("speciescommon")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                }),
                sortBy === "speciescommon" &&
                  createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  }),
              ]}
            >
              Common Name
            </Text>
          </TouchableOpacity>

          {/* Scientific Name Sort Button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === "speciesscientific" && styles.filterButtonActive,
            ]}
            onPress={() => setSortBy("speciesscientific")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                }),
                sortBy === "speciesscientific" &&
                  createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  }),
              ]}
            >
              Scientific Name
            </Text>
          </TouchableOpacity>

          {/* Divider between groups */}
          <View style={styles.filterDivider} />
          <Text style={styles.filterSectionTitle}>Order</Text>

          {/* Sort Order Button */}
          <TouchableOpacity
            style={[styles.filterButton, sortOrder === "desc" && styles.filterButtonActive]}
            onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={sortOrder === "asc" ? "arrow-down-outline" : "arrow-up-outline"}
              size={14}
              color={sortOrder === "desc" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              style={styles.filterButtonIcon}
            />
            <Text
              style={[
                createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                }),
                sortOrder === "desc" &&
                  createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  }),
              ]}
            >
              {getSortOrderDisplayText()}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SpeciesFilterButtons;
