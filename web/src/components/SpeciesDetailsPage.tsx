"use client";

import { ArrowLeft, AlertCircle, Loader2, Search, Music } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { SidebarTrigger } from "./ui/sidebar";

import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import PageBadge from "@/components/PageBadge";
import { getBestAudioUri } from "@/lib/mediaUtils";
import { fetchRecordingsBySpecies } from "@/lib/supabase";
import { Recording } from "@/types";

export default function SpeciesDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const speciesId = params?.speciesId as string;

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speciesInfo, setSpeciesInfo] = useState<{
    common_name: string;
    scientific_name: string;
  } | null>(null);

  // Load recordings for this species
  useEffect(() => {
    const loadRecordings = async () => {
      if (!speciesId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await fetchRecordingsBySpecies(speciesId);
        setRecordings(data);

        // Extract species info from the first recording
        if (data.length > 0 && data[0].species) {
          setSpeciesInfo({
            common_name: data[0].species.common_name,
            scientific_name: data[0].species.scientific_name,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recordings");
      } finally {
        setLoading(false);
      }
    };

    loadRecordings();
  }, [speciesId]);

  const handleBack = () => {
    router.back();
  };

  const handleRecordingClick = (recordingId: string) => {
    router.push(`/recording/${recordingId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Loading Species</h3>
            <p className="text-muted-foreground text-center">Fetching species recordings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Species</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={handleBack} variant="default">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">Species Details</h1>
                <p className="text-muted-foreground text-sm">No recordings found</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="w-96">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Search className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recordings Found</h3>
              <p className="text-muted-foreground text-center">
                No recordings are available for this species.
              </p>
            </CardContent>
          </Card>
        </div>
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
              {speciesInfo ? (
                <>
                  <h1 className="text-xl font-bold text-foreground truncate">
                    {speciesInfo.common_name}
                  </h1>
                  <p className="text-muted-foreground text-sm italic truncate">
                    {speciesInfo.scientific_name}
                  </p>
                </>
              ) : (
                <h1 className="text-xl font-bold text-foreground">Species Details</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {recordings.length} recording{recordings.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-4">
          {recordings.map((recording) => {
            const audioUri = getBestAudioUri(recording);

            return (
              <Card
                key={recording.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRecordingClick(recording.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Audio Player */}
                    {audioUri && (
                      <div className="flex-shrink-0">
                        <MiniAudioPlayer
                          trackId={recording.id}
                          audioUri={audioUri}
                          title={recording.title}
                          size={40}
                        />
                      </div>
                    )}

                    {/* Recording Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {recording.title}
                        </h3>
                        <PageBadge page={recording.book_page_number} />
                      </div>

                      {recording.caption && (
                        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                          {recording.caption}
                        </p>
                      )}
                    </div>

                    {/* Recording Icon */}
                    <Music className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
