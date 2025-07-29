import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { NextRequest, NextResponse } from "next/server";

import type { Recording, Species, SearchResults } from "../types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Client-side Supabase client
export const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client for Server Components
export const createServerComponentClient = (cookies: () => ReadonlyRequestCookies) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value;
      },
    },
  });

// Server-side Supabase client for Route Handlers
export const createRouteHandlerClient = (cookies: () => ReadonlyRequestCookies) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookies().set({ name, value, ...options });
      },
      remove(name: string, options: Record<string, unknown>) {
        cookies().set({ name, value: "", ...options });
      },
    },
  });

// Middleware Supabase client
export const createMiddlewareClient = (request: NextRequest, response: NextResponse) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: Record<string, unknown>) {
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

// Default export for client-side usage
export default createClient();

// Database query functions
export const fetchRecordingsByBookOrder = async () => {
  const supabase = createClient();
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

  return data;
};

export const fetchSpecies = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("species")
    .select("*")
    .order("common_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

export const fetchRecordingsBySpecies = async (speciesId: string) => {
  const supabase = createClient();
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

  return data;
};

export const fetchRecordingById = async (recordingId: string) => {
  const supabase = createClient();
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

  return data;
};

// Sanitize search query to prevent SQL injection
const sanitizeSearchQuery = (query: string): string => {
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

  const supabase = createClient();

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
