"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Search species
    const { data: species } = await supabase
      .from("species")
      .select("*")
      .ilike("common_name", `%${query}%`);
    // Search recordings
    const { data: recordings } = await supabase
      .from("recordings")
      .select("*")
      .ilike("title", `%${query}%`);
    setResults([
      ...(species?.map((s) => ({ ...s, _type: "species" })) || []),
      ...(recordings?.map((r) => ({ ...r, _type: "recording" })) || []),
    ]);
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Search</h2>
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <Input
          placeholder="Search species or recordings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {results.map((item) =>
          item._type === "species" ? (
            <Card key={item.id} className="p-4">
              <div className="font-bold">{item.common_name}</div>
              <div className="text-gray-500 italic">{item.scientific_name}</div>
              <Link href={`/species/${item.id}`} className="underline text-blue-600">
                View Species
              </Link>
            </Card>
          ) : (
            <Card key={item.id} className="p-4">
              <div className="font-bold">{item.title}</div>
              <div className="text-gray-500 text-sm">Page {item.book_page_number}</div>
              <Link href={`/recordings/${item.id}`} className="underline text-blue-600">
                View Recording
              </Link>
            </Card>
          )
        )}
        {results.length === 0 && !loading && (
          <div className="col-span-full text-gray-500">No results found.</div>
        )}
      </div>
    </div>
  );
}
