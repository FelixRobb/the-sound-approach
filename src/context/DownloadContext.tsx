"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import type React from "react";
import { createContext, useState, useEffect, useContext, useCallback } from "react";

import { ENV } from "../config/env";
import { supabase } from "../lib/supabase";
import type { Recording, DownloadRecord, DownloadContextType, DownloadInfo } from "../types";

import { AuthContext } from "./AuthContext";

// Create context
export const DownloadContext = createContext<DownloadContextType>({
  downloads: {},
  downloadedRecordings: [],
  totalStorageUsed: 0,
  downloadRecording: async () => {},
  deleteDownload: async () => {},
  clearAllDownloads: async () => {},
  isDownloaded: () => false,
  getDownloadPath: () => null,
  getDownloadedRecordings: async () => [],
});

// Provider component
export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: authState } = useContext(AuthContext);
  const [downloads, setDownloads] = useState<Record<string, DownloadInfo>>({});
  const [downloadedRecordings, setDownloadedRecordings] = useState<string[]>([]);
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);

  // Load downloaded recordings from AsyncStorage
  const loadDownloadedRecordings = useCallback(async () => {
    try {
      // Get the downloads list key
      const downloadsListKey = `downloads_list_${authState.user?.id || "anonymous"}`;
      const downloadsList = await AsyncStorage.getItem(downloadsListKey);

      if (downloadsList) {
        const ids = JSON.parse(downloadsList) as string[];
        setDownloadedRecordings(ids);
      } else {
        setDownloadedRecordings([]);
      }
    } catch (error) {
      console.error("Error loading downloaded recordings:", error);
      setDownloadedRecordings([]);
    }
  }, [authState.user?.id]);

  // Initialize downloads from storage
  useEffect(() => {
    if (authState.userToken) {
      loadDownloadedRecordings();
      calculateStorageUsed();
    }
  }, [authState.userToken, loadDownloadedRecordings]);

  // Calculate total storage used
  const calculateStorageUsed = async () => {
    try {
      const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory + "downloads/");
      if (info.exists && info.isDirectory) {
        setTotalStorageUsed(info.size || 0);
      }
    } catch (error) {
      console.error("Error calculating storage:", error);
    }
  };

  // Get all downloaded recordings with metadata
  const getDownloadedRecordings = async (): Promise<DownloadRecord[]> => {
    try {
      const userId = authState.user?.id || "anonymous";
      const result: DownloadRecord[] = [];

      // Iterate through downloaded recording IDs
      for (const recordingId of downloadedRecordings) {
        const downloadKey = `download_${userId}_${recordingId}`;
        const downloadData = await AsyncStorage.getItem(downloadKey);

        if (downloadData) {
          result.push(JSON.parse(downloadData) as DownloadRecord);
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting downloaded recordings:", error);
      return [];
    }
  };

  // Download a recording
  const downloadRecording = async (recording: Recording) => {
    if (isDownloaded(recording.id)) return;

    // Create downloads directory if it doesn't exist
    const downloadsDir = FileSystem.documentDirectory + "downloads/";
    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
    }

    // Update download status
    setDownloads((prev) => ({
      ...prev,
      [recording.id]: {
        recordingId: recording.id,
        status: "downloading",
        progress: 0,
      },
    }));

    try {
      // Download low-quality audio file (MP3) only
      const audioPath = `${downloadsDir}audio_${recording.audiolqid}.mp3`;
      const { data: audioUrlData } = supabase.storage
        .from(ENV.AUDIO_LQ_BUCKET) // Use environment variable for bucket name
        .getPublicUrl(`${recording.audiolqid}.mp3`);

      if (!audioUrlData?.publicUrl) throw new Error("Failed to get audio URL");

      // Actually download the audio file
      await FileSystem.downloadAsync(audioUrlData.publicUrl, audioPath);

      // Download a frame from the sonogram video as thumbnail for offline viewing
      const sonogramPath = `${downloadsDir}sonogram_${recording.sonogramvideoid}.png`;
      const { data: sonogramUrlData } = supabase.storage
        .from(ENV.SONOGRAM_THUMBNAILS_BUCKET) // Use environment variable for bucket name
        .getPublicUrl(`${recording.sonogramvideoid}.png`);

      if (!sonogramUrlData?.publicUrl) throw new Error("Failed to get sonogram thumbnail URL");

      // Actually download the sonogram thumbnail
      await FileSystem.downloadAsync(sonogramUrlData.publicUrl, sonogramPath);

      // Get species info if available
      let speciesName = "";
      let scientificName = "";

      if (recording.species_id) {
        try {
          const { data: speciesData } = await supabase
            .from("species")
            .select("common_name, scientific_name")
            .eq("id", recording.species_id)
            .single();

          if (speciesData) {
            speciesName = speciesData.common_name;
            scientificName = speciesData.scientific_name;
          }
        } catch (error) {
          console.error("Error fetching species data:", error);
        }
      }

      // Save download info to AsyncStorage
      const userId = authState.user?.id || "anonymous";
      const downloadRecord: DownloadRecord = {
        recording_id: recording.id,
        audio_path: audioPath,
        sonogram_path: sonogramPath,
        downloaded_at: Date.now(),
        title: recording.title,
        species_name: speciesName,
        scientific_name: scientificName,
        book_page_number: recording.book_page_number,
        caption: recording.caption,
      };

      // Store the download record
      const downloadKey = `download_${userId}_${recording.id}`;
      await AsyncStorage.setItem(downloadKey, JSON.stringify(downloadRecord));

      // Update the downloads list
      const newDownloadedRecordings = [...downloadedRecordings, recording.id];
      setDownloadedRecordings(newDownloadedRecordings);

      // Store the updated downloads list
      const downloadsListKey = `downloads_list_${userId}`;
      await AsyncStorage.setItem(downloadsListKey, JSON.stringify(newDownloadedRecordings));

      // Update download status
      setDownloads((prev) => ({
        ...prev,
        [recording.id]: {
          recordingId: recording.id,
          status: "completed",
          progress: 1,
        },
      }));

      // Update storage usage
      calculateStorageUsed();
    } catch (error) {
      console.error("Download error:", error);
      setDownloads((prev) => ({
        ...prev,
        [recording.id]: {
          recordingId: recording.id,
          status: "error",
          progress: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
  };

  // Delete a downloaded recording
  const deleteDownload = async (recordingId: string) => {
    try {
      const userId = authState.user?.id || "anonymous";
      const downloadKey = `download_${userId}_${recordingId}`;

      // Get the download record
      const downloadData = await AsyncStorage.getItem(downloadKey);

      if (downloadData) {
        const downloadRecord = JSON.parse(downloadData) as DownloadRecord;

        // Delete files
        const audioInfo = await FileSystem.getInfoAsync(downloadRecord.audio_path);
        if (audioInfo.exists) {
          await FileSystem.deleteAsync(downloadRecord.audio_path);
        }

        const sonogramInfo = await FileSystem.getInfoAsync(downloadRecord.sonogram_path);
        if (sonogramInfo.exists) {
          await FileSystem.deleteAsync(downloadRecord.sonogram_path);
        }

        // Remove from AsyncStorage
        await AsyncStorage.removeItem(downloadKey);

        // Update the downloads list
        const newDownloadedRecordings = downloadedRecordings.filter((id) => id !== recordingId);
        setDownloadedRecordings(newDownloadedRecordings);

        // Store the updated downloads list
        const downloadsListKey = `downloads_list_${userId}`;
        await AsyncStorage.setItem(downloadsListKey, JSON.stringify(newDownloadedRecordings));

        // Update downloads state
        setDownloads((prev) => {
          const newDownloads = { ...prev };
          delete newDownloads[recordingId];
          return newDownloads;
        });

        // Update storage usage
        calculateStorageUsed();
      }
    } catch (error) {
      console.error("Delete download error:", error);
    }
  };

  // Clear all downloads
  const clearAllDownloads = async () => {
    try {
      const userId = authState.user?.id || "anonymous";

      // Delete all download records
      for (const recordingId of downloadedRecordings) {
        const downloadKey = `download_${userId}_${recordingId}`;
        const downloadData = await AsyncStorage.getItem(downloadKey);

        if (downloadData) {
          const downloadRecord = JSON.parse(downloadData) as DownloadRecord;

          // Delete files
          try {
            const audioInfo = await FileSystem.getInfoAsync(downloadRecord.audio_path);
            if (audioInfo.exists) {
              await FileSystem.deleteAsync(downloadRecord.audio_path);
            }

            const sonogramInfo = await FileSystem.getInfoAsync(downloadRecord.sonogram_path);
            if (sonogramInfo.exists) {
              await FileSystem.deleteAsync(downloadRecord.sonogram_path);
            }
          } catch (e) {
            console.error("Error deleting files:", e);
          }

          // Remove from AsyncStorage
          await AsyncStorage.removeItem(downloadKey);
        }
      }

      // Clear the downloads list
      const downloadsListKey = `downloads_list_${userId}`;
      await AsyncStorage.removeItem(downloadsListKey);

      // Update state
      setDownloadedRecordings([]);
      setDownloads({});

      // Recreate downloads directory
      const downloadsDir = FileSystem.documentDirectory + "downloads/";
      const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(downloadsDir);
      }
      await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });

      // Update storage usage
      setTotalStorageUsed(0);
    } catch (error) {
      console.error("Clear downloads error:", error);
    }
  };

  // Check if a recording is downloaded
  const isDownloaded = (recordingId: string) => {
    return downloadedRecordings.includes(recordingId);
  };

  // Get the file path for a downloaded file
  const getDownloadPath = (fileId: string, isAudio: boolean) => {
    if (!fileId) return null;

    const downloadsDir = FileSystem.documentDirectory + "downloads/";
    return isAudio ? `${downloadsDir}audio_${fileId}.mp3` : `${downloadsDir}sonogram_${fileId}.png`;
  };

  return (
    <DownloadContext.Provider
      value={{
        downloads,
        downloadedRecordings,
        totalStorageUsed,
        downloadRecording,
        deleteDownload,
        clearAllDownloads,
        isDownloaded,
        getDownloadPath,
        getDownloadedRecordings,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
};
