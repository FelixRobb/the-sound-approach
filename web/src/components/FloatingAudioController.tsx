"use client";

import {
  Play,
  Pause,
  X,
  AlertTriangle,
  Loader2,
  ChevronUp,
  ChevronDown,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { motion, PanInfo } from "motion/react";
import Link from "next/link";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Slider } from "./ui/slider";

import { useAudio } from "@/contexts/AudioContext";
import { AudioPlayerPositionProps } from "@/types";

export default function FloatingAudioController() {
  const {
    isPlaying,
    isLoading,
    currentTrackId,
    currentTrackUri,
    currentTrackTitle,
    currentTime,
    duration,
    error,
    togglePlayPause,
    seekTo,
    seekForward,
    seekBackward,
    stop,
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState<AudioPlayerPositionProps>({ x: 0, y: 0 });
  const [isDragDisabled, setIsDragDisabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get actual component dimensions
  const getComponentDimensions = useCallback(() => {
    if (!cardRef.current) {
      // Fallback estimates
      return {
        width: isExpanded ? 380 : 320,
        height: isExpanded ? 180 : 80,
      };
    }

    const rect = cardRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }, [isExpanded]);

  // Track window size for drag constraints
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  // Calculate initial position synchronously for immediate use
  const getInitialPosition = useCallback(() => {
    if (!windowSize.width || !windowSize.height) {
      return { x: 20, y: 20 }; // Fallback position
    }

    const saved = localStorage.getItem("floatingAudioController-position");

    if (saved) {
      try {
        const savedPosition = JSON.parse(saved) as AudioPlayerPositionProps;
        const dimensions = getComponentDimensions();
        const margin = 16;

        // Check if saved position is still valid for current window size
        const isValid =
          savedPosition.x >= margin &&
          savedPosition.x <= windowSize.width - dimensions.width - margin &&
          savedPosition.y >= margin &&
          savedPosition.y <= windowSize.height - dimensions.height - margin;

        if (isValid) {
          return savedPosition;
        }
      } catch (error) {
        console.warn("Failed to parse saved audio controller position:", error);
      }
    }

    // Default to bottom-right with margin
    const dimensions = getComponentDimensions();
    const margin = 20;
    return {
      x: windowSize.width - dimensions.width - margin,
      y: windowSize.height - dimensions.height - margin,
    };
  }, [windowSize, getComponentDimensions]);

  // Initialize position immediately when window size is available
  useEffect(() => {
    if (!windowSize.width || !windowSize.height || isInitialized) return;

    const initialPos = getInitialPosition();
    setPosition(initialPos);
    setIsInitialized(true);
  }, [windowSize, getInitialPosition, isInitialized]);

  // Recalculate constraints when component dimensions change
  const constrainPosition = useCallback(
    (pos: AudioPlayerPositionProps) => {
      if (!windowSize.width || !windowSize.height) return pos;

      const dimensions = getComponentDimensions();
      const margin = 16;

      const constraints = {
        left: margin,
        right: windowSize.width - dimensions.width - margin,
        top: margin,
        bottom: windowSize.height - dimensions.height - margin,
      };

      return {
        x: Math.max(constraints.left, Math.min(constraints.right, pos.x)),
        y: Math.max(constraints.top, Math.min(constraints.bottom, pos.y)),
      };
    },
    [windowSize, getComponentDimensions]
  );

  // Update position when expanded state changes to maintain bounds
  useEffect(() => {
    if (!isInitialized) return;

    // Small delay to allow component to resize
    const timer = setTimeout(() => {
      setPosition((prevPos) => {
        const constrainedPos = constrainPosition(prevPos);

        // Save the new constrained position
        if (constrainedPos.x !== prevPos.x || constrainedPos.y !== prevPos.y) {
          localStorage.setItem("floatingAudioController-position", JSON.stringify(constrainedPos));
        }

        return constrainedPos;
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [isExpanded, constrainPosition, isInitialized]);

  // Calculate drag constraints for framer-motion
  const dragConstraints = useMemo(() => {
    if (!windowSize.width || !windowSize.height) return {};

    const dimensions = getComponentDimensions();
    const margin = 16;

    return {
      left: margin,
      right: windowSize.width - dimensions.width - margin,
      top: margin,
      bottom: windowSize.height - dimensions.height - margin,
    };
  }, [windowSize, getComponentDimensions]);

  // Optimized event handlers
  const handlePlayPause = useCallback(() => {
    if (!currentTrackId || !currentTrackUri || isLoading) return;

    try {
      void togglePlayPause(currentTrackUri, currentTrackId);
    } catch (error) {
      console.error("Failed to toggle playback:", error);
    }
  }, [currentTrackId, currentTrackUri, togglePlayPause, isLoading]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleSeekForward = useCallback(() => {
    seekForward(10);
  }, [seekForward]);

  const handleSeekBackward = useCallback(() => {
    seekBackward(10);
  }, [seekBackward]);

  const handleSliderChange = useCallback(
    (value: number[]) => {
      seekTo(value[0]);
    },
    [seekTo]
  );

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Save position when dragging ends
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Calculate the new position based on the current position plus the drag offset
      const newPosition: AudioPlayerPositionProps = {
        x: position.x + info.offset.x,
        y: position.y + info.offset.y,
      };

      // Ensure the position is within bounds
      const constrainedPosition = constrainPosition(newPosition);

      setPosition(constrainedPosition);
      localStorage.setItem("floatingAudioController-position", JSON.stringify(constrainedPosition));
    },
    [position, constrainPosition]
  );

  // Handle window resize to reposition if needed
  useEffect(() => {
    if (!isInitialized) return;

    const handleResize = () => {
      setPosition((prevPos: AudioPlayerPositionProps) => {
        const constrainedPos = constrainPosition(prevPos);

        if (constrainedPos.x !== prevPos.x || constrainedPos.y !== prevPos.y) {
          localStorage.setItem("floatingAudioController-position", JSON.stringify(constrainedPos));
        }

        return constrainedPos;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [constrainPosition, isInitialized]);

  // Handle slider interactions to disable drag
  const handleSliderPointerDown = useCallback(() => {
    setIsDragDisabled(true);
  }, []);

  const handleSliderPointerUp = useCallback(() => {
    setTimeout(() => {
      setIsDragDisabled(false);
    }, 300);
  }, []);

  // Stable time formatting
  const formatTime = useCallback((time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  // Memoized formatted times - only update when time actually changes
  const formattedCurrentTime = useMemo(() => formatTime(currentTime), [formatTime, currentTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [formatTime, duration]);

  // Stable track display name
  const trackDisplayName = useMemo(() => {
    return currentTrackTitle || `Track ${currentTrackId?.slice(-4) || "Unknown"}`;
  }, [currentTrackTitle, currentTrackId]);

  if (!currentTrackId || !isInitialized || !windowSize.width || !windowSize.height) return null;

  return (
    <motion.div
      drag={!isDragDisabled}
      draggable={!isDragDisabled}
      dragElastic={0.1}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 100, bounceDamping: 20 }}
      dragConstraints={dragConstraints}
      initial={position}
      animate={position}
      onDragEnd={handleDragEnd}
      className="fixed z-50"
      style={{
        minWidth: "fit-content",
        maxWidth: `calc(100vw - 32px)`,
      }}
    >
      <Card
        ref={cardRef}
        className={`p-2 sm:p-3 shadow-lg border-2 bg-card/95 backdrop-blur-lg transition-all duration-300 hover:shadow-xl ${
          isExpanded ? "w-[320px] sm:w-[380px]" : "w-[280px] sm:w-[320px]"
        }`}
      >
        {/* Main Controls Row */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Error state */}
          {error ? (
            <div className="flex items-center gap-2 text-destructive flex-1 min-w-0">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">Audio Error</span>
            </div>
          ) : (
            <>
              {/* Play/Pause button */}
              <Button
                variant="default"
                size="icon"
                onClick={() => {
                  void handlePlayPause();
                }}
                disabled={isLoading}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/recording/${currentTrackId}`}
                  className="text-sm font-medium text-foreground truncate hover:text-primary block"
                >
                  {trackDisplayName}
                </Link>
                <div className="text-xs text-muted-foreground truncate">
                  {isLoading ? "Loading..." : isPlaying ? "Playing" : "Paused"}
                </div>
              </div>
            </>
          )}

          {/* Expand/Collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpanded}
            className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </Button>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStop}
            className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Expanded Controls */}
        {isExpanded && !error && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            {/* Seek Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSeekBackward}
                className="w-8 h-8 rounded-full"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSeekForward}
                className="w-8 h-8 rounded-full"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Slider */}
            <div
              className="space-y-1"
              onPointerDown={handleSliderPointerDown}
              onPointerUp={handleSliderPointerUp}
              onPointerLeave={handleSliderPointerUp}
            >
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSliderChange}
                className="w-full cursor-pointer"
                disabled={!duration || duration === 0}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formattedCurrentTime}</span>
                <span>{formattedDuration}</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
