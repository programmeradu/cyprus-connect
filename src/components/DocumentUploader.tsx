"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, File, Trash2, Image as ImageIcon, FileSpreadsheet, FileBarChart } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { toast } from "sonner";
import { BoltIcon, FireIcon, WaterIcon, RecycleIcon, CarbonIcon } from "@/components/icons/CustomIcons";
import { useTranslations, useLocale } from "next-intl";

interface DocumentUploaderProps {
  onDataExtracted: (data: {
    electricity?: number;
    gas?: number;
    water?: number;
    waste?: number;
    transport?: number;
  }) => void;
  onClose?: () => void;
}

interface UploadedDocument {
  id: string;
  file: File;
  status: "pending" | "processing" | "completed" | "error";
  extractedData?: {
    electricity?: number;
    gas?: number;
    water?: number;
    waste?: number;
    transport?: number;
  };
  error?: string;
  preview?: string;
}

interface ParsedData {
  electricity?: number;
  gas?: number;
  water?: number;
  waste?: number;
  transport?: number;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

export function DocumentUploader({ onDataExtracted, onClose }: DocumentUploaderProps) {
  const t = useTranslations("documentUploader");
  const locale = useLocale();
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aggregatedData, setAggregatedData] = useState<ParsedData | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addDocuments(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addDocuments(selectedFiles);
  }, []);

  const addDocuments = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValid = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type);
      if (!isValid) {
        toast.error(t("toasts.unsupported", { name: file.name }));
      }
      return isValid;
    });

    const newDocuments: UploadedDocument[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: "pending" as const,
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
    
    // Auto-process after adding
    setTimeout(() => processDocuments([...documents, ...newDocuments]), 100);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const processDocuments = async (docsToProcess: UploadedDocument[]) => {
    if (isProcessing || docsToProcess.length === 0) return;
    
    setIsProcessing(true);
    const pendingDocs = docsToProcess.filter(doc => doc.status === "pending");
    
    for (const doc of pendingDocs) {
      await processDocument(doc);
    }
    
    setIsProcessing(false);
    aggregateData();
  };

  const processDocument = async (doc: UploadedDocument) => {
    setDocuments(prev =>
      prev.map(d => (d.id === doc.id ? { ...d, status: "processing" as const } : d))
    );

    try {
      const formData = new FormData();
      formData.append("file", doc.file);

      const response = await fetch("/api/documents/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t("toasts.processingFailed"));
      }

      const result = await response.json();

      setDocuments(prev =>
        prev.map(d =>
          d.id === doc.id
            ? {
                ...d,
                status: "completed" as const,
                extractedData: result.data,
              }
            : d
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t("toasts.processingGenericFailed");
      setDocuments(prev =>
        prev.map(d =>
          d.id === doc.id
            ? {
                ...d,
                status: "error" as const,
                error: message,
              }
            : d
        )
      );
      toast.error(t("toasts.failedToProcess", { name: doc.file.name }));
    }
  };

  const aggregateData = () => {
    const completed = documents.filter(d => d.status === "completed" && d.extractedData);
    
    if (completed.length === 0) return;

    const aggregated: ParsedData = {};
    
    completed.forEach(doc => {
      if (doc.extractedData) {
        if (doc.extractedData.electricity) {
          aggregated.electricity = (aggregated.electricity || 0) + doc.extractedData.electricity;
        }
        if (doc.extractedData.gas) {
          aggregated.gas = (aggregated.gas || 0) + doc.extractedData.gas;
        }
        if (doc.extractedData.water) {
          aggregated.water = (aggregated.water || 0) + doc.extractedData.water;
        }
        if (doc.extractedData.waste) {
          aggregated.waste = (aggregated.waste || 0) + doc.extractedData.waste;
        }
        if (doc.extractedData.transport) {
          aggregated.transport = (aggregated.transport || 0) + doc.extractedData.transport;
        }
      }
    });

    setAggregatedData(aggregated);
  };

  const handleApplyData = () => {
    if (aggregatedData && Object.keys(aggregatedData).length > 0) {
      onDataExtracted(aggregatedData);
      toast.success(t("toasts.applied"));
      onClose?.();
    } else {
      toast.error(t("toasts.noData"));
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-5 h-5 text-primary" />;
    if (type.includes("image")) return <ImageIcon className="w-5 h-5 text-primary" />;
    if (type.includes("csv")) return <FileSpreadsheet className="w-5 h-5 text-primary" />;
    if (type.includes("excel") || type.includes("spreadsheet")) return <FileBarChart className="w-5 h-5 text-primary" />;
    return <File className="w-5 h-5 text-primary" />;
  };

  const allCompleted = documents.length > 0 && documents.every(d => d.status === "completed");
  const hasErrors = documents.some(d => d.status === "error");

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-strong rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all mb-6 ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <div>
              <p className="text-base font-medium mb-1">
                {t("dropHere")}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t("orBrowse")}
              </p>
            </div>

            <input
              type="file"
              accept={Object.values(ACCEPTED_FILE_TYPES).flat().join(",")}
              onChange={handleFileSelect}
              className="hidden"
              id="document-upload"
              multiple
            />
            <label htmlFor="document-upload">
              <PremiumButton size="sm" className="text-xs" type="button">
                <FileText className="w-3 h-3 mr-2" />
                {t("chooseFiles")}
              </PremiumButton>
            </label>

            <div className="text-xs text-muted-foreground mt-2">
              <p className="mb-1">{t("supportedFormats")}</p>
              <p className="text-[10px] text-muted-foreground/70">
                {t("supportedFormatsList")}
              </p>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold">{t("uploadedDocuments", { count: documents.length })}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border ${
                    doc.status === "completed"
                      ? "bg-primary/5 border-primary/20"
                      : doc.status === "error"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === "processing" && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {doc.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                      {doc.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="w-6 h-6 rounded hover:bg-destructive/10 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                  
                  {doc.error && (
                    <p className="text-xs text-destructive mt-2">{doc.error}</p>
                  )}
                  
                  {doc.extractedData && (
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs space-y-1">
                      {doc.extractedData.electricity && (
                        <div className="flex items-center gap-2">
                          <BoltIcon className="w-3 h-3 text-primary" />
                          <span>Electricity: {doc.extractedData.electricity.toLocaleString()} kWh</span>
                        </div>
                      )}
                      {doc.extractedData.gas && (
                        <div className="flex items-center gap-2">
                          <FireIcon className="w-3 h-3 text-primary" />
                          <span>Gas: {doc.extractedData.gas.toLocaleString()} m³</span>
                        </div>
                      )}
                      {doc.extractedData.water && (
                        <div className="flex items-center gap-2">
                          <WaterIcon className="w-3 h-3 text-primary" />
                          <span>Water: {doc.extractedData.water.toLocaleString()} L</span>
                        </div>
                      )}
                      {doc.extractedData.waste && (
                        <div className="flex items-center gap-2">
                          <RecycleIcon className="w-3 h-3 text-primary" />
                          <span>Waste: {doc.extractedData.waste.toLocaleString()} kg</span>
                        </div>
                      )}
                      {doc.extractedData.transport && (
                        <div className="flex items-center gap-2">
                          <CarbonIcon className="w-3 h-3 text-primary" />
                          <span>Transport: {doc.extractedData.transport.toLocaleString()} km</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Aggregated Results */}
        {aggregatedData && allCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold">Total Extracted Data</h3>
            </div>
            
            <div className="bg-background/50 rounded-lg p-4 space-y-3">
              {Object.entries(aggregatedData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                    {key === "electricity" && <><BoltIcon className="w-3.5 h-3.5" /> Electricity</>}
                    {key === "gas" && <><FireIcon className="w-3.5 h-3.5" /> Natural Gas</>}
                    {key === "water" && <><WaterIcon className="w-3.5 h-3.5" /> Water</>}
                    {key === "waste" && <><RecycleIcon className="w-3.5 h-3.5" /> Waste</>}
                    {key === "transport" && <><CarbonIcon className="w-3.5 h-3.5" /> Transportation</>}
                  </span>
                  <span className="text-sm font-medium">
                    {value.toLocaleString()}{" "}
                    {key === "electricity" && "kWh"}
                    {key === "gas" && "m³"}
                    {key === "water" && "L"}
                    {key === "waste" && "kg"}
                    {key === "transport" && "km"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {documents.length > 0 && (
          <div className="flex gap-3">
            <PremiumButton
              variant="outline"
              onClick={() => {
                setDocuments([]);
                setAggregatedData(null);
              }}
              className="flex-1 text-xs"
              disabled={isProcessing}
            >
              Clear All
            </PremiumButton>
            <PremiumButton
              onClick={handleApplyData}
              className="flex-1 text-xs"
              disabled={!allCompleted || isProcessing || !aggregatedData}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 mr-2" />
                  Apply to Calculator
                </>
              )}
            </PremiumButton>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            <strong>Smart Analysis:</strong> Our AI can extract data from various document formats, even custom layouts
          </p>
          <p className="text-xs text-muted-foreground">
            Upload monthly bills for: Electricity • Gas • Water • Waste • Transportation
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}