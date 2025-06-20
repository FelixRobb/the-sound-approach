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
    autoRefreshToken: true,
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

  const searchTerm = `%${sanitizedQuery}%`;

  try {
    // Search for species by common name or scientific name
    const { data: speciesData, error: speciesError } = await supabase
      .from("species")
      .select(
        `
        id,
        common_name,
        scientific_name,
        created_at
      `
      )
      .or(`common_name.ilike.${searchTerm},scientific_name.ilike.${searchTerm}`)
      .order("common_name", { ascending: true });

    if (speciesError) {
      console.error("Species search error:", speciesError);
      throw speciesError;
    }

    // Search recordings by title and caption
    const { data: recordingsData, error: recordingsError } = await supabase
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
      .or(`title.ilike.${searchTerm},caption.ilike.${searchTerm}`)
      .order("book_page_number", { ascending: true });

    if (recordingsError) {
      console.error("Recordings search error:", recordingsError);
      throw recordingsError;
    }

    // Search for book page numbers if the query is numeric
    let pageResults: Recording[] = [];
    if (/^\d+$/.test(sanitizedQuery)) {
      const { data: pageData, error: pageError } = await supabase
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
        .eq("book_page_number", parseInt(sanitizedQuery, 10))
        .order("order_in_book", { ascending: true });

      if (!pageError && pageData) {
        pageResults = pageData;
      }
    }

    // Combine and deduplicate recording results
    const allRecordings = [...(recordingsData || []), ...pageResults];
    const recordingIds = new Set();
    const uniqueRecordings = allRecordings.filter((recording) => {
      if (recordingIds.has(recording.id)) {
        return false;
      }
      recordingIds.add(recording.id);
      return true;
    });

    // Sort recordings by book page number and then by order in book
    const sortedRecordings = uniqueRecordings.sort((a, b) => {
      if (a.book_page_number === b.book_page_number) {
        return a.order_in_book - b.order_in_book;
      }
      return a.book_page_number - b.book_page_number;
    });

    return {
      recordings: sortedRecordings,
      species: speciesData || [],
    };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};
