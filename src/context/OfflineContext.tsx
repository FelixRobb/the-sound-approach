"use client";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { createContext, useContext, useEffect, useState } from "react";

import type { RootStackParamList } from "../types";

import { NetworkContext } from "./NetworkContext";

type OfflineContextType = {
  shouldRedirectToRecordings: boolean;
  setShouldRedirectToRecordings: (value: boolean) => void;
  handleOfflineRedirect: () => void;
  canNavigateToRecordingDetails: (recordingId: string) => boolean;
  isScreenAllowedOffline: (screenName: keyof RootStackParamList) => boolean;
};

export const OfflineContext = createContext<OfflineContextType>({
  shouldRedirectToRecordings: false,
  setShouldRedirectToRecordings: () => {},
  handleOfflineRedirect: () => {},
  canNavigateToRecordingDetails: () => true,
  isScreenAllowedOffline: () => true,
});

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useContext(NetworkContext);
  const [shouldRedirectToRecordings, setShouldRedirectToRecordings] = useState(false);
  const [previousConnectionState, setPreviousConnectionState] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Monitor network status changes
  useEffect(() => {
    // If we just went offline and we're not already planning to redirect
    if (previousConnectionState && !isConnected && !shouldRedirectToRecordings) {
      setShouldRedirectToRecordings(true);
    }

    setPreviousConnectionState(isConnected);
  }, [isConnected, previousConnectionState, shouldRedirectToRecordings]);

  // Handle redirecting to RecordingsListScreen when going offline
  const handleOfflineRedirect = () => {
    if (shouldRedirectToRecordings) {
      // Reset the flag
      setShouldRedirectToRecordings(false);

      // Navigate to the RecordingsListScreen
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    }
  };

  // Check if a screen is allowed to be accessed while offline
  const isScreenAllowedOffline = (screenName: keyof RootStackParamList): boolean => {
    // When offline, only allow certain screens
    if (!isConnected) {
      const allowedScreens: (keyof RootStackParamList)[] = [
        "MainTabs",
        "Downloads",
        "Profile",
        "OfflineNotice",
      ];
      return allowedScreens.includes(screenName);
    }
    return true;
  };

  // Check if navigation to RecordingDetails is allowed
  // This will be used to prevent navigation from Downloads to RecordingDetails when offline
  const canNavigateToRecordingDetails = (): boolean => {
    // When online, always allow navigation
    if (isConnected) {
      return true;
    }

    // When offline, don't allow navigation to recording details
    return false;
  };

  return (
    <OfflineContext.Provider
      value={{
        shouldRedirectToRecordings,
        setShouldRedirectToRecordings,
        handleOfflineRedirect,
        canNavigateToRecordingDetails,
        isScreenAllowedOffline,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
