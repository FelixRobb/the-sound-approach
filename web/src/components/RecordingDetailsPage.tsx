"use client";

import { ArrowLeft, Pause, Play, Volume2, Maximize, Minimize } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import PageBadge from "@/components/PageBadge";
import { getBestAudioUri, getSonogramVideoUri } from "@/lib/mediaUtils";
import { fetchRecordingById } from "@/lib/supabase";
import { Recording } from "@/types";

export default function RecordingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const recordingId = params?.recordingId as string;

  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video player state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPosition, setVideoPosition] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recording data
  useEffect(() => {
    const loadRecording = async () => {
      if (!recordingId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await fetchRecordingById(recordingId);
        setRecording(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recording");
      } finally {
        setLoading(false);
      }
    };

    loadRecording();
  }, [recordingId]);

  // Video event handlers
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      setIsVideoLoaded(true);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoPosition(videoRef.current.currentTime);
    }
  };

  const handleVideoPlay = () => setIsVideoPlaying(true);
  const handleVideoPause = () => setIsVideoPlaying(false);
  const handleVideoError = () => setVideoError(true);

  const toggleVideoPlayPause = () => {
    if (!videoRef.current) return;

    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;

    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setVideoPosition(seekTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isVideoFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsVideoFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsVideoFullscreen(false);
      }
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsVideoFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBack = () => {
    router.back();
  };

  const handleSpeciesClick = () => {
    if (recording?.species_id) {
      router.push(`/species/${recording.species_id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading recording...</p>
        </div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Recording
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const audioUri = getBestAudioUri(recording);
  const videoUri = getSonogramVideoUri(recording);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{recording.title}</h1>
              {recording.species && (
                <button
                  onClick={handleSpeciesClick}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm mt-1"
                >
                  {recording.species.common_name} ({recording.species.scientific_name})
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <PageBadge page={recording.book_page_number} />
              {audioUri && <MiniAudioPlayer trackId={recording.id} audioUri={audioUri} />}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Video Player */}
        {videoUri && (
          <div
            ref={containerRef}
            className={`mb-8 bg-black rounded-lg overflow-hidden ${
              isVideoFullscreen ? "fixed inset-0 z-50" : "relative aspect-video"
            }`}
          >
            <video
              ref={videoRef}
              src={videoUri}
              className="w-full h-full object-contain"
              onLoadedMetadata={handleVideoLoadedMetadata}
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onError={handleVideoError}
              playsInline
            />

            {/* Video Controls */}
            {isVideoLoaded && !videoError && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-4">
                  {/* Play/Pause Button */}
                  <button
                    onClick={toggleVideoPlayPause}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    {isVideoPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>

                  {/* Time Display */}
                  <span className="text-white text-sm font-medium">
                    {formatTime(videoPosition)} / {formatTime(videoDuration)}
                  </span>

                  {/* Progress Bar */}
                  <div className="flex-1 mx-4">
                    <input
                      type="range"
                      min={0}
                      max={videoDuration}
                      value={videoPosition}
                      onChange={handleVideoSeek}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Volume Icon */}
                  <Volume2 className="w-5 h-5 text-white" />

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    {isVideoFullscreen ? (
                      <Minimize className="w-5 h-5 text-white" />
                    ) : (
                      <Maximize className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Video Error */}
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <p className="mb-2">Unable to load video</p>
                  <p className="text-sm opacity-75">The sonogram video could not be loaded</p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {!isVideoLoaded && !videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Description Card */}
        {recording.caption && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{recording.caption}</p>
          </div>
        )}

        {/* Audio Player Card */}
        {audioUri && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Audio Recording
            </h2>
            <div className="flex items-center gap-4">
              <MiniAudioPlayer trackId={recording.id} audioUri={audioUri} size={48} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{recording.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  High-quality audio recording
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom styles for video slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
        }
      `}</style>
    </div>
  );
}
