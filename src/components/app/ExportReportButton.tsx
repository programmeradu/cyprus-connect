"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function ExportReportButton({ userId }: { userId?: string }) {
  const t = useTranslations('shared.exportReport');
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);

    try {
      const userIdToUse = userId || localStorage.getItem('user_id');

      if (!userIdToUse) {
        toast.error(t('noUser'));
        setIsExporting(false);
        return;
      }

      const response = await fetch('/api/reports/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
        },
        body: JSON.stringify({ userId: userIdToUse }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('failed'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vuneli-analytics-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('success'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : t('failed'));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="app-btn"
    >
      {isExporting ? t('loading') : t('idle')}
    </button>
  );
}
