import jsPDF from 'jspdf';

export interface ReportData {
  companyName: string;
  reportDate: string;
  periodYear: number;
  periodMonth: number;
  totalEmissions: number;
  yoyChange: number;
  emissionsBreakdown: {
    electricity: { value: number; percentage: number };
    gas: { value: number; percentage: number };
    transportation: { value: number; percentage: number };
    other: { value: number; percentage: number };
  };
  monthlyTrend: Array<{ month: string; value: number; change: number }>;
  industryComparison: {
    yourPerformance: number;
    industryAverage: number;
    betterBy: number;
  } | null;
  insights: {
    observations: string[];
    recommendations: string[];
    highlights: string[];
    risks: string[];
  };
}

export function generateSustainabilityReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  
  // Modern Verde Green Color Palette
  const primaryGreen: [number, number, number] = [34, 197, 94]; // #22c55e
  const darkGreen: [number, number, number] = [21, 128, 61]; // #15803d
  const lightGreen: [number, number, number] = [220, 252, 231]; // #dcfce7
  const darkColor: [number, number, number] = [15, 23, 42]; // slate-900
  const grayColor: [number, number, number] = [100, 116, 139]; // slate-500
  const lightGray: [number, number, number] = [248, 250, 252]; // slate-50

  // Header with gradient effect (simulated)
  doc.setFillColor(...darkGreen);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 40, 210, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('VerdeIQ', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Analytics Report', 20, 35);

  // Company Info & Date
  doc.setTextColor(...darkColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName, 20, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(`Report Generated: ${data.reportDate}`, 20, 72);
  doc.text(`Period: ${new Date(data.periodYear, data.periodMonth - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}`, 20, 78);

  // Summary Cards Section
  let yPosition = 90;
  
  // Total Emissions Card
  doc.setFillColor(...lightGreen);
  doc.roundedRect(20, yPosition, 85, 35, 3, 3, 'F');
  doc.setDrawColor(...primaryGreen);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPosition, 85, 35, 3, 3, 'S');
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL EMISSIONS', 25, yPosition + 8);
  
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGreen);
  doc.text(`${data.totalEmissions.toFixed(1)}`, 25, yPosition + 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('tons CO₂e/year', 25, yPosition + 27);
  
  // YoY Change Badge
    const changeColor: [number, number, number] = data.yoyChange < 0 ? primaryGreen : [239, 68, 68];
  doc.setFillColor(...changeColor);
  doc.roundedRect(25, yPosition + 29, 25, 5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.yoyChange.toFixed(1)}% YoY`, 27, yPosition + 32.5);

  // Industry Comparison Card
  if (data.industryComparison) {
    doc.setFillColor(...lightGray);
    doc.roundedRect(110, yPosition, 80, 35, 3, 3, 'F');
    doc.setDrawColor(...grayColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(110, yPosition, 80, 35, 3, 3, 'S');
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('VS INDUSTRY', 115, yPosition + 8);
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const comparisonColor = (data.industryComparison.betterBy > 0 ? darkGreen : [239, 68, 68]) as [number, number, number];
    doc.setTextColor(...comparisonColor);
    doc.text(`${Math.abs(data.industryComparison.betterBy).toFixed(0)}%`, 115, yPosition + 20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(data.industryComparison.betterBy > 0 ? 'better' : 'worse', 115, yPosition + 27);
  }

  yPosition += 45;

  // Emissions Breakdown Section
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Emissions by Category', 20, yPosition);
  
  yPosition += 8;
  
  const breakdown: Array<{ label: string; data: { value: number; percentage: number }; color: [number, number, number] }> = [
    { label: 'Electricity', data: data.emissionsBreakdown.electricity, color: [34, 197, 94] },
    { label: 'Natural Gas', data: data.emissionsBreakdown.gas, color: [59, 130, 246] },
    { label: 'Transportation', data: data.emissionsBreakdown.transportation, color: [251, 146, 60] },
    { label: 'Other', data: data.emissionsBreakdown.other, color: [168, 85, 247] },
  ];

  breakdown.forEach((item) => {
    // Progress bar background
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(60, yPosition, 130, 6, 1, 1, 'F');
    
    // Progress bar fill
    const barWidth = (item.data.percentage / 100) * 130;
    doc.setFillColor(...item.color);
    doc.roundedRect(60, yPosition, barWidth, 6, 1, 1, 'F');
    
    // Category dot
    doc.setFillColor(...item.color);
    doc.circle(23, yPosition + 3, 2, 'F');
    
    // Label
    doc.setTextColor(...darkColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, 28, yPosition + 4.5);
    
    // Percentage
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayColor);
    doc.text(`${item.data.percentage.toFixed(0)}%`, 50, yPosition + 4.5);
    
    yPosition += 9;
  });

  yPosition += 5;

  // Monthly Trend Section
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Trend', 20, yPosition);
  
  yPosition += 8;
  
  // Table header
  doc.setFillColor(...lightGray);
  doc.rect(20, yPosition, 170, 7, 'F');
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTH', 25, yPosition + 5);
  doc.text('EMISSIONS', 100, yPosition + 5);
  doc.text('CHANGE', 150, yPosition + 5);
  
  yPosition += 7;
  
  // Table rows
  data.monthlyTrend.slice(0, 6).forEach((month, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(20, yPosition, 170, 7, 'F');
    }
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(month.month, 25, yPosition + 5);
    doc.text(`${month.value.toFixed(2)} tons`, 100, yPosition + 5);
    
    const changeColor: [number, number, number] = month.change < 0 ? primaryGreen : [239, 68, 68];
    doc.setTextColor(...changeColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${month.change > 0 ? '+' : ''}${month.change.toFixed(1)}%`, 150, yPosition + 5);
    
    yPosition += 7;
  });

  yPosition += 10;

  // AI Insights Section (Page 2)
  doc.addPage();
  yPosition = 20;
  
  // Header
  doc.setFillColor(...lightGreen);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setTextColor(...darkGreen);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('🤖 AI-Powered Insights', 20, 10);
  
  yPosition = 30;

  // Observations
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Observations', 20, yPosition);
  yPosition += 7;
  
  data.insights.observations.forEach((obs, index) => {
    doc.setFillColor(...primaryGreen);
    doc.circle(23, yPosition + 1.5, 1.5, 'F');
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(obs, 160);
    doc.text(lines, 28, yPosition + 3);
    yPosition += lines.length * 5 + 3;
  });

  yPosition += 5;

  // Recommendations
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommendations', 20, yPosition);
  yPosition += 7;
  
  data.insights.recommendations.forEach((rec, index) => {
    doc.setFillColor(...darkGreen);
    doc.roundedRect(20, yPosition, 170, 1, 0.5, 0.5, 'F');
    yPosition += 4;
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`RECOMMENDATION ${index + 1}`, 25, yPosition);
    yPosition += 5;
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(rec, 160);
    doc.text(lines, 25, yPosition);
    yPosition += lines.length * 5 + 5;
  });

  yPosition += 5;

  // Highlights
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Highlights', 20, yPosition);
  yPosition += 7;
  
  data.insights.highlights.forEach((highlight) => {
    doc.setFillColor(...lightGreen);
    doc.roundedRect(20, yPosition - 2, 170, 10, 2, 2, 'F');
    
    doc.setTextColor(...darkGreen);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize('✓ ' + highlight, 160);
    doc.text(lines, 25, yPosition + 3);
    yPosition += 12;
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(`Generated by VerdeIQ | ${data.reportDate}`, 20, 285);
    doc.text(`Page ${i} of ${pageCount}`, 180, 285);
  }

  return doc;
}