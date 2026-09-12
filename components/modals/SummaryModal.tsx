
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SearchAnalysisItem, saveSearchAnalysis, getSearchAnalysisHistory, deleteSearchAnalysisAction } from '../../services/SearchAnalysisHistory';
import { getActiveProvider, incrementTotalCalls } from '../../services/ApiKeyManager';
import { logSystemActivity } from '../../services/SystemLogger';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  activeColors: any;
  isDark: boolean;
  appLang: 'bn' | 'en';
  searchTerm: string;
  matchCount: number;
  fileMeta: any;
  addToast: (msg: string, type: any) => void;
  onSeek?: (time: string) => void;
  onModelUpdate?: () => void;
  setIsAiLoading?: (loading: boolean) => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ 
  isOpen, onClose, transcript, activeColors, isDark, appLang, searchTerm, fileMeta, addToast, onSeek, onModelUpdate, setIsAiLoading
}) => {
  const [history, setHistory] = useState<SearchAnalysisItem[]>([]);
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SearchAnalysisItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // New state for Time Card Hover
  const [hoveredTimeIndex, setHoveredTimeIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<'top' | 'bottom'>('top');

  const [aiAnalysis, setAiAnalysis] = useState<{ sentiment: 'positive' | 'negative' | 'neutral', remark: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Resizing states
  const [size, setSize] = useState({ width: 1000, height: 800 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const isResizing = useRef(false);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const modalElement = document.getElementById('summary-modal-container');
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      setSize({
        width: Math.max(600, e.clientX - rect.left),
        height: Math.max(400, e.clientY - rect.top)
      });
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResizing);
  };

  const performAIAnalysis = async () => {
    if (!searchTerm || !transcript || isAnalyzing) return;
    setIsAnalyzing(true);
    if (setIsAiLoading) setIsAiLoading(true);
    setAiAnalysis(null);

    const executeAnalysis = async (): Promise<string | undefined> => {
      const provider = await getActiveProvider();
      if (!provider) {
          throw new Error("No Active API Key Selected. Please select one in Settings.");
      }

      const ai = new GoogleGenAI({ apiKey: provider.key });
      const prompt = `Analyze the context of the word/phrase "${searchTerm}" in this transcript.
      Task:
      1. Determine if the discussion about "${searchTerm}" is Positive, Negative, or Neutral.
      2. Write a short 1-sentence explanation in Bengali.
      
      Format your response EXACTLY like this:
      SENTIMENT: [Positive/Negative/Neutral]
      REMARK: [Explanation in Bengali]
      
      Transcript segment: ${transcript.substring(0, 10000)}`;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: provider.model,
        contents: prompt
      });
      await incrementTotalCalls('সার্চ এনালাইসিস', provider.model, provider.source);
      if (onModelUpdate) onModelUpdate();
      return response.text;
    };

    try {
      const text = await executeAnalysis() || "";
      const sentimentMatch = text.match(/SENTIMENT:\s*(Positive|Negative|Neutral|ইতিবাচক|নেতিবাচক|নিউট্রাল)/i);
      const remarkMatch = text.match(/REMARK:\s*(.*)/i);
      
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (sentimentMatch) {
        const s = sentimentMatch[1].toLowerCase();
        if (s.includes('positive') || s.includes('ইতিবাচক')) sentiment = 'positive';
        else if (s.includes('negative') || s.includes('নেতিবাচক')) sentiment = 'negative';
      }

      const remark = remarkMatch ? remarkMatch[1].trim() : (appLang === 'bn' ? 'বিশ্লেষণ সম্পন্ন হয়েছে।' : 'Analysis complete.');
      setAiAnalysis({ sentiment, remark });
      
      // Log Success
      logSystemActivity('ANALYSIS', 'SUCCESS', 'Sentiment Analysis Completed', `Term: ${searchTerm}, Sentiment: ${sentiment}`);
      
      addToast(appLang === 'bn' ? "এআই বিশ্লেষণ সফল হয়েছে" : "AI analysis successful", 'success');
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      
      // Log Error
      logSystemActivity('ANALYSIS', 'ERROR', 'Analysis Failed', `Error: ${error.message}`);
      
      const quotaMsg = appLang === 'bn' 
        ? "API Key সমস্যা বা কোটা শেষ। দয়া করে সেটিংসে গিয়ে কি পরিবর্তন করুন।" 
        : "API Key Error or Quota exceeded. Please change Key in Settings.";
      
      const errorMsg = error.message?.includes('429') || error.message?.includes('403') ? quotaMsg : (appLang === 'bn' ? 'এআই বিশ্লেষণ ব্যর্থ হয়েছে' : 'AI analysis failed');
      addToast(errorMsg, 'error');
    } finally {
      setIsAnalyzing(false);
      if (setIsAiLoading) setIsAiLoading(false);
    }
  };

  const getSentimentLabel = (s: string) => {
    if (s === 'positive') return appLang === 'bn' ? 'ইতিবাচক' : 'Positive';
    if (s === 'negative') return appLang === 'bn' ? 'নেতিবাচক' : 'Negative';
    if (s === 'pending') return appLang === 'bn' ? 'বিশ্লেষণ হয়নি' : 'Not Analyzed';
    return appLang === 'bn' ? 'নিউট্রাল' : 'Neutral';
  };

  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === term.toLowerCase() ? 
        <span key={i} className="bg-amber-500/40 text-amber-200 font-black px-1.5 py-0.5 rounded-md border border-amber-500/30">{part}</span> : 
        part
    );
  };

  const historyWithDuplicateFlags = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach(item => {
      const key = `${item.fileName}_${item.searchTerm}_${item.matchCount}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    
    return history.map(item => ({
      ...item,
      isDuplicate: (counts.get(`${item.fileName}_${item.searchTerm}_${item.matchCount}`) || 0) > 1
    }));
  }, [history]);

  const currentStats = useMemo(() => {
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
        .replace(/<[^>]*>/g, '')
        .trim();
        
      const turnContent = cleanText.toLowerCase();
      const startTime = turn.startTime;
      const endTime = turns[index + 1]?.startTime || fileMeta?.duration || "...";
      
      let pos = turnContent.indexOf(lowerSearch);
      while (pos !== -1) {
        ranges.push(`${startTime} - ${endTime}`);
        
        const beforeMatch = cleanText.substring(0, pos);
        const lastPunc = Math.max(
            beforeMatch.lastIndexOf('।'),
            beforeMatch.lastIndexOf('.'),
            beforeMatch.lastIndexOf('?'),
            beforeMatch.lastIndexOf('!'),
            beforeMatch.lastIndexOf('|')
        );
        const idealStartSnip = lastPunc === -1 ? 0 : lastPunc + 1;

        const afterMatch = cleanText.substring(pos + lowerSearch.length);
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
        const idealEndSnip = firstPunc === -1 ? cleanText.length : pos + lowerSearch.length + firstPunc + 1;
        const startSnip = Math.max(idealStartSnip, pos - 150);
        const endSnip = Math.min(idealEndSnip, pos + lowerSearch.length + 150);
        
        let snip = cleanText.substring(startSnip, endSnip).trim();
        if (startSnip > idealStartSnip) snip = "..." + snip;
        if (endSnip < idealEndSnip) snip = snip + "...";
        snippets.push(snip);
        pos = turnContent.indexOf(lowerSearch, pos + lowerSearch.length);
      }
    });

    return {
      searchTerm,
      fileName: fileMeta?.name || 'Unknown',
      duration: fileMeta?.duration || '00:00',
      matchCount: ranges.length,
      matchTimestamps: ranges,
      matchSentences: snippets
    };
  }, [transcript, searchTerm, fileMeta]);

  const handleSave = async (forceUpdate: boolean = false) => {
    if (currentStats && currentStats.matchCount > 0) {
      const newItem: SearchAnalysisItem = {
        id: Date.now().toString(),
        searchTerm: currentStats.searchTerm,
        fileName: currentStats.fileName,
        duration: currentStats.duration,
        speakerCount: 0,
        matchCount: currentStats.matchCount,
        matchTimestamps: currentStats.matchTimestamps,
        matchSentences: currentStats.matchSentences,
        date: new Date().toISOString(),
        sentiment: aiAnalysis?.sentiment || 'pending',
        remarkExplanation: aiAnalysis?.remark || ''
      };

      const latestData = await getSearchAnalysisHistory();
      
      const existingIdx = latestData.findIndex(h => 
        h.fileName === newItem.fileName && 
        h.searchTerm === newItem.searchTerm && 
        h.matchCount === newItem.matchCount
      );

      if (existingIdx !== -1) {
        if (aiAnalysis && latestData[existingIdx].sentiment === 'pending') {
          newItem.id = latestData[existingIdx].id; 
          newItem.date = latestData[existingIdx].date;
        } else if (!forceUpdate) {
          return; 
        }
      }

      const updated = await saveSearchAnalysis(newItem);
      setHistory(updated);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      const data = await getSearchAnalysisHistory();
      setHistory(data);
    };
    if (isOpen) {
      loadHistory();
      setIsMinimized(false);
      if (!searchTerm || !transcript) {
        setViewMode('history');
      } else {
        setAiAnalysis(null);
        setTimeout(() => handleSave(false), 500);
      }
    }
    
    const handleAnalysisUpdate = () => {
      if (isOpen) {
         getSearchAnalysisHistory().then(setHistory);
      }
    };
    window.addEventListener(`store-updated-studio_analysis`, handleAnalysisUpdate);
    return () => window.removeEventListener(`store-updated-studio_analysis`, handleAnalysisUpdate);
  }, [isOpen, searchTerm]);

  useEffect(() => {
    if (aiAnalysis && currentStats && !isAnalyzing) {
      handleSave(true);
    }
  }, [aiAnalysis]);

  const confirmDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = await deleteSearchAnalysisAction(id);
    setHistory(updated);
    setDeletingId(null);
    logSystemActivity('ANALYSIS', 'WARNING', 'Analysis Deleted', `ID: ${id}`);
    addToast(appLang === 'bn' ? "ডিলিট করা হয়েছে" : "Deleted successfully", 'warning');
  };

  const renderStatsView = (data: any, titleSuffix: string = "") => {
    if (!data) return null;
    const timestamps = data.matchTimestamps || [];
    const sentences = data.matchSentences || [];
    const sentiment = data.sentiment || (aiAnalysis?.sentiment || 'pending');
    const explanation = data.remarkExplanation || (aiAnalysis?.remark || '');
    const isManualMode = viewMode === 'current' && (!aiAnalysis && !isAnalyzing);

    return (
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em]">{titleSuffix}</h3>
          {selectedHistoryItem && (
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedHistoryItem(null); }} 
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900/10 hover:bg-slate-900/20 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest text-slate-800"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              তালিকায় ফিরুন
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="p-10 rounded-[3rem] border shadow-inner bg-slate-900/5 border-slate-900/5">
            <p className="text-[11px] font-black opacity-40 uppercase tracking-widest mb-3">ফাইল ডিউরেশন</p>
            <p className="text-4xl font-black tabular-nums tracking-tighter">{data.duration}</p>
          </div>
          <div className="bg-indigo-500/10 p-10 rounded-[3rem] border border-indigo-500/10 shadow-inner">
            <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-3">মোট কতবার</p>
            <div className="flex items-baseline gap-3"><p className="text-6xl font-black text-indigo-600 tabular-nums tracking-tighter">{data.matchCount}</p><span className="text-sm font-black text-indigo-600/50 uppercase">বার</span></div>
          </div>
          <div className={`p-10 rounded-[3rem] border shadow-inner flex flex-col justify-center transition-all duration-700 min-h-[160px] ${sentiment === 'positive' ? 'bg-emerald-500/10 border-emerald-500/10' : sentiment === 'negative' ? 'bg-rose-500/10 border-rose-500/10' : 'bg-slate-500/10 border-slate-500/10'}`}>
            <p className="text-[11px] font-black opacity-40 uppercase tracking-widest mb-3">রিমার্ক (AI)</p>
            {isAnalyzing ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">এআই বিশ্লেষণ...</span>
              </div>
            ) : (sentiment === 'pending' || isManualMode) ? (
              <div className="space-y-3">
                 <p className="text-[11px] font-bold opacity-30 uppercase tracking-widest">বিশ্লেষণ করা হয়নি</p>
                 <button 
                  onClick={performAIAnalysis}
                  className={`w-fit px-6 py-2.5 ${activeColors.primary} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all`}
                >
                  বিশ্লেষণ করুন
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full animate-pulse ${sentiment === 'positive' ? 'bg-emerald-500' : sentiment === 'negative' ? 'bg-rose-500' : 'bg-slate-500'}`}></div><p className={`text-3xl font-black uppercase tracking-tighter ${sentiment === 'positive' ? 'text-emerald-600' : sentiment === 'negative' ? 'text-rose-600' : 'text-slate-600'}`}>{getSentimentLabel(sentiment)}</p></div>
                {explanation && <p className="text-[11px] leading-relaxed font-bold font-stylish-bn opacity-60 line-clamp-2">{explanation}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-80 h-80 ${activeColors?.primary || 'bg-indigo-600'} opacity-10 blur-[120px] rounded-full`}></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
            {timestamps.map((range: string, idx: number) => (
              <div 
                key={idx}
                onMouseEnter={() => setHoveredTimeIndex(idx)}
                onMouseLeave={() => setHoveredTimeIndex(null)}
                className="relative px-8 py-6 rounded-[2.2rem] bg-white/5 border border-white/10 hover:bg-white/15 hover:scale-[1.03] transition-all duration-300 flex flex-col justify-center items-center gap-1 shadow-lg group/item cursor-default"
              >
                {/* Normal State Content */}
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover/item:text-indigo-400 transition-colors">TIME RANGE</span>
                <span className="text-xl font-black text-white tabular-nums tracking-tight">{range}</span>
                {sentences[idx] && <p className="text-[10px] text-white/40 italic line-clamp-1 mt-2 text-center group-hover/item:text-white/70 transition-colors font-stylish-bn px-2">{sentences[idx]}</p>}

                {/* Hover Overlay - Show Full Text */}
                {hoveredTimeIndex === idx && sentences[idx] && (
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-[2.2rem] p-4 flex items-center justify-center z-20 animate-in fade-in zoom-in-95 duration-200">
                     <p className="text-[12px] text-white font-medium leading-relaxed text-center font-stylish-bn overflow-y-auto custom-scrollbar max-h-full">
                        {highlightText(
                          sentences[idx].replace(/\*\*.*?\*\*/g, '').replace(/\[\d{1,2}:\d{2}\]/g, '').replace(/Speaker \d+\s*:/gi, '').replace(/^\.\.\.|\.\.\.$/g, '').trim(),
                          data.searchTerm
                        )}
                     </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized Floating Widget - Visible when minimized */}
      <div className={`fixed bottom-24 right-20 z-[120] animate-in slide-in-from-bottom-10 fade-in duration-300 ${isMinimized ? 'block' : 'hidden'}`}>
         <div 
           onClick={() => setIsMinimized(false)}
           className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border cursor-pointer hover:scale-105 transition-transform ${isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
         >
            <div className={`w-3 h-3 rounded-full ${activeColors.primary}`}></div>
            <span className="text-xs font-bold uppercase tracking-widest">{appLang === 'bn' ? 'এনালাইসিস' : 'Analysis'}</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
         </div>
      </div>

      {/* Full Modal View - Hidden via CSS when minimized to keep state alive */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center p-0 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-300 ${isMinimized ? 'hidden' : 'flex'}`}
      >
      <div 
        id="summary-modal-container"
        className={`rounded-[4.5rem] border shadow-[0_60px_150px_-20px_rgba(0,0,0,0.6)] flex flex-col relative animate-in zoom-in-95 duration-500 overflow-hidden ${isDark ? 'bg-slate-900 border-white/20' : 'bg-white border-slate-200'}`}
        style={{ 
            width: isMaximized ? '100vw' : `${size.width}px`, 
            height: isMaximized ? '100vh' : `${size.height}px`,
            maxWidth: isMaximized ? '100vw' : '95vw', 
            maxHeight: isMaximized ? '100vh' : '95vh',
            borderRadius: isMaximized ? '0' : '4.5rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-12 py-10 border-b border-white/10 flex items-center justify-between bg-slate-900 text-white shrink-0 relative z-[110] shadow-xl cursor-move">
          <div className="flex items-center gap-10">
            <div className={`w-20 h-20 ${activeColors?.primary || 'bg-indigo-600'} rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-4 ring-white/10 transition-transform hover:rotate-3`}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tight font-stylish-bn leading-none">সার্চ এনালাইসিস</h2>
              <div className="flex gap-8 mt-5">
                <button onClick={() => { setViewMode('current'); setSelectedHistoryItem(null); }} className={`text-[12px] font-black uppercase tracking-[0.3em] pb-2 border-b-2 transition-all ${viewMode === 'current' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/60'}`}>লাইভ রিপোর্ট</button>
                <button onClick={() => { setViewMode('history'); setSelectedHistoryItem(null); }} className={`text-[12px] font-black uppercase tracking-[0.3em] pb-2 border-b-2 transition-all ${viewMode === 'history' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/60'}`}>হিস্টোরি আর্কাইভ</button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMinimized(true)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white border border-white/10 group">
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/></svg>
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white border border-white/10 group">
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4"/></svg>
            </button>
            <button 
                onClick={handleClose} 
                className="w-16 h-16 flex items-center justify-center bg-white/10 hover:bg-red-600 hover:text-white rounded-full transition-all text-white border border-white/20 active:scale-90 shadow-lg group"
            >
                <svg className="w-8 h-8 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto overflow-x-visible custom-scrollbar p-14 lg:p-20 relative ${!isMaximized && 'rounded-b-[4.5rem]'}`}>
          {viewMode === 'current' ? (
            currentStats && currentStats.matchCount > 0 ? renderStatsView(currentStats, "LIVE ANALYSIS") : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 py-40 text-center animate-in fade-in">
                <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-10"><svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
                <p className="text-3xl font-black uppercase tracking-[0.3em]">ম্যাচ পাওয়া যায়নি</p>
              </div>
            )
          ) : (
            selectedHistoryItem ? renderStatsView(selectedHistoryItem, "ARCHIVED ANALYSIS") : (
              <div className="space-y-4 pb-20 w-full max-w-3xl mx-auto overflow-x-visible">
                {historyWithDuplicateFlags.length === 0 ? (
                  <div className="py-32 text-center opacity-20"><p className="text-xl font-black uppercase tracking-widest">আর্কাইভ খালি</p></div>
                ) : (
                  historyWithDuplicateFlags.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedHistoryItem(item)} 
                      onMouseEnter={(e) => { 
                        setHoveredId(item.id);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoverPosition(rect.top > window.innerHeight / 2 ? 'top' : 'bottom');
                      }} 
                      onMouseLeave={() => setHoveredId(null)} 
                      className={`p-6 rounded-3xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl group relative select-none ${hoveredId === item.id ? 'z-[200]' : 'z-10'} ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}
                    >
                      {item.isDuplicate && (
                        <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black rounded-full shadow-lg border-2 border-white animate-bounce z-[210]">
                          DUPLICATE
                        </div>
                      )}

                      {hoveredId === item.id && item.matchSentences && (
                        <div 
                          className={`absolute left-1/2 -translate-x-1/2 w-[350px] z-[300] ${
                            hoverPosition === 'top' 
                              ? 'bottom-full pb-4' 
                              : 'top-full pt-4'
                          }`}
                        >
                          <div className="max-h-[250px] overflow-y-auto bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 shadow-2xl custom-scrollbar pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3 sticky top-0 bg-slate-900 z-10">
                              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">বিশ্লেষণ প্রিভিউ</p>
                            </div>
                            <div className="space-y-3 relative z-0">
                              {item.matchSentences.map((snip, sIdx) => (
                                <div key={sIdx} className="p-3 rounded-xl bg-white/5 border border-white/10">
                                  <p className="text-[12px] font-medium text-white/90 leading-relaxed font-stylish-bn italic">
                                    {highlightText(
                                      snip.replace(/\*\*.*?\*\*/g, '').replace(/\[\d{1,2}:\d{2}\]/g, '').replace(/Speaker \d+\s*:/gi, '').replace(/^\.\.\.|\.\.\.$/g, '').trim(), 
                                      item.searchTerm
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-red-600/95 z-[250] rounded-3xl flex items-center justify-between px-8 animate-in fade-in duration-200 shadow-xl" style={{display: deletingId === item.id ? 'flex' : 'none'}}>
                          <p className="text-white font-black uppercase text-xs tracking-[0.15em]">ডিলিট করবেন?</p>
                          <div className="flex gap-3">
                            <button onClick={(e) => {e.stopPropagation(); setDeletingId(null);}} className="text-white bg-white/10 px-5 py-2 rounded-xl text-[10px] font-black uppercase border border-white/20 hover:bg-white/20 transition-all">বাতিল</button>
                            <button onClick={(e) => confirmDelete(e, item.id)} className="text-red-600 bg-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all">ডিলিট</button>
                          </div>
                      </div>

                      <div className="flex items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                             <div className="flex items-center gap-2">
                               <div className={`w-1.5 h-5 rounded-full ${activeColors?.primary || 'bg-indigo-600'}`}></div>
                               <span className={`px-3 py-1 rounded-lg ${activeColors?.primary || 'bg-indigo-600'} text-white text-[10px] font-black uppercase tracking-wider shadow-sm`}>{item.searchTerm}</span>
                             </div>
                             <h4 className={`text-lg font-bold uppercase font-stylish-bn line-clamp-1 group-hover:text-indigo-600 transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.fileName}</h4>
                          </div>
                          <div className={`flex items-center gap-5 ${isDark ? 'opacity-70' : 'opacity-60'}`}>
                             <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums">{new Date(item.date).toLocaleDateString()}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums">{item.duration}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                                <span className="text-[10px] font-bold uppercase tracking-wider">{item.matchCount}টি ম্যাচ</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                               <div className={`w-1.5 h-1.5 rounded-full ${item.sentiment === 'pending' ? 'bg-slate-400' : item.sentiment === 'positive' ? 'bg-emerald-500' : item.sentiment === 'negative' ? 'bg-rose-500' : 'bg-indigo-400'}`}></div>
                               <span className="text-[9px] font-bold uppercase tracking-wider">{getSentimentLabel(item.sentiment)}</span>
                             </div>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingId(item.id); }} 
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950/5 hover:bg-red-500 hover:text-white transition-all group/del shadow-sm relative z-[210] border border-transparent hover:border-red-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
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
