
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getAllFromStore, STORES } from '../../services/db.ts';

export const TranscriberReportModal = ({ 
  isOpen, onClose, isDark, activeColors, appLang 
}) => {
  const [history, setHistory] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Initialize dates to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
    
    const handleHistoryUpdate = () => {
      if (isOpen) loadHistory();
    };
    window.addEventListener(`store-updated-studio_history`, handleHistoryUpdate);
    return () => window.removeEventListener(`store-updated-studio_history`, handleHistoryUpdate);
  }, [isOpen]);

  const loadHistory = async () => {
    const data: any = await getAllFromStore(STORES.HISTORY);
    setHistory(data);
  };

  // Helper to convert time string (HH:MM:SS or MM:SS) to seconds
  const parseDurationToSeconds = (dur) => {
    if (!dur) return 0;
    const parts = dur.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  // Helper to format seconds to "XX Hrs YY Min"
  const formatSecondsToHrsMin = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return `${hrs.toString().padStart(2, '0')} Hrs ${mins.toString().padStart(2, '0')} Min`;
  };

  // Process Data based on filters
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

    // Group by Date + Type
    const grouped = {};

    filtered.forEach(item => {
      const dateKey = new Date(item.date).toLocaleDateString('en-GB'); // DD/MM/YYYY
      const isVideo = ['mp4', 'mkv', 'webm', 'avi', 'mov'].includes((item.extension || '').toLowerCase());
      const fileType = isVideo ? 'Video' : 'Audio';
      // Simple heuristic for method - usually File Upload unless we track source explicitly
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

    // Convert to array and sort by date
    const rows = Object.values(grouped).sort((a, b) => {
        // @ts-ignore
        const dateA = a.date.split('/').reverse().join('-');
        // @ts-ignore
        const dateB = b.date.split('/').reverse().join('-');
        return dateA.localeCompare(dateB);
    });

    setReportData(rows);

  }, [history, fromDate, toDate]);

  const totalQty = reportData.reduce((acc, curr) => acc + curr.qty, 0);
  const totalDurationSecs = reportData.reduce((acc, curr) => acc + curr.durationSecs, 0);

  // Pagination Logic for Visual and PDF
  const ROWS_FIRST_PAGE = 27;
  const ROWS_OTHER_PAGES = 40;

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
              @page {
                size: A4 portrait;
                margin: 0;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background-color: #ffffff;
                padding: 0;
                display: block;
              }
              .page-break {
                page-break-after: always !important;
              }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; flex-direction: column; gap: 2rem;">
            ${element.innerHTML}
          </div>
          <script>
            document.fonts.ready.then(() => {
              setTimeout(() => {
                window.print();
              }, 500);
            });
            window.onafterprint = () => {
              window.close();
            };
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

    let csvContent = "\uFEFF"; // Add BOM for UTF-8 encoding (fixes Excel Bengali text issue)
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col animate-in fade-in duration-200">
        
        {/* Header Controls - Dark Theme for Contrast */}
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex flex-wrap gap-4 items-center justify-between shadow-lg shrink-0 z-20">
            <div className="flex items-center gap-3 group">
                <div className="bg-white text-slate-900 w-10 h-10 flex items-center justify-center rounded-lg shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight transition-colors group-hover:text-white/90">Report Generator</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">OSINT MODULE • PDF PREVIEW</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-slate-700 px-4 py-2 rounded-xl border border-slate-600">
                <div className="flex flex-col">
                    <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 cursor-pointer">From Date</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="cursor-pointer px-3 py-1.5 rounded border border-slate-500 text-xs font-bold bg-slate-800 text-white outline-none focus:border-white transition-colors" />
                </div>
                <div className="w-px h-8 bg-slate-600"></div>
                <div className="flex flex-col">
                    <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 cursor-pointer">To Date</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="cursor-pointer px-3 py-1.5 rounded border border-slate-500 text-xs font-bold bg-slate-800 text-white outline-none focus:border-white transition-colors" />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={handleDownloadExcel} className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 group">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Excel
                </button>
                <button onClick={handleDownloadPDF} className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg group">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Print / PDF
                </button>
                <div className="w-px h-8 bg-slate-700 mx-2"></div>
                <button onClick={onClose} className="cursor-pointer px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg">
                    Close
                </button>
            </div>
        </div>

        {/* Report Preview Area (Paper Look) */}
        <div className="flex-1 overflow-y-auto bg-slate-500 p-8 flex flex-col items-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div id="report-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: 'transparent' }}>
                {pages.map((pageRows, pageIndex) => (
                    <div 
                        key={pageIndex}
                        className={pageIndex < pages.length - 1 ? 'html2pdf__page-break' : ''}
                        style={{ 
                            width: '210mm', 
                            height: '297mm', 
                            padding: '48px', 
                            boxSizing: 'border-box', 
                            position: 'relative', 
                            overflow: 'hidden', 
                            flexShrink: 0,
                            pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
                            fontFamily: "'Hind Siliguri', sans-serif", 
                            backgroundColor: '#ffffff', 
                            color: '#000000', 
                            borderColor: '#d1d5db', 
                            borderWidth: '1px', 
                            borderStyle: 'solid' 
                        }} 
                    >
                        {/* Report Header - Only on first page */}
                        {pageIndex === 0 && (
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px', color: '#000000' }}>Transcriber Report- {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h1>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', color: '#000000' }}>BGB LICELL</h2>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#dc2626' }}>
                                    <span>From Date: {new Date(fromDate).toLocaleDateString('en-GB')}</span>
                                    <span>To Date: {new Date(toDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '12px', color: '#000000' }}>
                                    Print Date: {new Date().toLocaleDateString('en-GB')}
                                </div>
                            </div>
                        )}

                        {/* Data Table with Thin Borders */}
                        <table className="report-table-thin" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#cbd5e1' }}>
                                    <th style={{ padding: '4px 8px', width: '48px', fontWeight: 'bold', textAlign: 'center', color: '#000000', border: '0.5px solid #000000' }}>Sl No</th>
                                    <th style={{ padding: '4px 8px', fontWeight: 'bold', textAlign: 'center', color: '#000000', border: '0.5px solid #000000' }}>Transcriber Date</th>
                                    <th style={{ padding: '4px 8px', fontWeight: 'bold', textAlign: 'center', color: '#000000', border: '0.5px solid #000000' }}>Using Method</th>
                                    <th style={{ padding: '4px 8px', fontWeight: 'bold', textAlign: 'center', color: '#000000', border: '0.5px solid #000000' }}>File Type</th>
                                    <th style={{ padding: '4px 8px', width: '64px', fontWeight: 'bold', textAlign: 'center', color: '#000000', border: '0.5px solid #000000' }}>Qty</th>
                                    <th style={{ padding: '4px 8px', fontWeight: 'bold', textAlign: 'center', color: '#000000', border: '0.5px solid #000000' }}>Duration</th>
                                    <th style={{ padding: '4px 8px', width: '96px', fontWeight: 'bold', textAlign: 'center', color: '#000000', border: '0.5px solid #000000' }}>Rmks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((row, i) => {
                                    const actualIndex = pageIndex === 0 ? i : ROWS_FIRST_PAGE + (pageIndex - 1) * ROWS_OTHER_PAGES + i;
                                    return (
                                        <tr key={i} style={{ textAlign: 'center' }}>
                                            <td style={{ padding: '4px 8px', color: '#000000', border: '0.5px solid #000000' }}>{actualIndex + 1}.</td>
                                            <td style={{ padding: '4px 8px', color: '#000000', border: '0.5px solid #000000' }}>{row.date}</td>
                                            <td style={{ padding: '4px 8px', color: '#000000', border: '0.5px solid #000000' }}>{row.method}</td>
                                            <td style={{ padding: '4px 8px', color: '#000000', border: '0.5px solid #000000' }}>{row.fileType}</td>
                                            <td style={{ padding: '4px 8px', color: '#000000', border: '0.5px solid #000000' }}>{row.qty}</td>
                                            <td style={{ padding: '4px 8px', color: '#000000', border: '0.5px solid #000000' }}>{formatSecondsToHrsMin(row.durationSecs)}</td>
                                            <td style={{ padding: '4px 8px', color: '#000000', border: '0.5px solid #000000' }}></td>
                                        </tr>
                                    );
                                })}
                                
                                {/* Empty rows filler for no records - ONLY shows if NO data exists */}
                                {reportData.length === 0 && pageIndex === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', fontStyle: 'italic', color: '#64748b', border: '0.5px solid #000000' }}>
                                            No records found for this date range
                                        </td>
                                    </tr>
                                )}

                                {/* Footer Total - Only on last page */}
                                {pageIndex === pages.length - 1 && reportData.length > 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000000', border: '0.5px solid #000000' }}>Total-</td>
                                        <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold', color: '#000000', border: '0.5px solid #000000' }}>{totalQty}</td>
                                        <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold', color: '#000000', border: '0.5px solid #000000' }}>{formatSecondsToHrsMin(totalDurationSecs)}</td>
                                        <td style={{ padding: '4px 8px', border: '0.5px solid #000000' }}></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Page Footer */}
                        <div style={{ position: 'absolute', bottom: '40px', left: '48px', right: '48px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>
                            <span>Page {pageIndex + 1} of {pages.length}</span>
                            <span>System Generated by OSINT</span>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

