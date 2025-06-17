import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Sound Approach",
  description: "Web companion for The Sound Approach app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={cn(inter.className, "bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen")}
      >
        <header className="w-full border-b bg-white/80 backdrop-blur shadow-sm sticky top-0 z-30">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold tracking-tight">
                <Link href="/">The Sound Approach</Link>
              </h1>
              <nav className="hidden md:flex gap-2">
                <Button asChild variant="ghost">
                  <Link href="/">Home</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/search">Search</Link>
                </Button>
              </nav>
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Open menu">
                      <span className="material-symbols-outlined">menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <nav className="flex flex-col gap-4 mt-8">
                      <Link href="/" className="text-lg font-medium">
                        Home
                      </Link>
                      <Link href="/search" className="text-lg font-medium">
                        Search
                      </Link>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            <UserMenu />
          </div>
        </header>
        <main className="container mx-auto px-4 py-10 max-w-5xl">{children}</main>
      </body>
    </html>
  );
}
