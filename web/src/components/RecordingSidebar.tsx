"use client";

import { Loader2, Music } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { fetchRecordingsByBookOrder } from "@/lib/supabase";
import { Recording } from "@/types";

export default function RecordingSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { setOpen } = useSidebar();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchRecordingsByBookOrder();
        setRecordings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const filteredRecordings = recordings.filter((rec) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.title.toLowerCase().includes(q) ||
      (rec.species?.common_name?.toLowerCase().includes(q) ?? false) ||
      rec.book_page_number.toString().includes(q)
    );
  });

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="p-2">
        <Input
          placeholder="Search recordings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <nav className="grid gap-1 text-sm font-medium">
            {filteredRecordings.map((rec) => (
              <Link
                href={`/recording/${rec.id}`}
                key={rec.id}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
              >
                <Music className="h-4 w-4" />
                <span className="truncate flex-1">{rec.title}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
