"use client";

import { Upload, Loader2, AlertCircle, CheckCircle, File } from "lucide-react";
import { useState, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Recording } from "@/types";

interface FileUploaderProps {
  recording: Recording;
  onFileUploaded: (recording: Recording) => void;
}

export default function FileUploader({ recording, onFileUploaded }: FileUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaTypeOptions = [
    { value: "audiohqid", label: "High Quality Audio", accept: ".mp3,.wav" },
    { value: "audiolqid", label: "Low Quality Audio", accept: ".mp3,.wav" },
    { value: "sonagramvideoid", label: "Sonogram Video", accept: ".mp4" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
      setSuccess("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !mediaType) {
      setError("Please select a file and media type");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("recordingId", recording.id);
      formData.append("mediaType", mediaType);
      formData.append("recNumber", recording.rec_number.toString());

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 500);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Upload failed");
      }

      const { recording: updatedRecording } = (await response.json()) as { recording: Recording };
      onFileUploaded(updatedRecording);
      setSuccess("File uploaded successfully!");

      // Reset form
      setTimeout(() => {
        setIsOpen(false);
        setSelectedFile(null);
        setMediaType("");
        setUploadProgress(0);
        setSuccess("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileTypeLabel = (file: File) => {
    const type = file.type;
    if (type.startsWith("audio/")) return "Audio";
    if (type.startsWith("video/")) return "Video";
    return "File";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const selectedMediaTypeOption = mediaTypeOptions.find((opt) => opt.value === mediaType);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-xs">
          <Upload className="w-3 h-3 mr-1" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Media File</DialogTitle>
          <DialogDescription>
            Upload or replace media files for Recording #{recording.rec_number} -{" "}
            {recording.species?.common_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Media Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Media Type</label>
            <Select value={mediaType} onValueChange={setMediaType} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue placeholder="Select media type" />
              </SelectTrigger>
              <SelectContent>
                {mediaTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mediaType && selectedMediaTypeOption && (
              <p className="text-xs text-muted-foreground">
                Accepted formats: {selectedMediaTypeOption.accept}
              </p>
            )}
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select File</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={selectedMediaTypeOption?.accept || "*"}
                onChange={handleFileSelect}
                disabled={isUploading || !mediaType}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !mediaType}
                className="flex-1"
              >
                <File className="w-4 h-4 mr-2" />
                {selectedFile ? "Change File" : "Choose File"}
              </Button>
            </div>

            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getFileTypeLabel(selectedFile)} • {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleUpload()}
              disabled={!selectedFile || !mediaType || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </div>

          {/* File Naming Info */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">File Naming:</p>
            <p>
              Files will be saved as{" "}
              <code className="bg-background px-1 rounded">
                {recording.rec_number.toString().padStart(4, "0")}
                {mediaType === "sonagramvideoid" ? ".mp4" : ".mp3"}
              </code>{" "}
              in the appropriate storage bucket.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
