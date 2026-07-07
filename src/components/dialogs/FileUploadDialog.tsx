"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, File, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";


interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  uploadSource: "manual" | "utility" | "accounting";
  title: string;
  description: string;
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
}

interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
}

export function FileUploadDialog({
  isOpen,
  onClose,
  uploadSource,
  title,
  description,
  acceptedFileTypes = [".csv", ".pdf", ".xlsx"],
  maxSizeMB = 10,
}: FileUploadDialogProps) {
  const t = useTranslations("shared.fileUpload");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = [];
    const maxSize = maxSizeMB * 1024 * 1024;

    Array.from(selectedFiles).forEach((file) => {
      // Validate file type
      const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!acceptedFileTypes.includes(fileExt)) {
        toast.error(`Invalid file type: ${file.name}. Accepted: ${acceptedFileTypes.join(", ")}`);
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name}. Max size: ${maxSizeMB}MB`);
        return;
      }

      newFiles.push({
        file,
        id: `${Date.now()}-${Math.random()}`,
        status: "pending",
        progress: 0,
      });
    });

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      // Auto-upload files
      newFiles.forEach((uploadedFile) => uploadFile(uploadedFile));
    }
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadedFile.id ? { ...f, status: "uploading", progress: 0 } : f
      )
    );

    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      // Convert file to base64
      const base64 = await fileToBase64(uploadedFile.file);

      // Upload file
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: base64.split(",")[1], // Remove data:... prefix
          fileName: uploadedFile.file.name,
          fileType: uploadedFile.file.name.split(".").pop()?.toLowerCase(),
          userId: parseInt(userId),
          uploadSource,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      // Set to processing status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: "processing", progress: 95 }
            : f
        )
      );

      // Wait for processing to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: "completed", progress: 100 }
            : f
        )
      );

      toast.success(`${uploadedFile.file.name} uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: "failed",
                progress: 0,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
      toast.error(`Failed to upload ${uploadedFile.file.name}`);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case "uploading":
        return `Uploading... ${file.progress}%`;
      case "processing":
        return "Processing...";
      case "completed":
        return "Completed";
      case "failed":
        return file.error || "Failed";
      default:
        return "Pending";
    }
  };

  const hasActiveUploads = files.some(
    (f) => f.status === "uploading" || f.status === "processing"
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
          >
            <div className="glass-strong rounded-2xl p-6 max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
                <button
                  onClick={onClose}
                  disabled={hasActiveUploads}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-all
                  ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Drop files here or{" "}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Accepted: {acceptedFileTypes.join(", ")} • Max {maxSizeMB}MB
                    </p>
                  </div>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="flex-1 overflow-y-auto space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(file.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.file.size / 1024).toFixed(1)} KB • {getStatusText(file)}
                          </p>
                          {(file.status === "uploading" || file.status === "processing") && (
                            <div className="mt-2 w-full h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        {file.status !== "uploading" && file.status !== "processing" && (
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </p>
                <button
                  onClick={onClose}
                  disabled={hasActiveUploads}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasActiveUploads ? "Uploading..." : "Done"}
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedFileTypes.join(",")}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
