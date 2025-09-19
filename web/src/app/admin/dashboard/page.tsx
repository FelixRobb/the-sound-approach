"use client";

import { Shield, LogOut, Database, Music, Leaf, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import RecordingsTable from "@/components/admin/RecordingsTable";
import SpeciesTable from "@/components/admin/SpeciesTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recording, Species } from "@/types";

export default function AdminDashboard() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("recordings");
  const router = useRouter();

  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const [recordingsRes, speciesRes] = await Promise.all([
        fetch("/api/admin/recordings"),
        fetch("/api/admin/species"),
      ]);

      if (!recordingsRes.ok || !speciesRes.ok) {
        if (recordingsRes.status === 401 || speciesRes.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to load data");
      }

      const [recordingsData, speciesData] = await Promise.all([
        recordingsRes.json() as Promise<Recording[]>,
        speciesRes.json() as Promise<Species[]>,
      ]);

      setRecordings(recordingsData);
      setSpecies(speciesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  const reloadData = useCallback(async (): Promise<void> => {
    setIsReloading(true);
    setError("");

    try {
      const [recordingsRes, speciesRes] = await Promise.all([
        fetch("/api/admin/recordings"),
        fetch("/api/admin/species"),
      ]);

      if (!recordingsRes.ok || !speciesRes.ok) {
        if (recordingsRes.status === 401 || speciesRes.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to load data");
      }

      const [recordingsData, speciesData] = await Promise.all([
        recordingsRes.json() as Promise<Recording[]>,
        speciesRes.json() as Promise<Species[]>,
      ]);

      setRecordings(recordingsData);
      setSpecies(speciesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsReloading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleLogout = async (): Promise<void> => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/admin/login");
    }
  };

  const updateRecording = (updatedRecording: Recording): void => {
    setRecordings((prev) => prev.map((r) => (r.id === updatedRecording.id ? updatedRecording : r)));
  };

  const updateSpecies = (updatedSpecies: Species): void => {
    setSpecies((prev) => prev.map((s) => (s.id === updatedSpecies.id ? updatedSpecies : s)));
  };

  const addRecording = (newRecording: Recording): void => {
    setRecordings((prev) => [...prev, newRecording]);
  };
  const deleteRecording = (id: string): void => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const addSpecies = (newSpecies: Species): void => {
    setSpecies((prev) => [...prev, newSpecies]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Loading Admin Dashboard</h3>
            <p className="text-muted-foreground text-center">Fetching data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage recordings and species data</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => void handleLogout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recordings.length}</div>
              <p className="text-xs text-muted-foreground">
                {recordings.filter((r) => r.audiohqid || r.audiolqid).length} with audio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Species</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{species.length}</div>
              <p className="text-xs text-muted-foreground">Unique bird species</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Files</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recordings.filter((r) => r.sonagramvideoid).length}
              </div>
              <p className="text-xs text-muted-foreground">Sonagram videos</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="recordings" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Recordings
              <Badge variant="secondary">{recordings.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="species" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Species
              <Badge variant="secondary">{species.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recordings">
            <RecordingsTable
              recordings={recordings}
              species={species}
              onUpdate={updateRecording}
              onAdd={addRecording}
              onDelete={deleteRecording}
              onRefresh={() => void reloadData()}
              isReloading={isReloading}
            />
          </TabsContent>

          <TabsContent value="species">
            <SpeciesTable
              species={species}
              onUpdate={updateSpecies}
              onAdd={addSpecies}
              onRefresh={() => void reloadData()}
              isReloading={isReloading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
