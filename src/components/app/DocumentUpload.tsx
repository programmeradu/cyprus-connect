"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { UtilityBillData, OCRResult } from '@/lib/ocr/types';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface UploadState {
  loading: boolean;
  error: string | null;
  ocrResult: OCRResult | null;
  billData: UtilityBillData | null;
  documentId?: number;
}

export function DocumentUpload({ onUploadComplete }: { onUploadComplete?: (data: UtilityBillData) => void }) {
  const t = useTranslations('documentUpload');
  const [state, setState] = useState<UploadState>({
    loading: false,
    error: null,
    ocrResult: null,
    billData: null,
  });

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setState({ loading: true, error: null, ocrResult: null, billData: null });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const userId = localStorage.getItem('user_id');
      const headers: HeadersInit = { };
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const response = await fetch('/api/ocr/parse', {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      setState({
        loading: false,
        error: null,
        ocrResult: data.ocrResult,
        billData: data.billData,
        documentId: data.documentId,
      });

      toast.success(t('success'));

      if (onUploadComplete && data.billData) {
        onUploadComplete(data.billData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('unknownError');
      setState({
        loading: false,
        error: errorMessage,
        ocrResult: null,
        billData: null,
      });
      toast.error(t('failed', { msg: errorMessage }));
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          accept=".pdf,image/jpeg,image/png,image/jpg"
          onChange={handleFileChange}
          disabled={state.loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full min-h-32 px-4 py-3 border-2 border-dashed rounded-xl transition-colors text-center ${
            state.loading
              ? 'border-muted bg-muted/20 cursor-not-allowed'
              : 'border-border hover:border-primary bg-background cursor-pointer'
          }`}
        >
          {state.loading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground break-words">{t('processing')}</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground break-words">{t('uploadCta')}</p>
              <p className="text-xs text-muted-foreground mt-1 break-words">{t('uploadHint')}</p>
            </>
          )}
        </label>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-destructive">{t('error')}</p>
            <p className="text-xs text-destructive/80 break-words">{state.error}</p>
          </div>
        </div>
      )}

      {/* Success - Extracted Data */}
      {state.billData && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground break-words">{t('extracted')}</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground break-words">{t('accountNumber')}</p>
              <p className="text-sm font-medium break-words">{state.billData.accountNumber || t('na')}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground break-words">{t('utilityType')}</p>
              <p className="text-sm font-medium capitalize break-words">{state.billData.usageType}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground break-words">{t('usageAmount')}</p>
              <p className="text-sm font-medium break-words">
                {state.billData.usageAmount?.toFixed(2) || t('na')} {state.billData.usageUnit}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground break-words">{t('totalAmount')}</p>
              <p className="text-sm font-medium break-words">
                {state.billData.currency} {state.billData.totalAmount?.toFixed(2) || t('na')}
              </p>
            </div>
          </div>

          {state.billData.billingPeriodStart && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground break-words">{t('billingPeriod')}</p>
              <p className="text-sm font-medium break-words">{state.billData.billingPeriodStart}</p>
            </div>
          )}
        </div>
      )}

      {/* OCR Result Details */}
      {state.ocrResult && state.ocrResult.text && (
        <details className="group">
          <summary className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">{t('viewRaw')}</span>
            <span className="ml-auto text-xs break-words">
              {state.ocrResult.confidence && t('confidence', { pct: (state.ocrResult.confidence * 100).toFixed(0) })}
            </span>
          </summary>
          <div className="mt-2 p-3 rounded-lg bg-muted/30 max-h-48 overflow-y-auto">
            <p className="text-xs whitespace-pre-wrap font-mono text-foreground/80 break-words">
              {state.ocrResult.text}
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
