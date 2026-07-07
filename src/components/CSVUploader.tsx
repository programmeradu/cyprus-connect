"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

interface CSVUploaderProps {
  onDataExtracted: (data: {
    electricity?: number;
    gas?: number;
    water?: number;
    waste?: number;
    transport?: number;
  }) => void;
  onClose?: () => void;
}

interface ParsedData {
  electricity?: number;
  gas?: number;
  water?: number;
  waste?: number;
  transport?: number;
}

export function CSVUploader({ onDataExtracted, onClose }: CSVUploaderProps) {
  const t = useTranslations("csvUploader");
  const locale = useLocale();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
      processFile(droppedFile);
    } else {
      toast.error(t("toasts.invalidType"));
    }
  }, [t]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV file is empty or invalid");
      }

      const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
      const data: ParsedData = {};

      // Process each row and sum up values
      let electricityTotal = 0;
      let gasTotal = 0;
      let waterTotal = 0;
      let wasteTotal = 0;
      let transportTotal = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        
        headers.forEach((header, index) => {
          const value = parseFloat(values[index]) || 0;
          
          // Match common column names
          if (header.includes("electric") || header.includes("kwh")) {
            electricityTotal += value;
          } else if (header.includes("gas") || header.includes("m3") || header.includes("m³")) {
            gasTotal += value;
          } else if (header.includes("water") || header.includes("liter") || header.includes("litre")) {
            waterTotal += value;
          } else if (header.includes("waste") || header.includes("kg")) {
            wasteTotal += value;
          } else if (header.includes("transport") || header.includes("km") || header.includes("mile")) {
            transportTotal += value;
          }
        });
      }

      // Set parsed data
      if (electricityTotal > 0) data.electricity = electricityTotal;
      if (gasTotal > 0) data.gas = gasTotal;
      if (waterTotal > 0) data.water = waterTotal;
      if (wasteTotal > 0) data.waste = wasteTotal;
      if (transportTotal > 0) data.transport = transportTotal;

      if (Object.keys(data).length === 0) {
        throw new Error("No valid data found. Please check column names (electricity, gas, water, waste, transport)");
      }

      setParsedData(data);
      toast.success("CSV parsed successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse CSV";
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyData = () => {
    if (parsedData) {
      onDataExtracted(parsedData);
      toast.success("Data applied to calculator!");
      onClose?.();
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-strong rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Upload Utility Bills</h2>
            <p className="text-sm text-muted-foreground">
              Upload CSV files from utility bills for automatic data extraction
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
        {!file && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
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
                  Drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <PremiumButton size="sm" className="text-xs" type="button">
                  <FileText className="w-3 h-3 mr-2" />
                  Choose File
                </PremiumButton>
              </label>

              <div className="text-xs text-muted-foreground mt-2">
                <p className="mb-1">CSV format expected columns:</p>
                <code className="bg-muted px-2 py-1 rounded text-[10px]">
                  electricity, gas, water, waste, transport
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Processing your file...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isProcessing && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive mb-1">
                  Upload Failed
                </p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </div>
            <PremiumButton
              size="sm"
              variant="outline"
              className="mt-3 text-xs"
              onClick={handleReset}
            >
              Try Again
            </PremiumButton>
          </div>
        )}

        {/* Success State */}
        {parsedData && !isProcessing && !error && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary mb-1">
                      File Processed Successfully
                    </p>
                    <p className="text-xs text-primary/80">
                      {file?.name} • {Object.keys(parsedData).length} categories detected
                    </p>
                  </div>
                </div>

                {/* Extracted Data */}
                <div className="bg-background/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold mb-2">Extracted Data</h3>
                  {parsedData.electricity !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Electricity</span>
                      <span className="text-sm font-medium">
                        {parsedData.electricity.toLocaleString()} kWh
                      </span>
                    </div>
                  )}
                  {parsedData.gas !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Natural Gas</span>
                      <span className="text-sm font-medium">
                        {parsedData.gas.toLocaleString()} m³
                      </span>
                    </div>
                  )}
                  {parsedData.water !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Water</span>
                      <span className="text-sm font-medium">
                        {parsedData.water.toLocaleString()} L
                      </span>
                    </div>
                  )}
                  {parsedData.waste !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Waste</span>
                      <span className="text-sm font-medium">
                        {parsedData.waste.toLocaleString()} kg
                      </span>
                    </div>
                  )}
                  {parsedData.transport !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transportation</span>
                      <span className="text-sm font-medium">
                        {parsedData.transport.toLocaleString()} km
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <PremiumButton
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1 text-xs"
                >
                  Upload Different File
                </PremiumButton>
                <PremiumButton
                  onClick={handleApplyData}
                  className="flex-1 text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-2" />
                  Apply to Calculator
                </PremiumButton>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Example CSV Link */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Need help formatting your CSV?
          </p>
          <button
            onClick={() => {
              const csv = `electricity,gas,water,waste,transport
500,100,10000,200,1000
450,95,9500,180,950`;
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "utility_bills_example.csv";
              a.click();
              toast.success("Example CSV downloaded!");
            }}
            className="text-xs text-primary hover:underline"
          >
            Download Example CSV Template →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
