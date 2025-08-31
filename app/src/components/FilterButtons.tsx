import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

import type { Theme } from "../lib/theme/types";
import { createThemedTextStyle } from "../lib/theme/typography";

interface FilterButtonsProps {
  theme: Theme;
  sortBy: "title" | "species" | "page";
  setSortBy: (value: "title" | "species" | "page") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
  downloadedFilter: "all" | "downloaded" | "not_downloaded";
  setDownloadedFilter: (value: "all" | "downloaded" | "not_downloaded") => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({
  theme,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  downloadedFilter,
  setDownloadedFilter,
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
    if (sortOrder === "asc") {
      return sortBy === "page" ? "1→100" : "A→Z";
    } else {
      return sortBy === "page" ? "100→1" : "Z→A";
    }
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

          {/* Page Sort Button */}
          <TouchableOpacity
            style={[styles.filterButton, sortBy === "page" && styles.filterButtonActive]}
            onPress={() => setSortBy("page")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="book-outline"
              size={14}
              color={sortBy === "page" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              style={styles.filterButtonIcon}
            />
            <Text
              style={[
                createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                }),
                sortBy === "page" &&
                  createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  }),
              ]}
            >
              Page
            </Text>
          </TouchableOpacity>

          {/* Title Sort Button */}
          <TouchableOpacity
            style={[styles.filterButton, sortBy === "title" && styles.filterButtonActive]}
            onPress={() => setSortBy("title")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="text-outline"
              size={14}
              color={sortBy === "title" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              style={styles.filterButtonIcon}
            />
            <Text
              style={[
                createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                }),
                sortBy === "title" &&
                  createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  }),
              ]}
            >
              Title
            </Text>
          </TouchableOpacity>
          {/* Species Sort Button */}
          <TouchableOpacity
            style={[styles.filterButton, sortBy === "species" && styles.filterButtonActive]}
            onPress={() => setSortBy("species")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="leaf-outline"
              size={14}
              color={sortBy === "species" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              style={styles.filterButtonIcon}
            />
            <Text
              style={[
                createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                }),
                sortBy === "species" &&
                  createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  }),
              ]}
            >
              Species
            </Text>
          </TouchableOpacity>

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

          {/* Divider between groups */}
          <View style={styles.filterDivider} />
          <Text style={styles.filterSectionTitle}>Filter By</Text>

          {/* All Filter Button */}
          <TouchableOpacity
            style={[styles.filterButton, downloadedFilter === "all" && styles.filterButtonActive]}
            onPress={() => setDownloadedFilter("all")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="albums-outline"
              size={14}
              color={
                downloadedFilter === "all" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
              }
              style={styles.filterButtonIcon}
            />
            <Text
              style={[
                createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                }),
                downloadedFilter === "all" &&
                  createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  }),
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Downloaded Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              downloadedFilter === "downloaded" && styles.filterButtonActive,
            ]}
            onPress={() => setDownloadedFilter("downloaded")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cloud-done-outline"
              size={14}
              color={
                downloadedFilter === "downloaded"
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant
              }
              style={styles.filterButtonIcon}
            />
            <Text
              style={[
                createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                }),
                downloadedFilter === "downloaded" &&
                  createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  }),
              ]}
            >
              Downloaded
            </Text>
          </TouchableOpacity>

          {/* Not Downloaded Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              downloadedFilter === "not_downloaded" && styles.filterButtonActive,
            ]}
            onPress={() => setDownloadedFilter("not_downloaded")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cloud-outline"
              size={14}
              color={
                downloadedFilter === "not_downloaded"
                  ? theme.colors.onSecondary
                  : theme.colors.onSurfaceVariant
              }
              style={styles.filterButtonIcon}
            />
            <Text
              style={[
                createThemedTextStyle(theme, {
                  size: "base",
                  weight: "normal",
                  color: "onSurfaceVariant",
                }),
                downloadedFilter === "not_downloaded" &&
                  createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  }),
              ]}
            >
              Online Only
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default FilterButtons;
