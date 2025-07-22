import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect } from "react";

import AudioService from "../lib/AudioService";

interface NavigationAudioStopperProps {
  /**
   * Whether to fully stop & unload audio when this screen unmounts.
   * Set to false for screens that did NOT initiate playback and should
   * preserve the global audio context when they are removed from the stack.
   * Defaults to true.
   */
  stopOnUnmount?: boolean;
}

const NavigationAudioStopper: React.FC<NavigationAudioStopperProps> = ({
  stopOnUnmount = true,
}) => {
  const audioService = AudioService.getInstance();

  useFocusEffect(
    useCallback(() => {
      // On focus: no action
      return () => {
        // On blur: just pause the current playback so state is preserved
        audioService.pause().catch((error) => {
          console.error("Error pausing audio on screen blur:", error);
        });
      };
    }, [audioService])
  );

  // On component unmount: fully stop and unload if configured
  useEffect(() => {
    return () => {
      if (stopOnUnmount) {
        audioService.stop().catch((error) => {
          console.error("Error stopping audio on component unmount:", error);
        });
      }
    };
  }, [audioService, stopOnUnmount]);

  // This component renders nothing
  return null;
};

export default NavigationAudioStopper;
