"use client";

import { Music, Download, Volume2, Search, User, Library } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import RecordingSidebar from "./RecordingSidebar";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    if (pathname.includes("/search")) return "search";
    if (pathname.includes("/profile")) return "profile";
    return "recordings";
  };

  const currentTab = getCurrentTab();

  const handleNavigation = (tabId: string) => {
    switch (tabId) {
      case "recordings":
        router.push("/");
        break;
      case "search":
        router.push("/search");
        break;
      case "profile":
        router.push("/profile");
        break;
    }
  };

  const navigationItems = [
    {
      id: "recordings",
      title: "Library",
      icon: Library,
      description: "Browse recordings by book order or species",
    },
    {
      id: "search",
      title: "Search",
      icon: Search,
      description: "Find specific recordings and species",
    },
    {
      id: "profile",
      title: "Profile",
      icon: User,
      description: "Manage your account and settings",
    },
  ];

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-sm">
            <Volume2 className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight">The Sound Approach</h1>
            <p className="text-xs text-muted-foreground">Bird Sound Library</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentTab === item.id}
                    onClick={() => handleNavigation(item.id)}
                    tooltip={item.description}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="flex items-center gap-2">
            <Music className="h-3 w-3" />
            Quick Access
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <RecordingSidebar />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Card className="mx-2 mb-2 bg-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/20">
                <Download className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Offline Ready</p>
                <p className="text-xs text-muted-foreground">Download for offline use</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Pro
              </Badge>
            </div>
          </CardContent>
        </Card>
      </SidebarFooter>
    </Sidebar>
  );
}
