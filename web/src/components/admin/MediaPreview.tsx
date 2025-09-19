"use client";

import { Play, Volume2, Eye, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Recording } from "@/types";

interface MediaPreviewProps {
  recording: Recording;
  mediaType: "audiohqid" | "audiolqid" | "sonagramvideoid";
  onFileUpdated: (recording: Recording) => void;
}

export default function MediaPreview({ recording, mediaType, onFileUpdated }: MediaPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const getMediaLabel = () => {
    switch (mediaType) {
      case "audiohqid":
        return "HQ Audio";
      case "audiolqid":
        return "LQ Audio";
      case "sonagramvideoid":
        return "Video";
      default:
        return "Media";
    }
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case "audiohqid":
      case "audiolqid":
        return <Volume2 className="w-3 h-3" />;
      case "sonagramvideoid":
        return <Play className="w-3 h-3" />;
      default:
        return <Eye className="w-3 h-3" />;
    }
  };

  const loadMediaUrl = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/upload`, {
        method: "POST",
        body: JSON.stringify({ recording, mediaType }),
      });
      const data = (await response.json()) as { signedUrl: string };

      if (!data.signedUrl) {
        throw new Error("Media file not found");
      }

      setMediaUrl(data.signedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!mediaUrl) {
      void loadMediaUrl();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/upload?recordingId=${recording.id}&mediaType=${mediaType}&recNumber=${recording.rec_number}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete file");
      }

      const { recording: updatedRecording } = (await response.json()) as { recording: Recording };
      onFileUpdated(updatedRecording);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const isVideo = mediaType === "sonagramvideoid";
  const isAudio = mediaType === "audiohqid" || mediaType === "audiolqid";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={handleOpen}>
          {getMediaIcon()}
          {getMediaLabel()}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getMediaIcon()}
            {getMediaLabel()} - Recording #{recording.rec_number}
          </DialogTitle>
          <DialogDescription>
            {recording.species?.common_name} ({recording.species?.scientific_name})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading media...</span>
            </div>
          ) : mediaUrl ? (
            <div className="space-y-4">
              {/* Media Player */}
              <div className="bg-black rounded-lg overflow-hidden">
                {isVideo ? (
                  <video controls className="w-full max-h-96" preload="metadata" src={mediaUrl}>
                    Your browser does not support the video tag.
                  </video>
                ) : isAudio ? (
                  <div className="p-4">
                    <audio controls className="w-full" preload="metadata" src={mediaUrl}>
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                ) : null}
              </div>

              {/* Media Info */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getMediaLabel()}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Recording #{recording.rec_number.toString().padStart(4, "0")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">File ID: {recording[mediaType]}</p>
                </div>

                {/* Delete Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete File
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">Media file not available</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
