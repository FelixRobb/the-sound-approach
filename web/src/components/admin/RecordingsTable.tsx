"use client";

import { Edit, Save, X, Plus, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

import FileUploader from "./FileUploader";
import MediaPreview from "./MediaPreview";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Recording, Species } from "@/types";

interface RecordingsTableProps {
  recordings: Recording[];
  species: Species[];
  onUpdate: (recording: Recording) => void;
  onAdd: (recording: Recording) => void;
  onRefresh: () => void;
}

export default function RecordingsTable({
  recordings,
  species,
  onUpdate,
  onAdd,
  onRefresh,
}: RecordingsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Recording>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRecording, setNewRecording] = useState<Partial<Recording>>({
    rec_number: 0,
    catalogue_code: "",
    site_name: "",
    caption: "",
    recorded_by: "",
    date_recorded: "",
    species_id: "",
  });

  const startEdit = (recording: Recording) => {
    setEditingId(recording.id);
    setEditData({ ...recording });
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
      const response = await fetch("/api/admin/recordings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editData }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to update recording");
      }

      const updatedRecording = (await response.json()) as Recording;
      onUpdate(updatedRecording);
      setEditingId(null);
      setEditData({});
      setSuccess("Recording updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update recording");
    } finally {
      setIsLoading(false);
    }
  };

  const addRecording = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecording),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to create recording");
      }

      const createdRecording = (await response.json()) as Recording;
      onAdd(createdRecording);
      setShowAddDialog(false);
      setNewRecording({
        rec_number: 0,
        catalogue_code: "",
        site_name: "",
        caption: "",
        recorded_by: "",
        date_recorded: "",
        species_id: "",
      });
      setSuccess("Recording created successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create recording");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploaded = (recording: Recording) => {
    onUpdate(recording);
    setSuccess("File uploaded successfully");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recordings Management</h2>
          <p className="text-muted-foreground">Edit recording details and manage media files</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Recording
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Recording</DialogTitle>
              <DialogDescription>Create a new recording entry in the database</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Recording Number</label>
                  <Input
                    type="number"
                    value={newRecording.rec_number || ""}
                    onChange={(e) =>
                      setNewRecording({
                        ...newRecording,
                        rec_number: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    placeholder="e.g., 1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Species</label>
                  <Select
                    value={newRecording.species_id || ""}
                    onValueChange={(value) =>
                      setNewRecording({ ...newRecording, species_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      {species.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.common_name} ({s.scientific_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Catalogue Code</label>
                  <Input
                    value={newRecording.catalogue_code || ""}
                    onChange={(e) =>
                      setNewRecording({ ...newRecording, catalogue_code: e.target.value })
                    }
                    placeholder="e.g., TSA001"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Site Name</label>
                  <Input
                    value={newRecording.site_name || ""}
                    onChange={(e) =>
                      setNewRecording({ ...newRecording, site_name: e.target.value })
                    }
                    placeholder="e.g., Wicken Fen"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Caption</label>
                <Textarea
                  value={newRecording.caption || ""}
                  onChange={(e) => setNewRecording({ ...newRecording, caption: e.target.value })}
                  placeholder="Recording description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Recorded By</label>
                  <Input
                    value={newRecording.recorded_by || ""}
                    onChange={(e) =>
                      setNewRecording({ ...newRecording, recorded_by: e.target.value })
                    }
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date Recorded</label>
                  <Input
                    value={newRecording.date_recorded || ""}
                    onChange={(e) =>
                      setNewRecording({ ...newRecording, date_recorded: e.target.value })
                    }
                    placeholder="e.g., 2023-05-15 08:30:00"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button onClick={() => void addRecording()} disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Recording
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
          <CardTitle>Recordings Database</CardTitle>
          <CardDescription>{recordings.length} total recordings in the database</CardDescription>
          <Button variant="outline" onClick={() => void onRefresh()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rec #</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Catalogue Code</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((recording) => (
                  <TableRow key={recording.id}>
                    <TableCell>
                      {editingId === recording.id ? (
                        <Input
                          type="number"
                          value={editData.rec_number || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              rec_number: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-20"
                        />
                      ) : (
                        <Badge variant="outline">{recording.rec_number}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === recording.id ? (
                        <Select
                          value={editData.species_id || ""}
                          onValueChange={(value) => setEditData({ ...editData, species_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {species.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.common_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          <div className="font-medium">{recording.species?.common_name}</div>
                          <div className="text-sm text-muted-foreground italic">
                            {recording.species?.scientific_name}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === recording.id ? (
                        <Input
                          value={editData.catalogue_code || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, catalogue_code: e.target.value })
                          }
                        />
                      ) : (
                        recording.catalogue_code
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === recording.id ? (
                        <Input
                          value={editData.site_name || ""}
                          onChange={(e) => setEditData({ ...editData, site_name: e.target.value })}
                        />
                      ) : (
                        recording.site_name
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {recording.audiohqid && (
                          <MediaPreview
                            recording={recording}
                            mediaType="audiohqid"
                            onFileUpdated={handleFileUploaded}
                          />
                        )}
                        {recording.audiolqid && (
                          <MediaPreview
                            recording={recording}
                            mediaType="audiolqid"
                            onFileUpdated={handleFileUploaded}
                          />
                        )}
                        {recording.sonagramvideoid && (
                          <MediaPreview
                            recording={recording}
                            mediaType="sonagramvideoid"
                            onFileUpdated={handleFileUploaded}
                          />
                        )}
                        <FileUploader recording={recording} onFileUploaded={handleFileUploaded} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingId === recording.id ? (
                        <Input
                          value={editData.recorded_by || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, recorded_by: e.target.value })
                          }
                        />
                      ) : (
                        recording.recorded_by
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === recording.id ? (
                        <Input
                          value={editData.date_recorded || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, date_recorded: e.target.value })
                          }
                          type="datetime-local"
                        />
                      ) : recording.date_recorded ? (
                        new Date(recording.date_recorded.replace(" ", "T")).toLocaleString()
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === recording.id ? (
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
                        <Button size="icon" variant="outline" onClick={() => startEdit(recording)}>
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
