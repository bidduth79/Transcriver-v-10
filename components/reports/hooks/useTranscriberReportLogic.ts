import { useState, useEffect } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { getAllFromStore, STORES } from '../../../services/db';

export const useTranscriberReportLogic = (isOpen: boolean) => {
  const [history, setHistory] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const historyUpdates = useAppStore(state => state.storeUpdates['studio_history']);
  
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, historyUpdates]);

  const loadHistory = async () => {
    const data: any = await getAllFromStore(STORES.HISTORY);
    setHistory(data);
  };

  const parseDurationToSeconds = (dur: string) => {
    if (!dur) return 0;
    const parts = dur.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const formatSecondsToHrsMin = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return `${hrs.toString().padStart(2, '0')} Hrs ${mins.toString().padStart(2, '0')} Min`;
  };

  useEffect(() => {
    if (!history.length) return;

    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    const filtered = history.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });

    const grouped: any = {};

    filtered.forEach(item => {
      const dateKey = new Date(item.date).toLocaleDateString('en-GB'); 
      const isVideo = ['mp4', 'mkv', 'webm', 'avi', 'mov'].includes((item.extension || '').toLowerCase());
      const fileType = isVideo ? 'Video' : 'Audio';
      const method = item.fileName.includes('http') ? 'Youtube Link' : 'File Upload'; 
      
      const key = `${dateKey}-${fileType}`;

      if (!grouped[key]) {
        grouped[key] = {
          date: dateKey,
          method: method,
          fileType: fileType,
          qty: 0,
          durationSecs: 0
        };
      }

      grouped[key].qty += 1;
      grouped[key].durationSecs += parseDurationToSeconds(item.duration);
    });

    const rows = (Object.values(grouped) as any[]).sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return dateA.localeCompare(dateB);
    });

    setReportData(rows);

  }, [history, fromDate, toDate]);

  const totalQty = reportData.reduce((acc, curr) => acc + curr.qty, 0);
  const totalDurationSecs = reportData.reduce((acc, curr) => acc + curr.durationSecs, 0);

  const ROWS_FIRST_PAGE = 24;
  const ROWS_OTHER_PAGES = 30;

  const getPages = () => {
    const pages = [];
    let dataCopy = [...reportData];
    
    if (dataCopy.length === 0) {
      return [[]];
    }

    pages.push(dataCopy.splice(0, ROWS_FIRST_PAGE));
    
    while(dataCopy.length > 0) {
      pages.push(dataCopy.splice(0, ROWS_OTHER_PAGES));
    }
    return pages;
  };

  const pages = getPages();

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('পপ-আপ ব্লক করা আছে। দয়া করে ব্রাউজারের পপ-আপ অ্যালাউ করুন।');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transcriber_Report_${fromDate}_to_${toDate}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');
            body {
              margin: 0;
              padding: 20px;
              background-color: #52525b;
              display: flex;
              flex-direction: column;
              align-items: center;
              font-family: 'Hind Siliguri', sans-serif;
            }
            @media print {
              @page { size: A4 portrait; margin: 0; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #ffffff; padding: 0; display: block; }
              .page-break { page-break-after: always !important; }
              .report-page { display: block !important; height: auto !important; min-height: 297mm !important; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; flex-direction: column; gap: 2rem;">
            ${element.innerHTML}
          </div>
          <script>
            document.fonts.ready.then(() => { setTimeout(() => { window.print(); }, 500); });
            window.onafterprint = () => { window.close(); };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleDownloadExcel = () => {
    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      const stringified = String(str);
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    let csvContent = "\uFEFF"; 
    csvContent += "Sl No,Transcriber Date,Using Method,File Type,Qty,Duration,Remarks\n";

    reportData.forEach((row, index) => {
        const dur = formatSecondsToHrsMin(row.durationSecs);
        csvContent += `${index + 1},${escapeCSV(row.date)},${escapeCSV(row.method)},${escapeCSV(row.fileType)},${row.qty},${escapeCSV(dur)},""\n`;
    });

    csvContent += `,,,Total-,${totalQty},${escapeCSV(formatSecondsToHrsMin(totalDurationSecs))},""\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    fromDate, setFromDate,
    toDate, setToDate,
    reportData,
    totalQty,
    totalDurationSecs,
    pages,
    formatSecondsToHrsMin,
    handleDownloadPDF,
    handleDownloadExcel,
    ROWS_FIRST_PAGE,
    ROWS_OTHER_PAGES
  };
};
