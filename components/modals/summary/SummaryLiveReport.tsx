import React, { useState } from 'react';
import { getSentimentLabel, highlightText } from './SummaryUtils';

interface SummaryLiveReportProps {
  data: any;
  titleSuffix?: string;
  viewMode: 'current' | 'history';
  aiAnalysis: { sentiment: 'positive' | 'negative' | 'neutral', remark: string } | null;
  isAnalyzing: boolean;
  performAIAnalysis: () => void;
  activeColors: any;
  appLang: 'bn' | 'en';
  selectedHistoryItem: any;
  setSelectedHistoryItem: (item: any) => void;
}

export const SummaryLiveReport: React.FC<SummaryLiveReportProps> = ({
  data, titleSuffix = "", viewMode, aiAnalysis, isAnalyzing, performAIAnalysis, activeColors, appLang, selectedHistoryItem, setSelectedHistoryItem
}) => {
  const [hoveredTimeIndex, setHoveredTimeIndex] = useState<number | null>(null);

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
              <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full animate-pulse ${sentiment === 'positive' ? 'bg-emerald-500' : sentiment === 'negative' ? 'bg-rose-500' : 'bg-slate-500'}`}></div><p className={`text-3xl font-black uppercase tracking-tighter ${sentiment === 'positive' ? 'text-emerald-600' : sentiment === 'negative' ? 'text-rose-600' : 'text-slate-600'}`}>{getSentimentLabel(sentiment, appLang)}</p></div>
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
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover/item:text-indigo-400 transition-colors">TIME RANGE</span>
              <span className="text-xl font-black text-white tabular-nums tracking-tight">{range}</span>
              {sentences[idx] && <p className="text-[10px] text-white/40 italic line-clamp-1 mt-2 text-center group-hover/item:text-white/70 transition-colors font-stylish-bn px-2">{sentences[idx]}</p>}

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
