import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { generateSustainabilityReport, ReportData } from '@/lib/pdf/export-report';

export function ExportReportButton({
  userId,
  analyticsData,
  companyName = "Your company",
}: {
  userId?: string;
  analyticsData?: any;
  companyName?: string;
}) {
  const t = useTranslations('shared.exportReport');
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);

    try {
      const userIdToUse = userId || localStorage.getItem('user_id');

      // Attempt server export if we have credentials
      let generatedOnServer = false;
      if (userIdToUse) {
        try {
          const response = await fetch('/api/reports/export-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}`
            },
            body: JSON.stringify({ userId: userIdToUse }),
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vuneli-analytics-report-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            generatedOnServer = true;
            toast.success(t('success'));
          }
        } catch {
          // Fall through to client-side generator if server route is unavailable
        }
      }

      if (!generatedOnServer) {
        // Client-side fallback uses only the figures on screen. With no
        // recorded figures there is nothing honest to export.
        if (!analyticsData?.metrics || !analyticsData?.emissionsBreakdown) {
          toast.error(t('noData'));
          return;
        }
        const now = new Date();
        const total: number = analyticsData.metrics.totalEmissions.value;
        const fallbackData: ReportData = {
          companyName,
          reportDate: now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
          periodYear: analyticsData.currentPeriod?.year ?? now.getFullYear(),
          periodMonth: analyticsData.currentPeriod?.month ?? now.getMonth() + 1,
          totalEmissions: total,
          yoyChange: analyticsData.metrics.totalEmissions.change ?? null,
          emissionsBreakdown: analyticsData.emissionsBreakdown,
          monthlyTrend: analyticsData.monthlyTrend ?? [],
          industryComparison: analyticsData.industryComparison ?? null,
          insights: {
            observations: [`Recorded emissions for the latest month: ${total.toFixed(2)} tonnes CO2e (published reference factors).`],
            recommendations: [],
            highlights: [],
            risks: [],
          },
        };

        const doc = generateSustainabilityReport(fallbackData);
        doc.save(`vuneli-analytics-report-${Date.now()}.pdf`);
        toast.success(t('success'));
      }
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
      className="vck-btn vck-btn-primary"
    >
      {isExporting ? t('loading') : t('idle')}
    </button>
  );
}
