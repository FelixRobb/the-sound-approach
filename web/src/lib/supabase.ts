import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client for Server Components
export const createServerComponentClient = (cookies: () => any) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value;
      },
    },
  });

// Server-side Supabase client for Route Handlers
export const createRouteHandlerClient = (cookies: () => any) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookies().set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookies().set({ name, value: "", ...options });
      },
    },
  });

// Middleware Supabase client
export const createMiddlewareClient = (request: NextRequest) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: any) {
        request.cookies.set({
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

export const searchRecordings = async (query: string) => {
  if (!query || query.trim() === "") {
    return { recordings: [], species: [] };
  }

  const sanitizedQuery = sanitizeSearchQuery(query);
  if (!sanitizedQuery) {
    return { recordings: [], species: [] };
  }

  const searchTerm = `%${sanitizedQuery}%`;
  const supabase = createClient();

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
    let pageResults: any[] = [];
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
