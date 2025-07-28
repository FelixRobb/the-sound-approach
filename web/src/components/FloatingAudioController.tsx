"use client";

import {
  Play,
  Pause,
  X,
  Move,
  AlertTriangle,
  Loader2,
  ChevronUp,
  ChevronDown,
  SkipForward,
  SkipBack,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Slider } from "./ui/slider";

import { useAudio } from "@/contexts/AudioContext";

type Position = {
  x: number;
  y: number;
};

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
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedPosition = localStorage.getItem("floatingAudioControllerPosition");
        if (storedPosition) {
          return JSON.parse(storedPosition);
        }
        // Start in bottom-right corner on larger screens, bottom-center on mobile
        const isMobile = window.innerWidth < 768;
        return isMobile
          ? { x: window.innerWidth / 2 - 100, y: window.innerHeight - 100 }
          : { x: window.innerWidth - 320, y: window.innerHeight - 100 };
      } catch {
        return { x: 20, y: 20 };
      }
    }
    return { x: 20, y: 20 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const controllerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });

  // Show/hide controller based on audio state
  useEffect(() => {
    setIsVisible(!!currentTrackId);
    if (!currentTrackId) {
      setIsExpanded(false);
    }
  }, [currentTrackId]);

  // Handle window resize to keep controller in bounds
  useEffect(() => {
    const handleResize = () => {
      if (!controllerRef.current) return;

      const rect = controllerRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 20;
      const maxY = window.innerHeight - rect.height - 20;

      localStorage.setItem(
        "floatingAudioControllerPosition",
        JSON.stringify({
          x: Math.min(Math.max(20, position.x), maxX),
          y: Math.min(Math.max(20, position.y), maxY),
        })
      );

      setPosition((prev) => ({
        x: Math.min(Math.max(20, prev.x), maxX),
        y: Math.min(Math.max(20, prev.y), maxY),
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position.x, position.y]);

  // Constrain position to screen bounds
  const constrainPosition = useCallback((pos: Position): Position => {
    if (!controllerRef.current) return pos;

    const rect = controllerRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 20;
    const maxY = window.innerHeight - rect.height - 20;

    return {
      x: Math.min(Math.max(20, pos.x), maxX),
      y: Math.min(Math.max(20, pos.y), maxY),
    };
  }, []);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging when clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest('[role="slider"]') ||
      target.closest(".slider-thumb")
    ) {
      return;
    }

    // On mobile (when drag handle is hidden), allow dragging from anywhere on the controller
    const isMobile = window.innerWidth < 768;
    const isDragHandle = target.closest("[data-drag-handle]");
    const isControllerCard = target.closest("[data-controller-card]");

    if (!isMobile && !isDragHandle) {
      return;
    }

    if (isMobile && !isControllerCard) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newPosition = constrainPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });

      setPosition(newPosition);
    },
    [isDragging, dragOffset, constrainPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    localStorage.setItem(
      "floatingAudioControllerPosition",
      JSON.stringify({ x: position.x, y: position.y })
    );
  }, [position.x, position.y]);

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent dragging when touching interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest('[role="slider"]') ||
      target.closest(".slider-thumb")
    ) {
      return;
    }

    // On mobile (when drag handle is hidden), allow dragging from anywhere on the controller
    const isMobile = window.innerWidth < 768;
    const isDragHandle = target.closest("[data-drag-handle]");
    const isControllerCard = target.closest("[data-controller-card]");

    if (!isMobile && !isDragHandle) {
      return;
    }

    if (isMobile && !isControllerCard) {
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      const touch = e.touches[0];
      const newPosition = constrainPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      });

      setPosition(newPosition);
    },
    [isDragging, dragOffset, constrainPosition]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    localStorage.setItem(
      "floatingAudioControllerPosition",
      JSON.stringify({ x: position.x, y: position.y })
    );
  }, [position.x, position.y]);

  // Set up global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handlePlayPause = async () => {
    if (!currentTrackId || !currentTrackUri) return;

    try {
      await togglePlayPause(currentTrackUri, currentTrackId);
    } catch (error) {
      console.error("Failed to toggle playback:", error);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleSeekForward = () => {
    seekForward(10);
  };

  const handleSeekBackward = () => {
    seekBackward(10);
  };

  const handleSliderChange = (value: number[]) => {
    seekTo(value[0]);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isVisible) return null;

  return (
    <div
      ref={controllerRef}
      className={`fixed z-50 transition-all duration-200 ${
        isDragging ? "cursor-grabbing scale-105" : "cursor-grab"
      }`}
      style={{
        left: position.x,
        top: position.y,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <Card
        data-controller-card
        className={`p-2 sm:p-3 shadow-lg border-2 bg-card/95 backdrop-blur-lg hover:shadow-xl transition-all duration-300 ${
          isExpanded ? "max-w-[320px] sm:max-w-[380px]" : "max-w-[280px] sm:max-w-[320px]"
        }`}
      >
        {/* Main Controls Row */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Drag handle - hidden on mobile for more space */}
          <div
            data-drag-handle
            className="hidden sm:flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
          >
            <Move className="w-4 h-4" />
          </div>

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
                onClick={handlePlayPause}
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
                  className="text-sm sm:text-sm font-medium text-foreground truncate hover:text-primary block"
                >
                  {currentTrackTitle || `Track ${currentTrackId?.slice(-4) || "Unknown"}`}
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

              <div className="text-xs text-muted-foreground min-w-[35px] text-center">
                {formatTime(currentTime)}
              </div>

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
            <div className="space-y-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSliderChange}
                className="w-full cursor-pointer"
                disabled={!duration || duration === 0}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
