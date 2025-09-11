// src/context/DownloadContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import type React from "react";
import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";

import { clearUserDownloads } from "../lib/storageUtils";
import { supabase } from "../lib/supabase";
import type {
  Recording,
  DownloadRecord,
  DownloadContextType,
  DownloadInfo,
  DownloadStatus,
} from "../types";

import { AuthContext } from "./AuthContext";

// Create context
export const DownloadContext = createContext<DownloadContextType>({
  downloads: {},
  downloadedRecordings: [],
  totalStorageUsed: 0,
  downloadRecording: async () => {},
  pauseDownload: async () => {},
  resumeDownload: async () => {},
  deleteDownload: async () => {},
  clearAllDownloads: async () => {},
  isDownloaded: () => false,
  getDownloadPath: () => null,
  getDownloadedRecordings: () => Promise.resolve([]),
});

// Provider component
export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: authState } = useContext(AuthContext);
  const [downloads, setDownloads] = useState<Record<string, DownloadInfo>>({});
  const [downloadedRecordings, setDownloadedRecordings] = useState<string[]>([]);
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);

  // Track active download operations for pausing
  const activeDownloads = useRef<Record<string, FileSystem.DownloadResumable>>({});

  // Track ongoing operations to prevent race conditions
  const ongoingOperations = useRef<Set<string>>(new Set());

  // Validation functions for state transitions
  const canStartDownload = (recordingId: string): boolean => {
    const downloadInfo = downloads[recordingId];
    const isAlreadyDownloaded = downloadedRecordings.includes(recordingId);

    // Can start if not in downloads list, or if status is error/idle
    return (
      !isAlreadyDownloaded ||
      !downloadInfo ||
      downloadInfo.status === "error" ||
      downloadInfo.status === "idle"
    );
  };

  const canPauseDownload = (recordingId: string): boolean => {
    const downloadInfo = downloads[recordingId];
    return downloadInfo?.status === "downloading" && activeDownloads.current[recordingId] !== null;
  };

  const canResumeDownload = (recordingId: string): boolean => {
    const downloadInfo = downloads[recordingId];
    return downloadInfo?.status === "paused";
  };

  const canDeleteDownload = (recordingId: string): boolean => {
    const downloadInfo = downloads[recordingId];
    return downloadInfo?.status === "completed";
  };

  // Helper function to check if an operation is already in progress
  const isOperationInProgress = (recordingId: string): boolean => {
    return ongoingOperations.current.has(recordingId);
  };

  // Helper function to start an operation (with locking)
  const startOperation = (recordingId: string, operationType: string): void => {
    if (isOperationInProgress(recordingId)) {
      throw new Error(
        `Another operation (${operationType}) is already in progress for this recording`
      );
    }
    ongoingOperations.current.add(recordingId);
  };

  // Helper function to end an operation (release lock)
  const endOperation = (recordingId: string): void => {
    ongoingOperations.current.delete(recordingId);
  };

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
      void loadDownloadedRecordings();
      void calculateStorageUsed();
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

  // Helper function to update download record progress
  const updateDownloadRecordProgress = async (
    recordingId: string,
    progress: number,
    userId: string
  ) => {
    try {
      const downloadKey = `download_${userId}_${recordingId}`;
      const existingData = await AsyncStorage.getItem(downloadKey);

      if (existingData) {
        const downloadRecord = JSON.parse(existingData) as DownloadRecord;
        downloadRecord.download_progress = progress;
        await AsyncStorage.setItem(downloadKey, JSON.stringify(downloadRecord));
      }
    } catch (error) {
      console.error("Error updating download record progress:", error);
    }
  };

  // Helper function to update download record status
  const updateDownloadRecordStatus = async (
    recordingId: string,
    status: DownloadStatus,
    userId: string,
    error?: string
  ) => {
    try {
      const downloadKey = `download_${userId}_${recordingId}`;
      const existingData = await AsyncStorage.getItem(downloadKey);

      if (existingData) {
        const downloadRecord = JSON.parse(existingData) as DownloadRecord;
        downloadRecord.download_status = status;
        if (error) {
          downloadRecord.download_error = error;
        }
        await AsyncStorage.setItem(downloadKey, JSON.stringify(downloadRecord));
      }
    } catch (error) {
      console.error("Error updating download record status:", error);
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

  // Download a recording with progress tracking
  const downloadRecording = async (recording: Recording) => {
    // Check for concurrent operations
    if (isOperationInProgress(recording.id)) {
      throw new Error("Another operation is already in progress for this recording");
    }

    // Validate if download can be started
    if (!canStartDownload(recording.id)) {
      const currentStatus = downloads[recording.id]?.status;
      throw new Error(
        `Cannot start download: Recording is currently ${currentStatus || "in unknown state"}. ` +
          `Only recordings with error status or new recordings can be downloaded.`
      );
    }

    // Start operation lock
    startOperation(recording.id, "download");

    // Create downloads directory if it doesn't exist
    const downloadsDir = FileSystem.documentDirectory + "downloads/";
    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
    }

    const audioPath = `${downloadsDir}audio_${recording.audiolqid}.mp3`;
    const userId = authState.user?.id || "anonymous";

    // Create initial download record
    const downloadRecord: DownloadRecord = {
      recording_id: recording.id,
      audio_path: audioPath,
      downloaded_at: 0, // Will be updated when completed
      download_status: "downloading",
      download_progress: 0,
      started_at: Date.now(),
      ...recording,
    };

    try {
      // Get signed URL for download
      const { data: audioUrlData } = await supabase.storage
        .from(process.env.AUDIO_LQ_BUCKET || "")
        .createSignedUrl(`${recording.audiolqid}.mp3`, 60 * 60 * 24 * 30);

      if (!audioUrlData?.signedUrl) throw new Error("Failed to get audio URL");

      // Create resumable download
      const downloadResumable = FileSystem.createDownloadResumable(
        audioUrlData.signedUrl,
        audioPath,
        {},
        (progress) => {
          const progressValue = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          // Update in-memory download state
          setDownloads((prev) => ({
            ...prev,
            [recording.id]: {
              ...prev[recording.id],
              progress: progressValue,
            },
          }));

          // Update stored download record with progress
          void updateDownloadRecordProgress(recording.id, progressValue, userId);
        }
      );

      // Store resumable download URI for potential resume
      const resumableState = downloadResumable.savable();
      const resumableKey = `resumable_${userId}_${recording.id}`;
      await AsyncStorage.setItem(resumableKey, JSON.stringify(resumableState));

      // Store active download for pausing
      activeDownloads.current[recording.id] = downloadResumable;

      // Save the initial download record to AsyncStorage
      const downloadKey = `download_${userId}_${recording.id}`;
      await AsyncStorage.setItem(downloadKey, JSON.stringify(downloadRecord));

      // Add to downloads list immediately
      const newDownloadedRecordings = [...downloadedRecordings, recording.id];
      setDownloadedRecordings(newDownloadedRecordings);

      // Store the updated downloads list
      const downloadsListKey = `downloads_list_${userId}`;
      await AsyncStorage.setItem(downloadsListKey, JSON.stringify(newDownloadedRecordings));

      // Update download status to downloading
      setDownloads((prev) => ({
        ...prev,
        [recording.id]: {
          recordingId: recording.id,
          status: "downloading",
          progress: 0,
          resumableUri: resumableKey,
        },
      }));

      // Start download
      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        // Download completed successfully - update the existing record
        const downloadKey = `download_${userId}_${recording.id}`;
        const updatedRecord = {
          ...downloadRecord,
          download_status: "completed" as DownloadStatus,
          download_progress: 1,
          downloaded_at: Date.now(),
          audio_path: result.uri,
        };
        await AsyncStorage.setItem(downloadKey, JSON.stringify(updatedRecord));

        // Update in-memory state
        setDownloads((prev) => ({
          ...prev,
          [recording.id]: {
            recordingId: recording.id,
            status: "completed",
            progress: 1,
          },
        }));

        // Clean up resumable URI and active download
        await AsyncStorage.removeItem(resumableKey);
        delete activeDownloads.current[recording.id];

        // Update storage usage
        void calculateStorageUsed();

        // Release operation lock
        endOperation(recording.id);
      }
    } catch (error) {
      console.error("Download error:", error);

      // Don't remove active download here if it was paused - only on actual errors
      if (error instanceof Error && error.message !== "Download was paused") {
        delete activeDownloads.current[recording.id];
        // Update the stored record with error status
        await updateDownloadRecordStatus(recording.id, "error", userId, error.message);
      }

      // Always release operation lock on error
      endOperation(recording.id);

      handleDownloadError(recording.id, error);
      throw error; // Re-throw to let caller handle the error
    }
  };

  // Handle download errors
  const handleDownloadError = (recordingId: string, error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    setDownloads((prev) => ({
      ...prev,
      [recordingId]: {
        ...prev[recordingId],
        status: "paused",
        error: errorMessage,
      },
    }));
  };

  // Pause a download
  const pauseDownload = async (recordingId: string) => {
    // Check for concurrent operations
    if (isOperationInProgress(recordingId)) {
      throw new Error("Another operation is already in progress for this recording");
    }

    // Validate if download can be paused
    if (!canPauseDownload(recordingId)) {
      const currentStatus = downloads[recordingId]?.status;
      throw new Error(
        `Cannot pause download: Recording is currently ${currentStatus || "not downloading"}. ` +
          `Only actively downloading recordings can be paused.`
      );
    }

    // Start operation lock
    startOperation(recordingId, "pause");

    const activeDownload = activeDownloads.current[recordingId];

    if (activeDownload) {
      try {
        // Pause the download by calling pauseAsync
        await activeDownload.pauseAsync().catch((error) => {
          console.error("Error pausing download:", error);
        });

        // Update the resumable state after pausing
        const pauseUserId = authState.user?.id || "anonymous";
        const resumableKey = `resumable_${pauseUserId}_${recordingId}`;
        const resumableState = activeDownload.savable();
        await AsyncStorage.setItem(resumableKey, JSON.stringify(resumableState));

        // Update download status to paused
        setDownloads((prev) => ({
          ...prev,
          [recordingId]: {
            ...prev[recordingId],
            status: "paused",
            resumableUri: resumableKey,
          },
        }));

        // Update stored record status to paused
        await updateDownloadRecordStatus(recordingId, "paused", pauseUserId);

        // Remove from active downloads since it's paused
        delete activeDownloads.current[recordingId];

        // Release operation lock
        endOperation(recordingId);
      } catch (error) {
        console.error("Error pausing download:", error);

        // Still update status to paused even if pause failed
        setDownloads((prev) => ({
          ...prev,
          [recordingId]: {
            ...prev[recordingId],
            status: "paused",
          },
        }));

        // Release operation lock on error
        endOperation(recordingId);
        throw error; // Re-throw to let caller handle the error
      }
    } else {
      // No active download found, just update status and release lock
      setDownloads((prev) => ({
        ...prev,
        [recordingId]: {
          ...prev[recordingId],
          status: "paused",
        },
      }));

      // Release operation lock
      endOperation(recordingId);
    }
  };

  // Resume a paused download
  const resumeDownload = async (recordingId: string) => {
    // Check for concurrent operations
    if (isOperationInProgress(recordingId)) {
      throw new Error("Another operation is already in progress for this recording");
    }

    // Validate if download can be resumed
    if (!canResumeDownload(recordingId)) {
      const currentStatus = downloads[recordingId]?.status;
      throw new Error(
        `Cannot resume download: Recording is currently ${currentStatus || "not paused"}. ` +
          `Only paused recordings can be resumed.`
      );
    }

    // Start operation lock
    startOperation(recordingId, "resume");

    try {
      const userId = authState.user?.id || "anonymous";
      const resumableKey = `resumable_${userId}_${recordingId}`;
      const resumableData = await AsyncStorage.getItem(resumableKey);

      if (!resumableData) {
        throw new Error(
          `No resumable download data found for this recording. ` +
            `The download may have been corrupted or cleaned up. Please start a new download.`
        );
      }

      // Parse the resumable state and create download resumable
      const resumableState = JSON.parse(resumableData) as {
        url?: string;
        fileUri?: string;
        options?: Record<string, unknown>;
        resumeData?: string;
      };

      if (!resumableState.url || !resumableState.fileUri) {
        throw new Error("Invalid resumable state");
      }

      const downloadResumable = new FileSystem.DownloadResumable(
        resumableState.url,
        resumableState.fileUri,
        resumableState.options || {},
        (progress) => {
          const progressValue = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setDownloads((prev) => ({
            ...prev,
            [recordingId]: {
              ...prev[recordingId],
              progress: progressValue,
            },
          }));
        },
        resumableState.resumeData
      );

      // Update status to downloading
      setDownloads((prev) => ({
        ...prev,
        [recordingId]: {
          ...prev[recordingId],
          status: "downloading",
          error: undefined,
        },
      }));

      // Update stored record status to downloading
      const resumeUserId = authState.user?.id || "anonymous";
      await updateDownloadRecordStatus(recordingId, "downloading", resumeUserId);

      // Resume download
      const result = await downloadResumable.resumeAsync();

      if (result?.uri) {
        // Update the existing record to completed status
        const downloadKey = `download_${resumeUserId}_${recordingId}`;
        const existingData = await AsyncStorage.getItem(downloadKey);

        if (existingData) {
          const downloadRecord = JSON.parse(existingData) as DownloadRecord;
          const updatedRecord = {
            ...downloadRecord,
            download_status: "completed" as DownloadStatus,
            download_progress: 1,
            downloaded_at: Date.now(),
            audio_path: result.uri,
          };
          await AsyncStorage.setItem(downloadKey, JSON.stringify(updatedRecord));
        }

        // Update in-memory state
        setDownloads((prev) => ({
          ...prev,
          [recordingId]: {
            recordingId,
            status: "completed",
            progress: 1,
          },
        }));

        // Clean up resumable URI
        const resumableKey = `resumable_${resumeUserId}_${recordingId}`;
        await AsyncStorage.removeItem(resumableKey);

        // Update storage usage
        void calculateStorageUsed();

        // Release operation lock
        endOperation(recordingId);
      }
    } catch (error) {
      console.error("Resume download error:", error);

      // Always release operation lock on error
      endOperation(recordingId);

      handleDownloadError(recordingId, error);
      throw error; // Re-throw to let caller handle the error
    }
  };

  // Delete a downloaded recording
  const deleteDownload = async (recordingId: string) => {
    // Check for concurrent operations
    if (isOperationInProgress(recordingId)) {
      throw new Error("Another operation is already in progress for this recording");
    }

    // Validate if download can be deleted
    if (!canDeleteDownload(recordingId)) {
      const currentStatus = downloads[recordingId]?.status;
      throw new Error(
        `Cannot delete download: Recording is currently ${currentStatus || "not completed"}. ` +
          `Only completed downloads can be deleted.`
      );
    }

    // Start operation lock
    startOperation(recordingId, "delete");

    try {
      const userId = authState.user?.id || "anonymous";
      const downloadKey = `download_${userId}_${recordingId}`;

      // Get the download record
      const downloadData = await AsyncStorage.getItem(downloadKey);

      if (!downloadData) {
        throw new Error(
          `Download record not found. The download may have already been deleted or was never completed.`
        );
      }

      const downloadRecord = JSON.parse(downloadData) as DownloadRecord;

      // Additional safety check: only delete if status is completed
      if (downloadRecord.download_status !== "completed") {
        throw new Error(
          `Cannot delete incomplete download. Current status: ${downloadRecord.download_status}`
        );
      }

      // Delete files with error handling
      try {
        const audioInfo = await FileSystem.getInfoAsync(downloadRecord.audio_path);
        if (audioInfo.exists) {
          await FileSystem.deleteAsync(downloadRecord.audio_path);
        }
      } catch (fileError) {
        console.warn("Warning: Could not delete audio file:", fileError);
        // Continue with deletion process even if file deletion fails
      }

      // Remove from AsyncStorage
      await AsyncStorage.removeItem(downloadKey);

      // Update the downloads list
      const newDownloadedRecordings = downloadedRecordings.filter((id) => id !== recordingId);
      setDownloadedRecordings(newDownloadedRecordings);

      // Store the updated downloads list
      const downloadsListKey = `downloads_list_${userId}`;
      await AsyncStorage.setItem(downloadsListKey, JSON.stringify(newDownloadedRecordings));

      // Clean up any remaining resumable data
      const resumableKey = `resumable_${userId}_${recordingId}`;
      await AsyncStorage.removeItem(resumableKey).catch(() => {
        // Ignore errors for resumable cleanup
      });

      // Update downloads state
      setDownloads((prev) => {
        const newDownloads = { ...prev };
        delete newDownloads[recordingId];
        return newDownloads;
      });

      // Update storage usage
      void calculateStorageUsed();

      // Release operation lock
      endOperation(recordingId);
    } catch (error) {
      console.error("Delete download error:", error);

      // Always release operation lock on error
      endOperation(recordingId);

      throw error; // Re-throw to let caller handle the error
    }
  };

  // Clear all downloads - now uses the utility function
  const clearAllDownloads = async () => {
    try {
      const userId = authState.user?.id || null;

      // Use the utility function to clear downloads
      await clearUserDownloads(userId);

      // Update local state
      setDownloadedRecordings([]);
      setDownloads({});
      setTotalStorageUsed(0);
    } catch (error) {
      console.error("Clear downloads error:", error);
    }
  };

  // Check if a recording is downloaded (completed)
  const isDownloaded = (recordingId: string) => {
    // Check if it's in the downloads list AND has completed status
    if (!downloadedRecordings.includes(recordingId)) return false;

    const downloadStatus = downloads[recordingId];
    return downloadStatus?.status === "completed";
  };

  // Get the file path for a downloaded file
  const getDownloadPath = (fileId: string) => {
    if (!fileId) return null;

    const downloadsDir = FileSystem.documentDirectory + "downloads/";
    return `${downloadsDir}audio_${fileId}.mp3`;
  };

  return (
    <DownloadContext.Provider
      value={{
        downloads,
        downloadedRecordings,
        totalStorageUsed,
        downloadRecording,
        pauseDownload,
        resumeDownload,
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
