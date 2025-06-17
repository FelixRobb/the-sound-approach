"use client";

import { Music, Search, User, Menu, X } from "lucide-react";
import { useState } from "react";

import ProfilePage from "./ProfilePage";
import RecordingsPage from "./RecordingsPage";
import SearchPage from "./SearchPage";

type TabType = "recordings" | "search" | "profile";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("recordings");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "recordings" as TabType, label: "Library", icon: Music },
    { id: "search" as TabType, label: "Search", icon: Search },
    { id: "profile" as TabType, label: "Profile", icon: User },
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            The Sound Approach
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <nav
          className={`
          ${isMobileMenuOpen ? "block" : "hidden"} lg:block
          w-full lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          lg:relative absolute top-0 left-0 z-40 h-full lg:h-auto
        `}
        >
          {/* Desktop Header */}
          <div className="hidden lg:block p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              The Sound Approach
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Explore bird recordings and species
            </p>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`}
                  />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">{renderActiveTab()}</main>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
