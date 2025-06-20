"use client";

import {
  ArrowLeft,
  Pause,
  Play,
  Volume2,
  Maximize,
  Minimize,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import PageBadge from "@/components/PageBadge";
import { getBestAudioUri, getSonogramVideoUri } from "@/lib/mediaUtils";
import { fetchRecordingById } from "@/lib/supabase";
import { Recording } from "@/types";

import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Loading Recording</h3>
            <p className="text-muted-foreground text-center">Fetching recording details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Recording</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={handleBack} variant="default">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const audioUri = getBestAudioUri(recording);
  const videoUri = getSonogramVideoUri(recording);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{recording.title}</h1>
              {recording.species && (
                <Button
                  variant="link"
                  onClick={handleSpeciesClick}
                  className="p-0 h-auto text-sm text-left justify-start"
                >
                  {recording.species.common_name} ({recording.species.scientific_name})
                </Button>
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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Video Player */}
        {videoUri && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Sonogram Video
              </CardTitle>
              <CardDescription>
                Visual representation of the sound with audio playback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videoError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load sonogram video. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : (
                <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoUri}
                    className="w-full h-auto"
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    onError={handleVideoError}
                    playsInline
                  />

                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleVideoPlayPause}
                        disabled={!isVideoLoaded}
                        className="text-white hover:bg-white/20"
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </Button>

                      <div className="flex-1">
                        {isVideoLoaded && (
                          <input
                            type="range"
                            min="0"
                            max={videoDuration}
                            value={videoPosition}
                            onChange={handleVideoSeek}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                        )}
                      </div>

                      <span className="text-white text-sm font-mono">
                        {formatTime(videoPosition)} / {formatTime(videoDuration)}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="text-white hover:bg-white/20"
                      >
                        {isVideoFullscreen ? (
                          <Minimize className="w-5 h-5" />
                        ) : (
                          <Maximize className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recording Details */}
        <Card>
          <CardHeader>
            <CardTitle>Recording Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recording.species && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{recording.species.common_name}</Badge>
                <Badge variant="outline">{recording.species.scientific_name}</Badge>
              </div>
            )}

            {recording.caption && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Description</h4>
                <p className="text-muted-foreground leading-relaxed">{recording.caption}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-foreground">Book Page:</span>
                <span className="ml-2 text-muted-foreground">{recording.book_page_number}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Recording ID:</span>
                <span className="ml-2 text-muted-foreground font-mono">{recording.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
