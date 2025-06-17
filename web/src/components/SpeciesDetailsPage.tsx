"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading species recordings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Species
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Species Details</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">No recordings found</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">🔍</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Recordings Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No recordings are available for this species.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1">
              {speciesInfo ? (
                <>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {speciesInfo.common_name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                    {speciesInfo.scientific_name}
                  </p>
                </>
              ) : (
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Species Details</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                {recordings.length} recording{recordings.length !== 1 ? "s" : ""}
              </span>
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
              <div
                key={recording.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRecordingClick(recording.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Audio Player */}
                  {audioUri && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <MiniAudioPlayer trackId={recording.id} audioUri={audioUri} size={40} />
                    </div>
                  )}

                  {/* Recording Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {recording.title}
                      </h3>
                      <PageBadge page={recording.book_page_number} />
                    </div>

                    {recording.caption && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                        {recording.caption}
                      </p>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <div className="text-gray-400">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
