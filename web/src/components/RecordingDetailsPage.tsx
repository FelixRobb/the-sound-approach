"use client";

import { ArrowLeft, AlertCircle, Loader2, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<typeof videojs.players | null>(null);

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

  // Initialize video.js player
  useEffect(() => {
    if (!recording || !videoRef.current) return;

    const videoUri = getSonogramVideoUri(recording);
    if (!videoUri) return;

    // Create video element
    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered");
    videoElement.setAttribute("data-setup", "{}");

    // Clear any existing content and append video element
    videoRef.current.innerHTML = "";
    videoRef.current.appendChild(videoElement);

    // Initialize Video.js player
    const player = videojs(videoElement, {
      controls: true,
      responsive: true,
      fluid: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      sources: [
        {
          src: videoUri,
          type: "video/mp4",
        },
      ],
      poster: "",
    });

    player.on("error", () => {
      console.error("Video.js player error");
      setVideoError(true);
    });

    playerRef.current = player;

    // Cleanup function
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [recording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

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
              {audioUri && (
                <MiniAudioPlayer
                  trackId={recording.id}
                  audioUri={audioUri}
                  title={recording.title}
                />
              )}
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
                <div className="rounded-lg overflow-hidden bg-black">
                  <div ref={videoRef} className="w-full" data-vjs-player />
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
