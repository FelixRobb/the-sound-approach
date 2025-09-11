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

  // Track active download operations for pausing/resuming
  const activeDownloads = useRef<Record<string, FileSystem.DownloadResumable>>({});

  // Load downloaded recordings and their status from AsyncStorage
  const loadDownloadedRecordings = useCallback(async () => {
    try {
      const userId = authState.user?.id || "anonymous";
      const downloadsListKey = `downloads_list_${userId}`;
      const downloadsList = await AsyncStorage.getItem(downloadsListKey);

      if (downloadsList) {
        const ids = JSON.parse(downloadsList) as string[];
        const downloadsStatus: Record<string, DownloadInfo> = {};
        const validIds: string[] = [];

        for (const recordingId of ids) {
          const downloadKey = `download_${userId}_${recordingId}`;
          const downloadData = await AsyncStorage.getItem(downloadKey);

          if (downloadData) {
            const downloadRecord = JSON.parse(downloadData) as DownloadRecord;

            // Reconcile: if file exists locally, force status to completed
            let reconciledStatus = downloadRecord.download_status;
            let reconciledProgress = downloadRecord.download_progress;
            try {
              const fileInfo = await FileSystem.getInfoAsync(downloadRecord.audio_path);
              if (fileInfo.exists) {
                if (reconciledStatus !== "completed" || reconciledProgress < 1) {
                  const updatedRecord: DownloadRecord = {
                    ...downloadRecord,
                    download_status: "completed",
                    download_progress: 1,
                    downloaded_at: downloadRecord.downloaded_at || Date.now(),
                  };
                  await AsyncStorage.setItem(downloadKey, JSON.stringify(updatedRecord));
                  reconciledStatus = "completed";
                  reconciledProgress = 1;
                }
              }
            } catch {
              // Ignore file info errors; fall back to stored status
            }

            downloadsStatus[recordingId] = {
              recordingId,
              status: reconciledStatus,
              progress: reconciledProgress,
            };
            validIds.push(recordingId);
          }
        }

        setDownloadedRecordings(validIds);
        setDownloads(downloadsStatus);

        // Update storage if we cleaned up invalid entries
        if (validIds.length !== ids.length) {
          await AsyncStorage.setItem(downloadsListKey, JSON.stringify(validIds));
        }
      } else {
        setDownloadedRecordings([]);
        setDownloads({});
      }
    } catch (error) {
      console.error("Error loading downloaded recordings:", error);
      setDownloadedRecordings([]);
      setDownloads({});
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

  // Helper function to update download record
  const updateDownloadRecord = async (recordingId: string, updates: Partial<DownloadRecord>) => {
    try {
      const userId = authState.user?.id || "anonymous";
      const downloadKey = `download_${userId}_${recordingId}`;
      const existingData = await AsyncStorage.getItem(downloadKey);

      if (existingData) {
        const downloadRecord = JSON.parse(existingData) as DownloadRecord;
        const updatedRecord = { ...downloadRecord, ...updates };
        await AsyncStorage.setItem(downloadKey, JSON.stringify(updatedRecord));
      }
    } catch (error) {
      console.error("Error updating download record:", error);
    }
  };

  // Get all downloaded recordings with metadata
  const getDownloadedRecordings = async (): Promise<DownloadRecord[]> => {
    try {
      const userId = authState.user?.id || "anonymous";
      const result: DownloadRecord[] = [];

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
    const recordingId = recording.id;
    const currentDownload = downloads[recordingId];

    // Don't start if already completed
    if (currentDownload?.status === "completed") {
      throw new Error("Recording is already downloaded");
    }

    // Don't start if actively downloading
    if (currentDownload?.status === "downloading") {
      throw new Error("Recording is already being downloaded");
    }

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
      downloaded_at: 0,
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
            [recordingId]: {
              ...prev[recordingId],
              progress: progressValue,
            },
          }));

          // Update stored download record with progress
          void updateDownloadRecord(recordingId, { download_progress: progressValue });
        }
      );

      // Store active download for pausing
      activeDownloads.current[recordingId] = downloadResumable;

      // Save the initial download record to AsyncStorage
      const downloadKey = `download_${userId}_${recordingId}`;
      await AsyncStorage.setItem(downloadKey, JSON.stringify(downloadRecord));

      // Add to downloads list if not already there
      if (!downloadedRecordings.includes(recordingId)) {
        const newDownloadedRecordings = [...downloadedRecordings, recordingId];
        setDownloadedRecordings(newDownloadedRecordings);

        const downloadsListKey = `downloads_list_${userId}`;
        await AsyncStorage.setItem(downloadsListKey, JSON.stringify(newDownloadedRecordings));
      }

      // Update download status to downloading
      setDownloads((prev) => ({
        ...prev,
        [recordingId]: {
          recordingId,
          status: "downloading",
          progress: 0,
        },
      }));

      // Start download
      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        // Download completed successfully
        await updateDownloadRecord(recordingId, {
          download_status: "completed" as DownloadStatus,
          download_progress: 1,
          downloaded_at: Date.now(),
          audio_path: result.uri,
        });

        // Update in-memory state
        setDownloads((prev) => ({
          ...prev,
          [recordingId]: {
            recordingId,
            status: "completed",
            progress: 1,
          },
        }));

        // Clean up active download
        delete activeDownloads.current[recordingId];

        // Update storage usage
        void calculateStorageUsed();
      }
    } catch (error) {
      console.error("Download error:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Only clean up if it's not a pause operation
      if (errorMessage !== "Download was paused") {
        delete activeDownloads.current[recordingId];

        await updateDownloadRecord(recordingId, {
          download_status: "error" as DownloadStatus,
          download_error: errorMessage,
        });

        setDownloads((prev) => ({
          ...prev,
          [recordingId]: {
            ...prev[recordingId],
            status: "error",
            error: errorMessage,
          },
        }));
      }

      throw error;
    }
  };

  // Pause a download
  const pauseDownload = async (recordingId: string) => {
    const activeDownload = activeDownloads.current[recordingId];
    const currentDownload = downloads[recordingId];

    if (!activeDownload || currentDownload?.status !== "downloading") {
      throw new Error("No active download found to pause");
    }

    try {
      // If we're already effectively complete, finalize instead of pausing
      if ((currentDownload?.progress || 0) >= 0.999) {
        const userId = authState.user?.id || "anonymous";
        const downloadKey = `download_${userId}_${recordingId}`;
        const downloadData = await AsyncStorage.getItem(downloadKey);
        if (downloadData) {
          const downloadRecord = JSON.parse(downloadData) as DownloadRecord;
          try {
            const fileInfo = await FileSystem.getInfoAsync(downloadRecord.audio_path);
            if (fileInfo.exists) {
              await updateDownloadRecord(recordingId, {
                download_status: "completed",
                download_progress: 1,
                downloaded_at: Date.now(),
              });

              setDownloads((prev) => ({
                ...prev,
                [recordingId]: {
                  ...prev[recordingId],
                  status: "completed",
                  progress: 1,
                },
              }));

              delete activeDownloads.current[recordingId];

              await AsyncStorage.removeItem(`resumable_${userId}_${recordingId}`).catch(() => {});

              void calculateStorageUsed();
              return;
            }
          } catch {
            // Fall through to normal pause if file check fails
          }
        }
      }

      await activeDownload.pauseAsync();

      const userId = authState.user?.id || "anonymous";

      // Save resumable state
      const resumableState = activeDownload.savable();
      const resumableKey = `resumable_${userId}_${recordingId}`;
      await AsyncStorage.setItem(resumableKey, JSON.stringify(resumableState));

      // Update download status
      setDownloads((prev) => ({
        ...prev,
        [recordingId]: {
          ...prev[recordingId],
          status: "paused",
        },
      }));

      await updateDownloadRecord(recordingId, { download_status: "paused" as DownloadStatus });

      // Remove from active downloads
      delete activeDownloads.current[recordingId];
    } catch (error) {
      console.error("Error pausing download:", error);
      try {
        // If pausing failed, check whether the file is already complete and finalize
        const userId = authState.user?.id || "anonymous";
        const downloadKey = `download_${userId}_${recordingId}`;
        const downloadData = await AsyncStorage.getItem(downloadKey);
        if (downloadData) {
          const downloadRecord = JSON.parse(downloadData) as DownloadRecord;
          const fileInfo = await FileSystem.getInfoAsync(downloadRecord.audio_path);
          if (fileInfo.exists) {
            await updateDownloadRecord(recordingId, {
              download_status: "completed",
              download_progress: 1,
              downloaded_at: Date.now(),
            });

            setDownloads((prev) => ({
              ...prev,
              [recordingId]: {
                ...prev[recordingId],
                status: "completed",
                progress: 1,
              },
            }));

            delete activeDownloads.current[recordingId];
            await AsyncStorage.removeItem(`resumable_${userId}_${recordingId}`).catch(() => {});
            void calculateStorageUsed();
            return;
          }
        }
      } catch {
        // Ignore reconciliation errors and fall through to marking paused
      }

      // Fall back: mark as paused when reconciliation isn't possible
      setDownloads((prev) => ({
        ...prev,
        [recordingId]: {
          ...prev[recordingId],
          status: "paused",
        },
      }));

      throw error;
    }
  };

  // Resume a paused download
  const resumeDownload = async (recordingId: string) => {
    const currentDownload = downloads[recordingId];

    if (currentDownload?.status !== "paused") {
      throw new Error("Download is not paused");
    }

    try {
      const userId = authState.user?.id || "anonymous";
      const resumableKey = `resumable_${userId}_${recordingId}`;
      const resumableData = await AsyncStorage.getItem(resumableKey);

      // If progress shows completion or file exists, finalize without resuming
      if ((currentDownload?.progress || 0) >= 0.999) {
        const downloadKey = `download_${userId}_${recordingId}`;
        const downloadData = await AsyncStorage.getItem(downloadKey);
        if (downloadData) {
          const downloadRecord = JSON.parse(downloadData) as DownloadRecord;
          try {
            const fileInfo = await FileSystem.getInfoAsync(downloadRecord.audio_path);
            if (fileInfo.exists) {
              await updateDownloadRecord(recordingId, {
                download_status: "completed",
                download_progress: 1,
                downloaded_at: Date.now(),
              });

              setDownloads((prev) => ({
                ...prev,
                [recordingId]: {
                  ...prev[recordingId],
                  status: "completed",
                  progress: 1,
                },
              }));

              await AsyncStorage.removeItem(resumableKey).catch(() => {});
              delete activeDownloads.current[recordingId];
              void calculateStorageUsed();
              return;
            }
          } catch {
            // If file check fails, continue to attempt normal resume
          }
        }
      }

      if (!resumableData) {
        throw new Error("No resumable download data found");
      }

      const resumableState = JSON.parse(resumableData) as {
        url: string;
        fileUri: string;
        options?: Record<string, unknown>;
        resumeData?: string;
      };

      if (!resumableState.url || !resumableState.fileUri) {
        throw new Error("Invalid resumable state data");
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

          void updateDownloadRecord(recordingId, { download_progress: progressValue });
        },
        resumableState.resumeData
      );

      // Store active download
      activeDownloads.current[recordingId] = downloadResumable;

      // Update status to downloading
      setDownloads((prev) => ({
        ...prev,
        [recordingId]: {
          ...prev[recordingId],
          status: "downloading",
          error: undefined,
        },
      }));

      await updateDownloadRecord(recordingId, { download_status: "downloading" as DownloadStatus });

      // Resume download
      const result = await downloadResumable.resumeAsync();

      if (result?.uri) {
        await updateDownloadRecord(recordingId, {
          download_status: "completed" as DownloadStatus,
          download_progress: 1,
          downloaded_at: Date.now(),
          audio_path: result.uri,
        });

        setDownloads((prev) => ({
          ...prev,
          [recordingId]: {
            recordingId,
            status: "completed",
            progress: 1,
          },
        }));

        // Clean up resumable data
        await AsyncStorage.removeItem(resumableKey);
        delete activeDownloads.current[recordingId];

        void calculateStorageUsed();
      }
    } catch (error) {
      console.error("Resume download error:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      setDownloads((prev) => ({
        ...prev,
        [recordingId]: {
          ...prev[recordingId],
          status: "error",
          error: errorMessage,
        },
      }));

      await updateDownloadRecord(recordingId, {
        download_status: "error" as DownloadStatus,
        download_error: errorMessage,
      });

      delete activeDownloads.current[recordingId];

      throw error;
    }
  };

  // Delete a downloaded recording
  const deleteDownload = async (recordingId: string) => {
    const currentDownload = downloads[recordingId];

    // Don't allow deletion only if there's an active download operation
    if (currentDownload?.status === "downloading" && activeDownloads.current[recordingId]) {
      throw new Error("Cannot delete active download. Pause it first.");
    }

    try {
      const userId = authState.user?.id || "anonymous";
      const downloadKey = `download_${userId}_${recordingId}`;

      // Get the download record
      const downloadData = await AsyncStorage.getItem(downloadKey);

      if (downloadData) {
        const downloadRecord = JSON.parse(downloadData) as DownloadRecord;

        // Delete audio file if it exists
        try {
          const audioInfo = await FileSystem.getInfoAsync(downloadRecord.audio_path);
          if (audioInfo.exists) {
            await FileSystem.deleteAsync(downloadRecord.audio_path);
          }
        } catch (fileError) {
          console.warn("Warning: Could not delete audio file:", fileError);
        }
      }

      // Remove from AsyncStorage
      await AsyncStorage.removeItem(downloadKey);

      // Clean up resumable data
      const resumableKey = `resumable_${userId}_${recordingId}`;
      await AsyncStorage.removeItem(resumableKey).catch(() => {});

      // Update the downloads list
      const newDownloadedRecordings = downloadedRecordings.filter((id) => id !== recordingId);
      setDownloadedRecordings(newDownloadedRecordings);

      const downloadsListKey = `downloads_list_${userId}`;
      await AsyncStorage.setItem(downloadsListKey, JSON.stringify(newDownloadedRecordings));

      // Update downloads state
      setDownloads((prev) => {
        const newDownloads = { ...prev };
        delete newDownloads[recordingId];
        return newDownloads;
      });

      // Clean up active download reference
      delete activeDownloads.current[recordingId];

      void calculateStorageUsed();
    } catch (error) {
      console.error("Delete download error:", error);
      throw error;
    }
  };

  // Clear all downloads
  const clearAllDownloads = async () => {
    try {
      const userId = authState.user?.id || null;

      // Clear active downloads
      activeDownloads.current = {};

      await clearUserDownloads(userId);

      setDownloadedRecordings([]);
      setDownloads({});
      setTotalStorageUsed(0);
    } catch (error) {
      console.error("Clear downloads error:", error);
    }
  };

  // Check if a recording is downloaded (completed)
  const isDownloaded = (recordingId: string) => {
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
