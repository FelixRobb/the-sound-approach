"use client";

import { Book, Search, Loader2, AlertCircle, Music, Filter, ArrowUpDown, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import MiniAudioPlayer from "./MiniAudioPlayer";
import PageBadge from "./PageBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { getBestAudioUri } from "@/lib/mediaUtils";
import { fetchRecordingsByBookOrder, fetchSpecies } from "@/lib/supabase";
import type { Recording, Species } from "@/types";

type TabType = "recordings" | "species";
type SortBy = "page" | "title" | "species";
type SortOrder = "asc" | "desc";

export default function RecordingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("recordings");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("page");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [recordingsData, speciesData] = await Promise.all([
        fetchRecordingsByBookOrder(),
        fetchSpecies(),
      ]);

      setRecordings(recordingsData);
      setSpecies(speciesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingClick = (recordingId: string) => {
    router.push(`/recording/${recordingId}`);
  };

  const handleSpeciesClick = (speciesId: string) => {
    router.push(`/species/${speciesId}`);
  };

  // Filter and sort recordings
  const filteredAndSortedRecordings = recordings
    .filter((recording) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        recording.title.toLowerCase().includes(query) ||
        (recording.species?.common_name.toLowerCase().includes(query) ??
          recording.species?.scientific_name.toLowerCase().includes(query) ??
          recording.caption.toLowerCase().includes(query)) ||
        recording.book_page_number.toString().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "species":
          comparison = (a.species?.common_name ?? "").localeCompare(b.species?.common_name ?? "");
          break;
        case "page":
        default:
          comparison = a.book_page_number - b.book_page_number;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Filter species
  const filteredSpecies = species.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.common_name.toLowerCase().includes(query) || s.scientific_name.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Loading Library</h3>
            <p className="text-muted-foreground text-center">
              Fetching recordings and species data...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={loadData} variant="default">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search recordings, species, or page numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Tabs and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
              <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                <TabsTrigger value="recordings" className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  By Book Order
                </TabsTrigger>
                <TabsTrigger value="species" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  By Species
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sort Controls for Recordings */}
            {activeTab === "recordings" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortBy(sortBy === "page" ? "title" : sortBy === "title" ? "species" : "page")
                  }
                  className="h-8"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Sort by {sortBy === "page" ? "Page" : sortBy === "title" ? "Title" : "Species"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="h-8"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOrder === "asc" ? "A→Z" : "Z→A"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="recordings" className="space-y-4 mt-0">
              {filteredAndSortedRecordings.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center">
                    <Book className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No recordings found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : "No recordings available"}
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredAndSortedRecordings.map((recording) => {
                    const audioUri = getBestAudioUri(recording);

                    return (
                      <Card
                        key={recording.id}
                        className="group cursor-pointer transition-all duration-200 hover:shadow-md border border-border/50 hover:border-border"
                        onClick={() => handleRecordingClick(recording.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Audio Player */}
                            {audioUri && (
                              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <MiniAudioPlayer
                                  trackId={recording.id}
                                  audioUri={audioUri}
                                  size={44}
                                />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                                    {recording.title}
                                  </h3>
                                  {recording.species && (
                                    <p className="text-muted-foreground italic text-sm mt-1">
                                      {recording.species.scientific_name}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <PageBadge page={recording.book_page_number} />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {recording.species && (
                                  <Badge variant="secondary" className="text-xs">
                                    {recording.species.common_name}
                                  </Badge>
                                )}
                              </div>

                              {recording.caption && (
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                  {recording.caption}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="species" className="space-y-4 mt-0">
              {filteredSpecies.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No species found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : "No species available"}
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSpecies.map((species) => (
                    <Card
                      key={species.id}
                      className="group cursor-pointer transition-all duration-200 hover:shadow-md border border-border/50 hover:border-border"
                      onClick={() => handleSpeciesClick(species.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {species.common_name}
                        </CardTitle>
                        <CardDescription className="italic">
                          {species.scientific_name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Play className="h-4 w-4 mr-2" />
                          View recordings
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
