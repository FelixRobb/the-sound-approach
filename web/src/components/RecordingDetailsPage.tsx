"use client";

import { ArrowLeft, AlertCircle, Loader2, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { SidebarTrigger } from "./ui/sidebar";

import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import { getBestAudioUri, getsonagramVideoUri } from "@/lib/mediaUtils";
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
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);

  // Load recording data
  useEffect(() => {
    const loadRecording = async () => {
      if (!recordingId) return;

      try {
        setLoading(true);
        setError(null);
        const data: Recording = await fetchRecordingById(recordingId);
        setRecording(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recording");
      } finally {
        setLoading(false);
      }
    };

    void loadRecording();
  }, [recordingId]);

  const loadVideoUri = useCallback(async () => {
    const videoUri = await getsonagramVideoUri(recording as Recording);
    setVideoUri(videoUri);
  }, [recording]);

  // Initialize video.js player
  useEffect(() => {
    if (!videoRef.current) return;

    void loadVideoUri();

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

    player.on("error", (): void => {
      console.error("Video.js player error");
      setVideoError(true);
    });

    playerRef.current = player;

    // Cleanup function
    return () => {
      if (
        playerRef.current &&
        typeof playerRef.current.isDisposed === "function" &&
        !playerRef.current.isDisposed()
      ) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [loadVideoUri, recording, videoUri, videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (
        playerRef.current &&
        typeof playerRef.current.isDisposed === "function" &&
        !playerRef.current.isDisposed()
      ) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadAudioUri = async () => {
      const audioUri = await getBestAudioUri(recording as Recording);
      setAudioUri(audioUri);
    };
    void loadAudioUri();
  }, [recording]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {recording.species?.common_name}
              </h1>
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
              {audioUri && (
                <MiniAudioPlayer
                  trackId={recording.id}
                  audioUri={audioUri}
                  title={recording.species?.common_name}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Video Player */}
        {recording.sonagramvideoid && (
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

            <div className="flex flex-col gap-2 text-sm">
              <div>
                <span className="font-medium text-foreground">Recording Number:</span>
                <span className="ml-2 text-muted-foreground">{recording.rec_number}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
