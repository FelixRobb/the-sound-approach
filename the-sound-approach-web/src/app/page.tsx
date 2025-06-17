"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, fetchSpecies } from "@/lib/supabase";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const [species, setSpecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/signin");
        return;
      }
      try {
        const data = await fetchSpecies();
        setSpecies(data);
      } catch (err: any) {
        setError("Failed to fetch species.");
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetch();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-8">Species</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {species.map((sp) => (
          <Card
            key={sp.id}
            className="rounded-xl shadow-md p-6 transition-transform hover:scale-[1.03] hover:shadow-lg bg-white/90 border border-gray-100 flex flex-col gap-2"
          >
            <Link href={`/species/${sp.id}`} className="block">
              <div className="font-bold text-lg mb-1 text-blue-900 group-hover:underline">
                {sp.common_name}
              </div>
              <div className="text-gray-500 italic text-sm mb-2">{sp.scientific_name}</div>
              <span className="inline-block text-blue-600 underline text-xs mt-2">
                View details
              </span>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
