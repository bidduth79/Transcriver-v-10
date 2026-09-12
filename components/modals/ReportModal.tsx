
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { addToStore, getAllFromStore, deleteFromStore, STORES } from '../../services/db';
import { getActiveProvider, incrementTotalCalls } from '../../services/ApiKeyManager';
import { logSystemActivity } from '../../services/SystemLogger';
import { copyToClipboard } from '../../utils/clipboard';

interface ReportItem {
  id: string;
  date: string;
  searchTerm: string;
  fileName: string;
  content: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  activeColors: any;
  isDark: boolean;
  appLang: 'bn' | 'en';
  fileMeta: any;
  searchTerm: string;
  addToast: (msg: string, type: any) => void;
  onModelUpdate?: () => void;
  setIsAiLoading?: (loading: boolean) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, onClose, transcript, activeColors, isDark, appLang, fileMeta, searchTerm, addToast, onModelUpdate, setIsAiLoading
}) => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'generate' | 'history'>('generate');
  const [reportHistory, setReportHistory] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Resizing states
  const [size, setSize] = useState({ width: 900, height: 750 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const isResizing = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const modalElement = document.getElementById('report-modal-container');
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      setSize({
        width: Math.max(500, e.clientX - rect.left),
        height: Math.max(400, e.clientY - rect.top)
      });
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResizing);
  };

  // ... (Existing Logic: analysisData, loadReportsFromDB, generateReport etc. - Unchanged)
  const analysisData = useMemo<{ ranges: string[], snippets: string[], matchCount: number } | null>(() => {
    if (!searchTerm || !transcript) return null;
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (lowerSearch === "") return null;

    const lines = transcript.split('\n');
    const turns: { startTime: string, text: string }[] = [];
    let currentTurnText = "";
    let lastKnownTime = "00:00";

    lines.forEach((line) => {
      const timeMatch = line.match(/\[(\d{1,2}:\d{2})\]/);
      if (timeMatch) {
        if (currentTurnText.trim()) turns.push({ startTime: lastKnownTime, text: currentTurnText });
        lastKnownTime = timeMatch[1];
        currentTurnText = line; 
      } else {
        currentTurnText += " " + line;
      }
    });
    if (currentTurnText.trim()) turns.push({ startTime: lastKnownTime, text: currentTurnText });

    const ranges: string[] = [];
    const snippets: string[] = [];
    
    turns.forEach((turn, index) => {
      const cleanText = turn.text
        .replace(/\*\*.*?\*\*/g, '')
        .replace(/\[\d{1,2}:\d{2}\]/g, '')
        .replace(/Speaker \d+\s*:/gi, '')
        .replace(/স্পিকার \d+\s*:/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();

      const turnContent = cleanText;
      const lowerTurnContent = turnContent.toLowerCase();
      const startTime = turn.startTime;
      const endTime = turns[index + 1]?.startTime || fileMeta?.duration || "...";
      
      let pos = lowerTurnContent.indexOf(lowerSearch);
      while (pos !== -1) {
        const beforeMatch = turnContent.substring(0, pos);
        const lastPunc = Math.max(
            beforeMatch.lastIndexOf('।'),
            beforeMatch.lastIndexOf('.'),
            beforeMatch.lastIndexOf('?'),
            beforeMatch.lastIndexOf('!'),
            beforeMatch.lastIndexOf('|')
        );
        const idealStartIdx = lastPunc === -1 ? 0 : lastPunc + 1;

        const afterMatch = turnContent.substring(pos + lowerSearch.length);
        const puncs = ['।', '.', '?', '!', '|'];
        let firstPunc = -1;
        for (const p of puncs) {
            const idx = afterMatch.indexOf(p);
            if (idx !== -1) {
                if (firstPunc === -1 || idx < firstPunc) {
                    firstPunc = idx;
                }
            }
        }
        const idealEndIdx = firstPunc === -1 ? turnContent.length : pos + lowerSearch.length + firstPunc + 1;
        const startIdx = Math.max(idealStartIdx, pos - 150);
        const endIdx = Math.min(idealEndIdx, pos + lowerSearch.length + 150);

        let snip = turnContent.substring(startIdx, endIdx).trim();
        if (startIdx > idealStartIdx) snip = "..." + snip;
        if (endIdx < idealEndIdx) snip = snip + "...";

        if (snip && !snippets.includes(snip)) {
          snippets.push(snip);
          ranges.push(`${startTime}-${endTime}`);
        }
        pos = lowerTurnContent.indexOf(lowerSearch, pos + lowerSearch.length);
      }
    });

    return { ranges, snippets, matchCount: snippets.length };
  }, [transcript, searchTerm, fileMeta]);

  const loadReportsFromDB = async () => {
    try {
      const data: any = await getAllFromStore(STORES.REPORTS);
      setReportHistory(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReportsFromDB();
      setIsMinimized(false);
      if (!analysisData || analysisData.matchCount === 0) {
        setViewMode('history');
      } else {
        setViewMode('generate');
      }
    }
    
    const handleReportUpdate = () => {
      if (isOpen) loadReportsFromDB();
    };
    window.addEventListener(`store-updated-studio_reports`, handleReportUpdate);
    return () => window.removeEventListener(`store-updated-studio_reports`, handleReportUpdate);
  }, [isOpen, analysisData?.matchCount]);

  const generateReport = async () => {
    const data = analysisData;
    if (!data || data.matchCount === 0 || loading) return;
    setLoading(true);
    if (setIsAiLoading) setIsAiLoading(true);
    setReport('');

    const executeAI = async (): Promise<string | undefined> => {
      const provider = await getActiveProvider();
      if (!provider) {
          throw new Error("No Active API Key Selected.");
      }

      const ai = new GoogleGenAI({ apiKey: provider.key });
      const prompt = `Analyze these snippets about "${searchTerm}".
      Task:
      1. Provide a brief Bengali summary (strictly under 5 words, e.g., "রাজনৈতিক আলোচনা" or "অর্থনৈতিক বিষয়").
      2. Provide a sentiment: "ইতিবাচক", "নেতিবাচক", or "নিউট্রাল".
      
      Output exactly this format:
      SUMMARY: [Summary]
      SENTIMENT: [Result]
      
      Snippets: ${data.snippets.slice(0, 4).join(' | ')}`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: provider.model,
        contents: prompt
      });
      await incrementTotalCalls('রিপোর্ট জেনারেশন', provider.model, provider.source);
      if (onModelUpdate) onModelUpdate();
      return response.text;
    };

    try {
      const aiText = await executeAI() || "";
      const summaryMatch = aiText.match(/SUMMARY:\s*(.*)/i);
      const sentimentMatch = aiText.match(/SENTIMENT:\s*(.*)/i);
      
      const summaryText = summaryMatch ? summaryMatch[1].trim() : "আলোচিত বিষয়বস্তু";
      const sentiment = sentimentMatch ? sentimentMatch[1].trim() : "নিউট্রাল";
      
      const timeRangeStr = data.ranges.length > 1 
        ? `${data.ranges[0]} থেকে ${data.ranges[data.ranges.length - 1]}`
        : data.ranges[0];

      const today = new Date().toLocaleDateString('bn-BD');
      let finalReport = `শ্রদ্ধেয় জেনারেল\nআসসালামু আলাইকুম স‍্যার,\n\nতারিখ: ${today}\n\n১। উক্ত ভিডিওর দৈর্ঘ্য ${fileMeta.duration || '00:00'}। ভিডিওর ${timeRangeStr} সময়কালে ${summaryText} ${searchTerm}কে নিয়ে ${sentiment} মন্তব্য পরিলক্ষিত হয়েছে।\n\n`;
      
      data.snippets.forEach((snip, idx) => {
        finalReport += `মন্তব্য-${idx + 1}: ${snip}\n\n`;
      });
      
      finalReport += `আপনার সদয় অবগতির জন‍্য প্রেরণ করা হলো।\n\nশ্রদ্ধান্তে`;
      setReport(finalReport);
      
      const newItem: ReportItem = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        searchTerm,
        fileName: fileMeta.name,
        content: finalReport
      };
      await addToStore(STORES.REPORTS, newItem);
      await loadReportsFromDB();
      
      // Log Success
      logSystemActivity('REPORT', 'SUCCESS', 'Report Generated', `Term: ${searchTerm}, File: ${fileMeta.name}`);
      
      addToast(appLang === 'bn' ? "রিপোর্ট তৈরি হয়েছে" : "Report generated", 'success');
    } catch (err: any) {
      console.error(err);
      
      // Log Error
      logSystemActivity('REPORT', 'ERROR', 'Report Generation Failed', `Error: ${err.message}`);
      
      const errorMsg = err.message?.includes('API Key') 
        ? (appLang === 'bn' ? 'API Key সিলেক্ট করুন' : 'Select API Key') 
        : (appLang === 'bn' ? "রিপোর্ট তৈরিতে সমস্যা হয়েছে" : "Failed to generate report");

      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
      if (setIsAiLoading) setIsAiLoading(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = selectedReport ? selectedReport.content : report;
    if (!textToCopy) return;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      addToast(appLang === 'bn' ? "কপি করা হয়েছে" : "Copied to clipboard", 'success');
    } else {
      addToast(appLang === 'bn' ? "কপি করতে সমস্যা হয়েছে" : "Failed to copy", 'error');
    }
  };

  const handleDownload = () => {
    const textToDownload = selectedReport ? selectedReport.content : report;
    if (!textToDownload) return;
    
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const name = selectedReport ? selectedReport.searchTerm : searchTerm;
    link.download = `Report_${name}_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast(appLang === 'bn' ? "ডাউনলোড শুরু হয়েছে" : "Download started", 'success');
  };

  const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteFromStore(STORES.REPORTS, id);
    await loadReportsFromDB();
    if (selectedReport?.id === id) setSelectedReport(null);
    logSystemActivity('REPORT', 'WARNING', 'Report Deleted', `ID: ${id}`);
    addToast(appLang === 'bn' ? "রিপোর্ট ডিলিট করা হয়েছে" : "Report deleted", 'warning');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized Floating Widget */}
      <div className={`fixed bottom-24 right-20 z-[120] animate-in slide-in-from-bottom-10 fade-in duration-300 ${isMinimized ? 'block' : 'hidden'}`}>
         <div 
           onClick={() => setIsMinimized(false)}
           className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border cursor-pointer hover:scale-105 transition-transform ${isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
         >
            <div className={`w-3 h-3 rounded-full ${activeColors.primary}`}></div>
            <span className="text-xs font-bold uppercase tracking-widest">{appLang === 'bn' ? 'রিপোর্ট' : 'Report'}</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
         </div>
      </div>

      {/* Full Modal - Hidden via CSS when minimized */}
      <div className={`fixed inset-0 z-[120] flex items-center justify-center p-0 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-300 ${isMinimized ? 'hidden' : 'flex'}`}>
      <div 
        id="report-modal-container"
        className={`rounded-[4rem] border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] flex flex-col relative animate-in zoom-in-95 duration-500 overflow-hidden ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
        style={{ 
            width: isMaximized ? '100vw' : `${size.width}px`, 
            height: isMaximized ? '100vh' : `${size.height}px`,
            maxWidth: isMaximized ? '100vw' : '95vw', 
            maxHeight: isMaximized ? '100vh' : '95vh',
            borderRadius: isMaximized ? '0' : '4rem'
        }}
        onClick={e => e.stopPropagation()}
      >
        
        <header className="px-12 py-10 bg-slate-950 text-white flex items-center justify-between shrink-0 cursor-move">
          <div className="flex items-center gap-6 group">
            <div className={`w-14 h-14 ${activeColors.primary} rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
              <svg className="w-8 h-8 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-stylish-bn leading-none transition-colors group-hover:text-white/90">রিপোর্ট জেনারেটর</h2>
              <div className="flex gap-6 mt-4">
                <button onClick={() => { setViewMode('generate'); setSelectedReport(null); }} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${viewMode === 'generate' ? 'border-white' : 'border-transparent opacity-40 hover:opacity-100'}`}>তৈরি করুন</button>
                <button onClick={() => { setViewMode('history'); setSelectedReport(null); }} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${viewMode === 'history' ? 'border-white' : 'border-transparent opacity-40 hover:opacity-100'}`}>হিস্টোরি ({reportHistory.length})</button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(true)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5 group">
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"/></svg>
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5 group">
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4"/></svg>
            </button>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5 group">
                <svg className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'generate' ? (
            <div className="flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar">
              {!report && !loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center opacity-30"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                  <div className="space-y-3">
                    <p className="text-xl font-black uppercase tracking-widest opacity-20">রিপোর্ট তৈরি করতে নিচের বাটনে ক্লিক করুন</p>
                    <p className="text-sm font-bold opacity-30 font-stylish-bn">সার্চ করা শব্দ: "{searchTerm}"</p>
                  </div>
                  <button onClick={generateReport} className={`px-12 py-5 ${activeColors.primary} text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all`}>জেনারেট রিপোর্ট</button>
                </div>
              ) : loading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 animate-pulse">এআই প্রসেসিং চলছে...</p>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`p-12 rounded-[3rem] border shadow-inner whitespace-pre-wrap font-stylish-bn text-lg leading-relaxed ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    {report}
                  </div>
                  <div className="flex justify-center gap-4">
                    <button onClick={handleCopy} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-125 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>কপি করুন</button>
                    <button onClick={handleDownload} className={`flex items-center gap-3 px-8 py-4 ${activeColors.primary} text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg transition-all active:scale-95`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>ডাউনলোড করুন</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
               <div className="w-1/3 border-r border-white/5 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-black/5">
                 {reportHistory.length === 0 ? (
                   <p className="text-center py-20 opacity-20 uppercase font-black text-[10px]">খালি</p>
                 ) : (
                   reportHistory.map(item => (
                     <div key={item.id} onClick={() => setSelectedReport(item)} className={`p-6 rounded-3xl border transition-all cursor-pointer group relative ${selectedReport?.id === item.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                       <p className="text-xs font-black uppercase tracking-tight mb-2 truncate">{item.searchTerm}</p>
                       <p className={`text-[10px] opacity-40 tabular-nums ${selectedReport?.id === item.id ? 'text-white' : ''}`}>{new Date(item.date).toLocaleDateString()}</p>
                       <button onClick={(e) => handleDeleteReport(e, item.id)} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                     </div>
                   ))
                 )}
               </div>
               <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                  {selectedReport ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className={`p-12 rounded-[3rem] border shadow-inner whitespace-pre-wrap font-stylish-bn text-lg leading-relaxed ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                        {selectedReport.content}
                      </div>
                      <div className="flex justify-center gap-4">
                        <button onClick={handleCopy} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-125 transition-all">কপি করুন</button>
                        <button onClick={handleDownload} className={`flex items-center gap-3 px-8 py-4 ${activeColors.primary} text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg transition-all active:scale-95`}>ডাউনলোড করুন</button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-10 uppercase font-black tracking-[0.4em]">রিপোর্ট সিলেক্ট করুন</div>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {!isMaximized && (
            <div 
            onMouseDown={startResizing}
            className="absolute bottom-4 right-4 w-12 h-12 cursor-nwse-resize flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity z-[200]"
            >
            <svg className="w-8 h-8 text-slate-400 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 22h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm8-8h-2v-2h2v2zm-12 8h-2v-2h2v2z"/>
            </svg>
            </div>
        )}
      </div>
      </div>
    </>
  );
};
