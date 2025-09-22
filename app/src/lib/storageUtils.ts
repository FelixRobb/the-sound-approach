// src/utils/storageUtils.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import type { DownloadRecord, User } from "../types";

/**
 * Clear all downloaded files and AsyncStorage data for a user
 */
export const clearUserDownloads = async (userId: string | null) => {
  try {
    const userIdKey = userId || "anonymous";

    // Get all downloaded recordings for this user
    const downloadsListKey = `downloads_list_${userIdKey}`;
    const downloadsList = await AsyncStorage.getItem(downloadsListKey);

    if (downloadsList) {
      const recordingIds = JSON.parse(downloadsList) as string[];

      // Delete all download records and files
      for (const recordingId of recordingIds) {
        const downloadKey = `download_${userIdKey}_${recordingId}`;
        const downloadData = await AsyncStorage.getItem(downloadKey);

        if (downloadData) {
          const downloadRecord = JSON.parse(downloadData) as DownloadRecord;

          // Delete files
          try {
            const audioInfo = await FileSystem.getInfoAsync(downloadRecord.audio_path);
            if (audioInfo.exists) {
              await FileSystem.deleteAsync(downloadRecord.audio_path);
            }
          } catch (e) {
            console.error("Error deleting files:", e);
          }

          // Remove from AsyncStorage
          await AsyncStorage.removeItem(downloadKey);
        }
      }
    }

    // Clear the downloads list
    await AsyncStorage.removeItem(downloadsListKey);

    // Recreate downloads directory
    const downloadsDir = FileSystem.documentDirectory + "downloads/";
    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(downloadsDir);
    }
    await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
  } catch (error) {
    console.error("Clear user downloads error:", error);
  }
};

/**
 * Clear all offline authentication data
 */
export const clearOfflineAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      "offline_auth_token",
      "offline_token_expiry",
      "offline_user_data",
    ]);
  } catch (error) {
    console.error("Error clearing offline auth data:", error);
  }
};

/**
 * Store offline authentication data
 */
export const storeOfflineAuthData = async (accessToken: string, userData: User) => {
  try {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months from now

    await AsyncStorage.setItem("offline_auth_token", accessToken);
    await AsyncStorage.setItem("offline_token_expiry", expiryDate.toISOString());
    await AsyncStorage.setItem("offline_user_data", JSON.stringify(userData));
  } catch (error) {
    console.error("Error storing offline auth data:", error);
  }
};

/**
 * Get offline authentication data
 */
export const getOfflineAuthData = async () => {
  try {
    const offlineToken = await AsyncStorage.getItem("offline_auth_token");
    const tokenExpiry = await AsyncStorage.getItem("offline_token_expiry");
    const userData = await AsyncStorage.getItem("offline_user_data");

    if (offlineToken && tokenExpiry && userData) {
      const expiryDate = new Date(tokenExpiry);
      const now = new Date();

      if (now < expiryDate) {
        // Token is still valid
        return {
          token: offlineToken,
          user: JSON.parse(userData) as User,
          isValid: true,
        };
      }
    }

    return { token: null, user: null, isValid: false };
  } catch (error) {
    console.error("Error getting offline auth data:", error);
    return { token: null, user: null, isValid: false };
  }
};

export const clearSearchHistory = async () => {
  try {
    await AsyncStorage.removeItem("recentSearches");
  } catch (error) {
    console.error("Error clearing search history:", error);
  }
};
