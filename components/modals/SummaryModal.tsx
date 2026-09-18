import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { SearchAnalysisItem, saveSearchAnalysis, getSearchAnalysisHistory, deleteSearchAnalysisAction } from '../../services/SearchAnalysisHistory';
import { logSystemActivity } from '../../services/SystemLogger';
import { useSummaryAnalysis, useSummaryStats } from './hooks/useSummaryLogic';
import { useModalResize } from './hooks/useModalResize';
import { SummaryLiveReport } from './summary/SummaryLiveReport';
import { SummaryHistoryList } from './summary/SummaryHistoryList';

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
  onSeek?: (time: number) => void;
  onModelUpdate?: (models: any) => void;
  setIsAiLoading?: (loading: boolean) => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ 
  isOpen, onClose, transcript, activeColors, isDark, appLang, searchTerm, fileMeta, addToast, onSeek, onModelUpdate, setIsAiLoading
}) => {
  const [history, setHistory] = useState<SearchAnalysisItem[]>([]);
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SearchAnalysisItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { aiAnalysis, setAiAnalysis, isAnalyzing, performAIAnalysis } = useSummaryAnalysis(searchTerm, transcript, appLang, addToast, setIsAiLoading, onModelUpdate);
  const currentStats = useSummaryStats(searchTerm, transcript, fileMeta);

  // Resizing states
  const { size, setSize, isMinimized, setIsMinimized, isMaximized, setIsMaximized, startResizing } = useModalResize(1000, 800, 'summary-modal-container');

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

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
  }, [isOpen, searchTerm]);

  const analysisUpdates = useAppStore(state => state.storeUpdates['studio_analysis']);
  useEffect(() => {
    if (isOpen) {
       getSearchAnalysisHistory().then(setHistory);
    }
  }, [analysisUpdates, isOpen]);

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



  if (!isOpen) return null;

  const historyWithDuplicateFlags = history.map((item, index, self) => {
    const isDuplicate = self.findIndex(t => t.fileName === item.fileName) !== index;
    return { ...item, isDuplicate };
  });

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
            currentStats && currentStats.matchCount > 0 ? (
              <SummaryLiveReport 
                data={currentStats}
                titleSuffix="LIVE ANALYSIS"
                viewMode={viewMode}
                aiAnalysis={aiAnalysis}
                isAnalyzing={isAnalyzing}
                performAIAnalysis={performAIAnalysis}
                activeColors={activeColors}
                appLang={appLang}
                selectedHistoryItem={selectedHistoryItem}
                setSelectedHistoryItem={setSelectedHistoryItem}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 py-40 text-center animate-in fade-in">
                <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-10"><svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
                <p className="text-3xl font-black uppercase tracking-[0.3em]">ম্যাচ পাওয়া যায়নি</p>
              </div>
            )
          ) : (
            selectedHistoryItem ? (
              <SummaryLiveReport 
                data={selectedHistoryItem}
                titleSuffix="ARCHIVED ANALYSIS"
                viewMode={viewMode}
                aiAnalysis={aiAnalysis}
                isAnalyzing={isAnalyzing}
                performAIAnalysis={performAIAnalysis}
                activeColors={activeColors}
                appLang={appLang}
                selectedHistoryItem={selectedHistoryItem}
                setSelectedHistoryItem={setSelectedHistoryItem}
              />
            ) : (
              <SummaryHistoryList 
                historyWithDuplicateFlags={historyWithDuplicateFlags}
                activeColors={activeColors}
                isDark={isDark}
                appLang={appLang}
                onDelete={confirmDelete}
                onSelect={setSelectedHistoryItem}
              />
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
