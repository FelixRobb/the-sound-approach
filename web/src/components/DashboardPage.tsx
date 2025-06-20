"use client";

import clsx from "clsx";
import { Music, Search, User, Settings, Download, type LucideIcon } from "lucide-react";
import { useState } from "react";

import ProfilePage from "./ProfilePage";
import RecordingSidebar from "./RecordingSidebar";
import RecordingsPage from "./RecordingsPage";
import SearchPage from "./SearchPage";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

type TabType = "recordings" | "search" | "profile";

// Button used inside the Sidebar navigation.
function SidebarNavButton({
  tab,
  isActive,
  onSelect,
}: {
  tab: { id: TabType; label: string; icon: LucideIcon; description: string };
  isActive: boolean;
  onSelect: () => void;
}) {
  const { setOpen } = useSidebar();
  const Icon = tab.icon;

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      className={clsx(
        "w-full justify-start h-auto p-4 text-left",
        isActive && "bg-primary text-primary-foreground shadow-md"
      )}
      onClick={() => {
        onSelect();
        setOpen(false);
      }}
    >
      <div className="flex items-start space-x-3 w-full">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium">{tab.label}</div>
          <div
            className={clsx(
              "text-xs mt-1",
              isActive ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {tab.description}
          </div>
        </div>
      </div>
    </Button>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("recordings");

  const tabs = [
    {
      id: "recordings" as TabType,
      label: "Library",
      icon: Music,
      description: "Browse recordings by book order or species",
    },
    {
      id: "search" as TabType,
      label: "Search",
      icon: Search,
      description: "Find specific recordings and species",
    },
    {
      id: "profile" as TabType,
      label: "Profile",
      icon: User,
      description: "Manage your account and downloads",
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case "recordings":
        return <RecordingsPage />;
      case "search":
        return <SearchPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <RecordingsPage />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">The Sound Approach</h1>
              <p className="text-sm text-muted-foreground">Bird Sound Library</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            {tabs.map((tab) => (
              <SidebarNavButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onSelect={() => setActiveTab(tab.id)}
              />
            ))}
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Recordings</SidebarGroupLabel>
            <RecordingSidebar />
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-tertiary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Offline Ready</p>
                  <p className="text-xs text-muted-foreground">Download for offline use</p>
                </div>
                <Badge variant="default" className="text-xs">
                  Pro
                </Badge>
              </div>
            </CardContent>
          </Card>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Mobile Header */}
        <header className="lg:hidden bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SidebarTrigger />
              <div>
                <h1 className="font-semibold text-foreground">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {tabs.find((tab) => tab.id === activeTab)?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:block bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </h1>
              <p className="text-muted-foreground mt-1">
                {tabs.find((tab) => tab.id === activeTab)?.description}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full animate-in">{renderActiveTab()}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
