"use client";

import { Search, Music, Leaf, Clock, Loader2, X, Hash, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import MiniAudioPlayer from "./MiniAudioPlayer";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

import { getBestAudioUri } from "@/lib/mediaUtils";
import { searchRecordings } from "@/lib/supabase";
import { debounce } from "@/lib/utils";
import type { Recording, Species, SearchFilter } from "@/types";

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Debounce search query
  useEffect(() => {
    const debouncedSearch = debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300);

    debouncedSearch(searchQuery);
  }, [searchQuery]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved) as string[]);
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  const saveRecentSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setRecentSearches((prev) => {
      const updated = [trimmedQuery, ...prev.filter((s) => s !== trimmedQuery)].slice(0, 10);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const performSearch = useCallback(
    async (query: string) => {
      setIsLoading(true);

      try {
        const results = await searchRecordings(query);
        setRecordings(results.recordings);
        setSpecies(results.species);

        // Save to recent searches
        saveRecentSearch(query);
      } catch (error) {
        console.error("Search error:", error);
        setRecordings([]);
        setSpecies([]);
      } finally {
        setIsLoading(false);
      }
    },
    [saveRecentSearch]
  );

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      void performSearch(debouncedQuery);
    } else {
      setRecordings([]);
      setSpecies([]);
    }
  }, [debouncedQuery, performSearch]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
  };

  const handleRecordingClick = (recordingId: string) => {
    router.push(`/recording/${recordingId}`);
  };

  const handleSpeciesClick = (speciesId: string) => {
    router.push(`/species/${speciesId}`);
  };

  // Filter results based on active filter
  const filteredResults = () => {
    switch (activeFilter) {
      case "recordings":
        return { recordings, species: [] };
      case "species":
        return { recordings: [], species };
      default:
        return { recordings, species };
    }
  };

  const { recordings: filteredRecordings, species: filteredSpecies } = filteredResults();
  const totalResults = filteredRecordings.length + filteredSpecies.length;

  return (
    <div className="flex h-full flex-col">
      {/* Search Controls */}
      <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search species, recordings, or pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 text-base h-10 bg-background"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          {searchQuery && (
            <Tabs
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value as SearchFilter)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
                <TabsTrigger value="species">Species ({filteredSpecies.length})</TabsTrigger>
                <TabsTrigger value="recordings">
                  Recordings ({filteredRecordings.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {searchQuery ? (
            <>
              {isLoading ? (
                <Card className="p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Searching...</h3>
                    <p className="text-muted-foreground">Finding relevant content...</p>
                  </div>
                </Card>
              ) : totalResults > 0 ? (
                <div className="space-y-8">
                  {/* Species Results */}
                  {filteredSpecies.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/20">
                          <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-semibold">
                          Species ({filteredSpecies.length})
                        </h2>
                      </div>
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
                                <Music className="h-4 w-4 mr-2" />
                                View recordings
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Separator */}
                  {filteredSpecies.length > 0 && filteredRecordings.length > 0 && <Separator />}

                  {/* Recording Results */}
                  {filteredRecordings.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/20">
                          <Music className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold">
                          Recordings ({filteredRecordings.length})
                        </h2>
                      </div>
                      <div className="space-y-4">
                        {filteredRecordings.map(async (recording) => {
                          const audioUri = await getBestAudioUri(recording);

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
                                    <div
                                      className="flex-shrink-0"
                                      onPointerDown={(e) => e.preventDefault()}
                                    >
                                      <MiniAudioPlayer
                                        trackId={recording.id}
                                        audioUri={audioUri || ""}
                                        title={recording.species?.common_name}
                                        size={44}
                                      />
                                    </div>
                                  )}

                                  {/* Content */}
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                                          {recording.species?.common_name}
                                        </h3>
                                        {recording.species && (
                                          <p className="text-muted-foreground italic text-sm mt-1">
                                            {recording.species.scientific_name}
                                          </p>
                                        )}
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
                    </div>
                  )}
                </div>
              ) : (
                <Card className="p-12">
                  <div className="text-center">
                    <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search terms or browse by category instead.
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear search
                    </Button>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/20">
                          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <CardTitle className="text-lg">Recent Searches</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearRecentSearches}>
                        Clear all
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleRecentSearchClick(search)}
                          className="h-8 text-sm"
                        >
                          {search}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search Tips */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/20">
                      <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Search Tips</CardTitle>
                      <CardDescription>Get the most out of your search</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                        <Leaf className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Species names</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Search by common or scientific names
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                        <Hash className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Page numbers</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Find recordings by book page
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                        <Search className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Keywords</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Search titles and descriptions
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
