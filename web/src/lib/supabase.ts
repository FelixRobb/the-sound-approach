import type { Recording, Species, SearchResults } from "../types";

import { createClient } from "@/utils/supabase/client";

export const supabase = createClient();

// Database query functions
export const fetchRecordingsByBookOrder = async () => {
  const { data, error } = await supabase

    .from("recordings")
    .select(
      `
      *,
      species:species_id (
        id,
        common_name,
        scientific_name
      )
    `
    )
    .order("rec_number", { ascending: true });
  if (error) {
    throw error;
  }

  return data as Recording[];
};

export const fetchSpecies = async () => {
  const { data, error } = await supabase
    .from("species")
    .select("*")
    .order("common_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data as Species[];
};

export const fetchRecordingsBySpecies = async (speciesId: string) => {
  const { data, error } = await supabase
    .from("recordings")
    .select(
      `
      *,
      species:species_id (
        id,
        common_name,
        scientific_name
      )
    `
    )
    .eq("species_id", speciesId);

  if (error) {
    throw error;
  }

  return data as Recording[];
};

export const fetchRecordingById = async (recordingId: string) => {
  const result = await supabase
    .from("recordings")
    .select(
      `
      *,
      species:species_id (
        id,
        common_name,
        scientific_name
      )
    `
    )
    .eq("id", recordingId)
    .single();

  if (result.error) {
    throw result.error;
  }

  return result.data as Recording;
};

// Sanitize search query to prevent SQL injection
// Sanitize search query to prevent SQL injection
const sanitizeSearchQuery = (query: string): string => {
  // Remove any special characters that might be used for SQL injection
  return query.replace(/[%_'"\\[\]{}()*+?.,^$|#\s]/g, " ").trim();
};

export const searchRecordings = async (query: string): Promise<SearchResults> => {
  if (!query || query.trim() === "") {
    return { recordings: [], species: [] };
  }

  // Sanitize the search query
  const sanitizedQuery = sanitizeSearchQuery(query);
  if (!sanitizedQuery) {
    return { recordings: [], species: [] };
  }

  try {
    // Define type for search result items
    type SearchResultItem = {
      result_type: "recording" | "species";
      result_data: Record<string, unknown>;
      relevance_score: number;
    };

    // Call the PostgreSQL function for weighted search
    const result = await supabase.rpc("search_recordings", {
      search_query: sanitizedQuery,
    });

    if (result.error) {
      console.error("Search function error:", result.error);
      throw result.error;
    }

    // Process and separate results by type
    const recordings: Recording[] = [];
    const species: Species[] = [];

    if (result.data) {
      (result.data as SearchResultItem[]).forEach((item: SearchResultItem) => {
        if (item.result_type === "recording") {
          // Convert from JSONB to Recording type
          const recordingData = item.result_data as unknown as Recording;
          recordings.push(recordingData);
        } else if (item.result_type === "species") {
          // Convert from JSONB to Species type
          const speciesData = item.result_data as unknown as Species;
          species.push(speciesData);
        }
      });
    }

    return {
      recordings,
      species,
    };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};
