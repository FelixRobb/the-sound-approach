"use client";

import { Search, Music, Leaf, Clock, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import MiniAudioPlayer from "./MiniAudioPlayer";
import PageBadge from "./PageBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

import { getBestAudioUri } from "@/lib/mediaUtils";
import { searchRecordings } from "@/lib/supabase";
import { debounce } from "@/lib/utils";
import { Recording, Species, SearchFilter } from "@/types";

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
        setRecentSearches(JSON.parse(saved));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  const saveRecentSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      const updated = [trimmedQuery, ...recentSearches.filter((s) => s !== trimmedQuery)].slice(
        0,
        10
      );

      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    },
    [recentSearches]
  );

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
      performSearch(debouncedQuery);
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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 space-y-6 border-b border-border bg-card/50">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Search</h1>
          <p className="text-muted-foreground">Find recordings and species</p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search species, recordings, or pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 text-lg h-12"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            >
              <X className="w-4 h-4" />
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
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="species">Species</TabsTrigger>
              <TabsTrigger value="recordings">Recordings</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {searchQuery ? (
          <>
            {isLoading ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Searching...</h3>
                  <p className="text-muted-foreground">Finding relevant content...</p>
                </div>
              </Card>
            ) : totalResults > 0 ? (
              <div className="space-y-6">
                {/* Results Summary */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {totalResults} result{totalResults !== 1 ? "s" : ""} for &quot;
                    {searchQuery}&quot;
                  </p>
                </div>

                {/* Species Results */}
                {filteredSpecies.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Leaf className="w-5 h-5" />
                      Species ({filteredSpecies.length})
                    </h2>
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
                              <Music className="w-4 h-4 mr-2" />
                              View recordings
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recording Results */}
                {filteredRecordings.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Recordings ({filteredRecordings.length})
                    </h2>
                    <div className="space-y-4">
                      {filteredRecordings.map((recording) => {
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
                                  <div
                                    className="flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
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
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or browse by category instead.
                  </p>
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
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Recent Searches
                    </CardTitle>
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
                        className="h-8"
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
                <CardTitle className="text-lg">Search Tips</CardTitle>
                <CardDescription>Get the most out of your search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Species names</p>
                    <p className="text-sm text-muted-foreground">
                      Search by common or scientific names (e.g., &quot;Robin&quot; or &quot;Turdus
                      migratorius&quot;)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Page numbers</p>
                    <p className="text-sm text-muted-foreground">
                      Find recordings by book page number (e.g., &quot;42&quot;)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Keywords</p>
                    <p className="text-sm text-muted-foreground">
                      Search recording titles and descriptions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
