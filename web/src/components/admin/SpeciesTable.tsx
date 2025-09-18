"use client";

import { Edit, Save, X, Plus, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Species } from "@/types";

interface SpeciesTableProps {
  species: Species[];
  onUpdate: (species: Species) => void;
  onAdd: (species: Species) => void;
  onRefresh: () => void;
}

export default function SpeciesTable({ species, onUpdate, onAdd, onRefresh }: SpeciesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Species>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSpecies, setNewSpecies] = useState<Partial<Species>>({
    common_name: "",
    scientific_name: "",
  });

  const startEdit = (species: Species) => {
    setEditingId(species.id);
    setEditData({ ...species });
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setError("");
    setSuccess("");
  };

  const saveEdit = async () => {
    if (!editingId || !editData) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/species", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editData }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to update species");
      }

      const updatedSpecies = (await response.json()) as Species;
      onUpdate(updatedSpecies);
      setEditingId(null);
      setEditData({});
      setSuccess("Species updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update species");
    } finally {
      setIsLoading(false);
    }
  };

  const addSpecies = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/species", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSpecies),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to create species");
      }

      const createdSpecies = (await response.json()) as Species;
      onAdd(createdSpecies);
      setShowAddDialog(false);
      setNewSpecies({
        common_name: "",
        scientific_name: "",
      });
      setSuccess("Species created successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create species");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Species Management</h2>
          <p className="text-muted-foreground">
            Edit species names and add new species to the database
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Species
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Species</DialogTitle>
              <DialogDescription>Create a new species entry in the database</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Common Name</label>
                <Input
                  value={newSpecies.common_name || ""}
                  onChange={(e) => setNewSpecies({ ...newSpecies, common_name: e.target.value })}
                  placeholder="e.g., European Robin"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Scientific Name</label>
                <Input
                  value={newSpecies.scientific_name || ""}
                  onChange={(e) =>
                    setNewSpecies({ ...newSpecies, scientific_name: e.target.value })
                  }
                  placeholder="e.g., Erithacus rubecula"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button onClick={() => void addSpecies()} disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Species
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Species Database</CardTitle>
          <CardDescription>{species.length} total species in the database</CardDescription>
          <Button variant="outline" onClick={() => void onRefresh()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Common Name</TableHead>
                  <TableHead>Scientific Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {species.map((speciesItem) => (
                  <TableRow key={speciesItem.id}>
                    <TableCell>
                      {editingId === speciesItem.id ? (
                        <Input
                          value={editData.common_name || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, common_name: e.target.value })
                          }
                          placeholder="Common name"
                        />
                      ) : (
                        <div className="font-medium">{speciesItem.common_name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === speciesItem.id ? (
                        <Input
                          value={editData.scientific_name || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, scientific_name: e.target.value })
                          }
                          placeholder="Scientific name"
                          type="datetime-local"
                        />
                      ) : (
                        <div className="italic text-muted-foreground">
                          {speciesItem.scientific_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {new Date(speciesItem.created_at).toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === speciesItem.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="default"
                            onClick={() => void saveEdit()}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={isLoading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => void startEdit(speciesItem)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
