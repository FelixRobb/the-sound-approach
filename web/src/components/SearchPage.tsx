"use client";

import { Search, Music, Leaf, Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import { getBestAudioUri } from "@/lib/mediaUtils";
import { searchRecordings } from "@/lib/supabase";
import { debounce } from "@/lib/utils";
import { Recording, Species, SearchFilter } from "@/types";

import MiniAudioPlayer from "./MiniAudioPlayer";
import PageBadge from "./PageBadge";

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
          <p className="text-gray-600 dark:text-gray-400">Find recordings and species</p>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search species, recordings, or pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        {searchQuery && (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeFilter === "all"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("species")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeFilter === "species"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Species
            </button>
            <button
              onClick={() => setActiveFilter("recordings")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeFilter === "recordings"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Recordings
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {searchQuery ? (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600 dark:text-gray-400">Searching...</p>
                </div>
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We couldn&apos;t find any results for &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Results count */}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {totalResults} {totalResults === 1 ? "result" : "results"}
                </p>

                {/* Species Results */}
                {filteredSpecies.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Leaf className="w-5 h-5" />
                      Species
                    </h2>
                    <div className="space-y-3">
                      {filteredSpecies.map((species) => (
                        <div
                          key={species.id}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleSpeciesClick(species.id)}
                        >
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {species.common_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                            {species.scientific_name}
                          </p>
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-md">
                              <Leaf className="w-3 h-3" />
                              Species
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recordings Results */}
                {filteredRecordings.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Recordings
                    </h2>
                    <div className="space-y-3">
                      {filteredRecordings.map((recording) => {
                        const audioUri = getBestAudioUri(recording);

                        return (
                          <div
                            key={recording.id}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleRecordingClick(recording.id)}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                  {recording.title}
                                </h3>
                                {recording.species && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                    {recording.species.scientific_name}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <PageBadge page={recording.book_page_number} />
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                                  <Music className="w-3 h-3" />
                                  Recording
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex items-start gap-4">
                              <div className="flex-1 min-w-0">
                                {recording.species && (
                                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                                    {recording.species.common_name}
                                  </p>
                                )}
                                {recording.caption && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
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
                                    size={38}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Recent Searches */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Searches
              </h2>
              {recentSearches.length > 0 && (
                <button
                  onClick={clearRecentSearches}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {recentSearches.length > 0 ? (
              <div className="space-y-3">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
                  >
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="flex-1 text-gray-900 dark:text-white">{search}</span>
                    <Search className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Recent Searches
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your recent searches will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
