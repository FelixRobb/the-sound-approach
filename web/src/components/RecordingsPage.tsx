"use client";

import { Book, Search, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { getBestAudioUri } from "@/lib/mediaUtils";
import { fetchRecordingsByBookOrder, fetchSpecies } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Recording, Species } from "@/types";

import MiniAudioPlayer from "./MiniAudioPlayer";
import PageBadge from "./PageBadge";

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
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading recordings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library</h1>
          <p className="text-gray-600 dark:text-gray-400">Explore bird recordings and species</p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search recordings, species, or pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("recordings")}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
              activeTab === "recordings"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Book className="w-4 h-4 inline mr-2" />
            By Book Order
          </button>
          <button
            onClick={() => setActiveTab("species")}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
              activeTab === "species"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            By Species
          </button>
        </div>

        {/* Sort Controls for Recordings */}
        {activeTab === "recordings" && (
          <div className="mt-4 flex gap-2 flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="page">Sort by Page</option>
              <option value="title">Sort by Title</option>
              <option value="species">Sort by Species</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 dark:text-white"
            >
              {sortOrder === "asc" ? "↑" : "↓"} {sortOrder === "asc" ? "A→Z" : "Z→A"}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "recordings" ? (
          <div className="space-y-4">
            {filteredAndSortedRecordings.length === 0 ? (
              <div className="text-center py-12">
                <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No recordings found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? "Try adjusting your search terms" : "No recordings available"}
                </p>
              </div>
            ) : (
              filteredAndSortedRecordings.map((recording) => {
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
                      <PageBadge page={recording.book_page_number} />
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
                          <MiniAudioPlayer trackId={recording.id} audioUri={audioUri} size={38} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSpecies.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No species found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? "Try adjusting your search terms" : "No species available"}
                </p>
              </div>
            ) : (
              filteredSpecies.map((species) => (
                <div
                  key={species.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSpeciesClick(species.id)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {species.common_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {species.scientific_name}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
