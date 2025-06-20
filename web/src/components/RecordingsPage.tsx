"use client";

import { Book, Search, Loader2, AlertCircle, Music, Filter, ArrowUpDown, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { getBestAudioUri } from "@/lib/mediaUtils";
import { fetchRecordingsByBookOrder, fetchSpecies } from "@/lib/supabase";
import { Recording, Species } from "@/types";

import MiniAudioPlayer from "./MiniAudioPlayer";
import PageBadge from "./PageBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

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
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
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
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
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
    <div className="h-full flex flex-col bg-background">
      {/* Header Controls */}
      <div className="p-6 space-y-6 border-b border-border bg-card/50">
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search recordings, species, or page numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === "recordings" ? "default" : "ghost"}
            onClick={() => setActiveTab("recordings")}
            className="flex-1 h-10"
          >
            <Book className="w-4 h-4 mr-2" />
            By Book Order
          </Button>
          <Button
            variant={activeTab === "species" ? "default" : "ghost"}
            onClick={() => setActiveTab("species")}
            className="flex-1 h-10"
          >
            <Music className="w-4 h-4 mr-2" />
            By Species
          </Button>
        </div>

        {/* Sort Controls for Recordings */}
        {activeTab === "recordings" && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortBy(sortBy === "page" ? "title" : sortBy === "title" ? "species" : "page")
              }
            >
              <Filter className="w-4 h-4 mr-2" />
              Sort by {sortBy === "page" ? "Page" : sortBy === "title" ? "Title" : "Species"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortOrder === "asc" ? "A→Z" : "Z→A"}
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "recordings" ? (
          <div className="space-y-4">
            {filteredAndSortedRecordings.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      onClick={() => handleRecordingClick(recording.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {recording.title}
                            </CardTitle>
                            {recording.species && (
                              <CardDescription className="italic mt-1">
                                {recording.species.scientific_name}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <PageBadge page={recording.book_page_number} />
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            {recording.species && (
                              <Badge variant="secondary" className="mb-2">
                                {recording.species.common_name}
                              </Badge>
                            )}
                            {recording.caption && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {recording.caption}
                              </p>
                            )}
                          </div>

                          {/* Audio Player */}
                          {audioUri && (
                            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <MiniAudioPlayer
                                trackId={recording.id}
                                audioUri={audioUri}
                                size={40}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSpecies.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No species found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search terms" : "No species available"}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSpecies.map((species) => (
                  <Card
                    key={species.id}
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => handleSpeciesClick(species.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {species.common_name}
                      </CardTitle>
                      <CardDescription className="italic">
                        {species.scientific_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Play className="w-4 h-4 mr-2" />
                        View recordings
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
