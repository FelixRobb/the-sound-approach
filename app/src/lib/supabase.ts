// Polyfill fetch/URL APIs for React Native
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { AppState } from "react-native";

import type { Recording, Species } from "../types";
// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Initialise Supabase client following official React-Native guide
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage only on native platforms (Android/iOS)
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Ensure only a single refresh process runs at a time (required in RN)
    lock: processLock,
  },
});

// Register one global listener to control automatic token refresh based on
// the app's foreground/background state. This should only be added once.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
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
