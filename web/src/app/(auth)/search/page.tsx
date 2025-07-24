"use client";

import SearchPage from "@/components/SearchPage";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function SearchHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <>
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Search</h1>
      </div>
    </header>
  );
}

export default function Search() {
  return (
    <div className="flex h-full flex-col">
      <SearchHeader />
      <div className="flex-1">
        <SearchPage />
      </div>
    </div>
  );
}
