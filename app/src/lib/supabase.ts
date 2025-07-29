import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import type { Recording, Species } from "../types";
// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database functions
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
    .order("book_page_number", { ascending: true })
    .order("order_in_book", { ascending: true });

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
    .eq("species_id", speciesId)
    .order("order_in_book", { ascending: true });

  if (error) {
    throw error;
  }

  return data as Recording[];
};

export const fetchRecordingById = async (recordingId: string) => {
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
    .eq("id", recordingId)
    .single();

  if (error) {
    throw error;
  }

  return data as Recording;
};

export type SearchResults = {
  recordings: Recording[];
  species: Species[];
};

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
    // Call the PostgreSQL function for weighted search
    const { data, error } = await supabase.rpc("search_recordings", {
      search_query: sanitizedQuery,
    });

    if (error) {
      console.error("Search function error:", error);
      throw error;
    }

    // Process and separate results by type
    const recordings: Recording[] = [];
    const species: Species[] = [];

    // Define type for search result items
    type SearchResultItem = {
      result_type: "recording" | "species";
      result_data: Record<string, unknown>;
      relevance_score: number;
    };

    if (data) {
      data.forEach((item: SearchResultItem) => {
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
