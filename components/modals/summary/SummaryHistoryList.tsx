import React, { useState } from 'react';
import { SearchAnalysisItem } from '../../../services/SearchAnalysisHistory';
import { getSentimentLabel, highlightText } from './SummaryUtils';

interface HistoryItem extends SearchAnalysisItem {
  isDuplicate?: boolean;
}

interface SummaryHistoryListProps {
  historyWithDuplicateFlags: HistoryItem[];
  activeColors: any;
  isDark: boolean;
  appLang: 'bn' | 'en';
  onDelete: (e: React.MouseEvent, id: string) => Promise<void>;
  onSelect: (item: SearchAnalysisItem) => void;
}

export const SummaryHistoryList: React.FC<SummaryHistoryListProps> = ({
  historyWithDuplicateFlags, activeColors, isDark, appLang, onDelete, onSelect
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<'top' | 'bottom'>('top');

  const confirmDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await onDelete(e, id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-4 pb-20 w-full max-w-3xl mx-auto overflow-x-visible">
      {historyWithDuplicateFlags.length === 0 ? (
        <div className="py-32 text-center opacity-20"><p className="text-xl font-black uppercase tracking-widest">আর্কাইভ খালি</p></div>
      ) : (
        historyWithDuplicateFlags.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onSelect(item)} 
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
                     <span className="text-[9px] font-bold uppercase tracking-wider">{getSentimentLabel(item.sentiment, appLang)}</span>
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
  );
};
