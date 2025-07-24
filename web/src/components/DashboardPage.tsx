"use client";

import { Settings } from "lucide-react";

import RecordingsPage from "./RecordingsPage";

import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Header with page info */}
      <div className="border-b border-border/40 bg-muted/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Library</h1>
              <p className="text-sm text-muted-foreground">
                Browse recordings by book order or species
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <RecordingsPage />
      </div>
    </div>
  );
}
