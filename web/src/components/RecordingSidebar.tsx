"use client";

import { Loader2, Music } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
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
    <div className="flex h-full flex-col space-y-2">
      {/* Search */}
      <div className="px-2">
        <Input
          placeholder="Search recordings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          <SidebarMenu>
            {filteredRecordings.slice(0, 50).map((rec) => (
              <SidebarMenuItem key={rec.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={`${rec.title} - Page ${rec.book_page_number}`}
                  size="sm"
                >
                  <Link
                    href={`/recording/${rec.id}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                  >
                    <Music className="h-3 w-3" />
                    <div className="flex flex-1 flex-col items-start min-w-0">
                      <span className="truncate text-xs font-medium">{rec.title}</span>
                      <div className="flex items-center gap-1 w-full">
                        {rec.species && (
                          <span className="truncate text-xs text-muted-foreground flex-1">
                            {rec.species.common_name}
                          </span>
                        )}
                        <Badge variant="outline" className="h-3 px-1 text-xs shrink-0">
                          {rec.book_page_number}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {filteredRecordings.length === 0 && !isLoading && (
              <div className="flex h-20 items-center justify-center">
                <p className="text-xs text-muted-foreground text-center">
                  {searchQuery ? "No recordings found" : "No recordings available"}
                </p>
              </div>
            )}
            {filteredRecordings.length > 50 && (
              <div className="px-2 py-1">
                <p className="text-xs text-muted-foreground text-center">
                  Showing first 50 of {filteredRecordings.length} recordings
                </p>
              </div>
            )}
          </SidebarMenu>
        )}
      </div>
    </div>
  );
}
