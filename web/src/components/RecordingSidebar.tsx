"use client";

import { Music, Search } from "lucide-react";
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
import type { Recording } from "@/types";

interface RecordingSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export default function RecordingSidebar({ onNavigate, collapsed = false }: RecordingSidebarProps) {
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

  if (collapsed) {
    // Show only music icons when collapsed
    return (
      <div className="flex flex-col space-y-1">
        <SidebarMenu>
          {filteredRecordings.slice(0, 10).map((rec) => (
            <SidebarMenuItem key={rec.id}>
              <SidebarMenuButton
                asChild
                tooltip={`${rec.title} - Page ${rec.book_page_number}${
                  rec.species ? ` (${rec.species.common_name})` : ""
                }`}
                className="hover:bg-muted/80 rounded-md transition-colors"
              >
                <Link
                  href={`/recording/${rec.id}`}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Music className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-2">
      {/* Search */}
      <div className="px-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/50 border-muted"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Loading recordings...</p>
            </div>
          </div>
        ) : (
          <SidebarMenu>
            {filteredRecordings.slice(0, 50).map((rec) => (
              <SidebarMenuItem key={rec.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={`${rec.title} - Page ${rec.book_page_number}`}
                  className="hover:bg-muted/80 rounded-md transition-colors"
                >
                  <Link
                    href={`/recording/${rec.id}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className="group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      <Music className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-1 flex-col items-start min-w-0 pl-2">
                      <span className="truncate text-xs font-medium hover:text-primary transition-colors">
                        {rec.title}
                      </span>
                      <div className="flex items-center gap-1 w-full">
                        {rec.species && (
                          <span className="truncate text-xs text-muted-foreground flex-1">
                            {rec.species.common_name}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[10px] shrink-0 bg-muted/50"
                        >
                          {rec.book_page_number}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {filteredRecordings.length === 0 && !isLoading && (
              <div className="flex flex-col h-20 items-center justify-center gap-2 p-4 m-2 rounded-lg bg-muted/30 border border-dashed border-muted">
                <Search className="h-4 w-4 text-muted-foreground opacity-50" />
                <p className="text-xs text-muted-foreground text-center">
                  {searchQuery ? "No recordings found" : "No recordings available"}
                </p>
              </div>
            )}
            {filteredRecordings.length > 50 && (
              <div className="px-3 py-2 mt-1">
                <p className="text-xs text-muted-foreground text-center bg-muted/30 rounded-md py-1">
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
