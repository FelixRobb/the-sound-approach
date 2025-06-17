import { createClient } from "@supabase/supabase-js";
import type { Recording, Species } from "../types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchSpecies(): Promise<Species[]> {
  const { data, error } = await supabase.from("species").select("*").order("common_name");
  if (error) throw error;
  return data as Species[];
}

export async function fetchRecordingsBySpecies(speciesId: string): Promise<Recording[]> {
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("species_id", speciesId)
    .order("order_in_book");
  if (error) throw error;
  return data as Recording[];
}
