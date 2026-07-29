"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { UtilityBillData, OCRResult } from '@/lib/ocr/types';
import { toast } from 'sonner';
import { EmptyState } from "@/components/app/shell";

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
          className={`app-card-inset flex flex-col items-center justify-center w-full min-h-32 px-4 py-4 border-dashed text-center ${
            state.loading ? "cursor-not-allowed" : "cursor-pointer hover:border-[var(--app-rule-strong)]"
          }`}
        >
          {state.loading ? (
            <p className="text-sm text-muted-foreground break-words">{t('processing')}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground break-words">{t('uploadCta')}</p>
              <p className="app-meta mt-1 break-words">{t('uploadHint')}</p>
            </>
          )}
        </label>
      </div>

      {/* Error Message */}
      {state.error && (
        <EmptyState tone="critical" title={t('error')} description={state.error} />
      )}

      {/* Success - Extracted Data */}
      {state.billData && (
        <div className="app-ledger">
          <div className="px-3 py-2.5">
            <p className="app-label">{t('extracted')}</p>
          </div>
          <div className="grid grid-cols-1 gap-y-2.5 px-3 py-2.5 sm:grid-cols-2 sm:gap-x-4">
            <div>
              <p className="app-meta break-words">{t('accountNumber')}</p>
              <p className="text-sm font-medium break-words">{state.billData.accountNumber || t('na')}</p>
            </div>
            <div>
              <p className="app-meta break-words">{t('utilityType')}</p>
              <p className="text-sm font-medium capitalize break-words">{state.billData.usageType}</p>
            </div>
            <div>
              <p className="app-meta break-words">{t('usageAmount')}</p>
              <p className="app-num text-sm font-medium break-words">
                {state.billData.usageAmount?.toFixed(2) || t('na')} {state.billData.usageUnit}
              </p>
            </div>
            <div>
              <p className="app-meta break-words">{t('totalAmount')}</p>
              <p className="app-num text-sm font-medium break-words">
                {state.billData.currency} {state.billData.totalAmount?.toFixed(2) || t('na')}
              </p>
            </div>
          </div>

          {state.billData.billingPeriodStart && (
            <div className="px-3 py-2.5">
              <p className="app-meta break-words">{t('billingPeriod')}</p>
              <p className="text-sm font-medium break-words">{state.billData.billingPeriodStart}</p>
            </div>
          )}
        </div>
      )}

      {/* OCR Result Details */}
      {state.ocrResult && state.ocrResult.text && (
        <details className="app-card group">
          <summary className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <span className="break-words">{t('viewRaw')}</span>
            {state.ocrResult.confidence && (
              <span className="app-meta ml-auto break-words">
                {t('confidence', { pct: (state.ocrResult.confidence * 100).toFixed(0) })}
              </span>
            )}
          </summary>
          <div className="border-t border-[var(--app-rule)] px-3 py-2.5 max-h-48 overflow-y-auto">
            <p className="text-xs whitespace-pre-wrap font-mono text-muted-foreground break-words">
              {state.ocrResult.text}
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
