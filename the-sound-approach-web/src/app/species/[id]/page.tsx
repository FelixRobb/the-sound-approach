"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, fetchRecordingsBySpecies } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function SpeciesPage() {
  const params = useParams();
  const router = useRouter();
  const [species, setSpecies] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/signin");
        return;
      }
      try {
        // Fetch species by id
        const { data: speciesList, error: speciesError } = await supabase
          .from("species")
          .select("*")
          .eq("id", params.id)
          .single();
        if (speciesError) throw speciesError;
        setSpecies(speciesList);
        // Fetch recordings for this species
        const recs = await fetchRecordingsBySpecies(params.id as string);
        setRecordings(recs);
      } catch (err: any) {
        setError("Failed to fetch species or recordings.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!species) return <div className="text-center text-red-500">Species not found.</div>;

  return (
    <div>
      <Card className="mb-8 p-6 bg-white/90 border border-gray-100 shadow rounded-xl">
        <h2 className="text-2xl font-bold mb-1 text-blue-900">{species.common_name}</h2>
        <div className="text-gray-500 italic mb-2 text-lg">{species.scientific_name}</div>
      </Card>
      <h3 className="text-xl font-semibold mb-4">Recordings</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recordings.map((rec) => (
          <Card
            key={rec.id}
            className="p-5 rounded-xl shadow-md bg-white/90 border border-gray-100 flex flex-col gap-2 transition-transform hover:scale-[1.03] hover:shadow-lg"
          >
            <div className="font-semibold text-blue-900 mb-1">{rec.title}</div>
            <div className="text-gray-500 text-sm">Page {rec.book_page_number}</div>
            <div className="text-gray-700 text-sm line-clamp-2 mb-2">{rec.caption}</div>
            <Link
              href={`/recordings/${rec.id}`}
              className="mt-auto underline text-blue-600 text-xs"
            >
              View Details
            </Link>
          </Card>
        ))}
        {recordings.length === 0 && (
          <div className="col-span-full text-gray-500">No recordings found for this species.</div>
        )}
      </div>
    </div>
  );
}
