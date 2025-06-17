"use client";

import { Music, Search, User, Menu, X, Bell, Settings, Download } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import ProfilePage from "./ProfilePage";
import RecordingsPage from "./RecordingsPage";
import SearchPage from "./SearchPage";

type TabType = "recordings" | "search" | "profile";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("recordings");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-card border-r border-border transition-transform duration-300 ease-in-out
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">The Sound Approach</h1>
                <p className="text-sm text-muted-foreground">Bird Sound Library</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                className={`
                  w-full justify-start h-auto p-4 text-left
                  ${isActive ? "bg-primary text-primary-foreground shadow-md" : ""}
                `}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
              >
                <div className="flex items-start space-x-3 w-full">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{tab.label}</div>
                    <div
                      className={`text-xs mt-1 ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                    >
                      {tab.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-tertiary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Offline Ready</p>
                  <p className="text-xs text-muted-foreground">Download for offline use</p>
                </div>
                <Badge variant="tertiary" className="text-xs">
                  Pro
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
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
                <Bell className="w-5 h-5" />
              </Button>
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
                <Bell className="w-5 h-5" />
              </Button>
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
      </div>
    </div>
  );
}
