"use client";

import ProfilePage from "@/components/ProfilePage";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function ProfileHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <>
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </>

      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Profile</h1>
      </div>
    </header>
  );
}

export default function Profile() {
  return (
    <div className="flex h-full flex-col">
      <ProfileHeader />
      <div className="flex-1">
        <ProfilePage />
      </div>
    </div>
  );
}
