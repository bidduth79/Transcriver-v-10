
import React from 'react';
import { useExpandedHistory } from './hooks/useExpandedHistory';

interface ExpandedHistoryProps {
  t: any;
  isDark: boolean;
  setIsHistoryFullscreen: (v: boolean) => void;
  histSearch: string;
  setHistSearch: (v: string) => void;
  histDateFilter: string;
  setHistDateFilter: (v: string) => void;
  histSentimentFilter: string;
  setHistSentimentFilter: (v: string) => void;
  filteredHistory: any[];
  historyLimit: number;
  setHistoryLimit: React.Dispatch<React.SetStateAction<number>>;
  loadHistoryItem: (item: any, searchKeyword?: string) => void;
  activeColors: any;
}

export const ExpandedHistory: React.FC<ExpandedHistoryProps> = ({
  t, isDark, setIsHistoryFullscreen, histSearch, setHistSearch,
  histDateFilter, setHistDateFilter, histSentimentFilter, setHistSentimentFilter, filteredHistory,
  historyLimit, setHistoryLimit, loadHistoryItem, activeColors
}) => {
  const {
    hoveredCardId,
    setHoveredCardId,
    isHistoryLoading,
    bottomRef,
    getSensitiveMatches,
    formatProcessingTime
  } = useExpandedHistory(filteredHistory, historyLimit, setHistoryLimit);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
      <div className={`w-[96vw] h-[94vh] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border-white/20' : 'bg-white border-white/20'}`}>
        
        {/* Expanded Header with Dynamic Theme Glass Effect */}
        <header className="px-10 py-8 bg-slate-950/95 backdrop-blur-3xl border-b border-white/10 flex flex-wrap items-center justify-between shrink-0 gap-6 shadow-2xl z-10 relative">
          <div className="flex items-center gap-6 group cursor-default">
            <div className={`w-16 h-16 ${activeColors.primary} rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-black/40 ring-1 ring-white/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
              <svg className="w-8 h-8 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white uppercase tracking-wider leading-none font-stylish-bn group-hover:text-white transition-colors text-white/90">{t.history}</h2>
              <p className={`text-[10px] font-black ${activeColors.text.replace('text-', 'text-opacity-80 text-')} tracking-[0.3em] uppercase`}>{filteredHistory.length} {t.itemsLogged}</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl flex items-center justify-end gap-4">
            {/* Stable History Search Bar */}
            <div 
              className={`relative flex items-center bg-white/5 border border-white/10 rounded-full p-1.5 transition-all duration-300 shadow-inner w-full max-w-[400px] focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-white/10 group/search`}
            >
               <div className={`w-9 h-9 flex items-center justify-center shrink-0 transition-all duration-300 group-hover/search:scale-125 ${histSearch ? activeColors.text : 'text-white/40'}`}>
                  <svg className="w-5 h-5 transition-transform group-hover/search:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
               <input 
                type="text" 
                placeholder={t.searchHist}
                value={histSearch}
                onChange={(e) => setHistSearch(e.target.value)}
                className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold text-white placeholder:text-white/20 flex-1 px-3"
               />
               {histSearch && (
                 <button onClick={() => setHistSearch('')} className="p-1.5 bg-white/10 rounded-full text-white/40 hover:text-white transition-all mr-1 hover:scale-125 hover:rotate-90">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                 </button>
               )}
            </div>

            <div className="w-48 relative group/date">
               <input 
                type="date" 
                value={histDateFilter}
                onChange={(e) => setHistDateFilter(e.target.value)}
                className={`w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-xs font-bold text-white outline-none focus:ring-4 ${activeColors.ring.replace('ring-', 'ring-opacity-20 ring-')} transition-all color-scheme-dark shadow-inner cursor-pointer group-hover/date:bg-white/10`}
               />
            </div>

            <div className="w-40 relative group/sentiment">
              <select
                value={histSentimentFilter}
                onChange={(e) => setHistSentimentFilter(e.target.value)}
                className={`w-full appearance-none bg-white/5 border border-white/10 rounded-full py-4 px-6 pr-10 text-xs font-bold text-white outline-none focus:ring-4 ${activeColors.ring.replace('ring-', 'ring-opacity-20 ring-')} transition-all shadow-inner cursor-pointer group-hover/sentiment:bg-white/10`}
              >
                <option value="All" className="bg-slate-900">All</option>
                <option value="Positive" className="bg-slate-900 text-green-400">Positive</option>
                <option value="Negative" className="bg-slate-900 text-red-400">Negative</option>
                <option value="Neutral" className="bg-slate-900 text-yellow-400">Neutral</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsHistoryFullscreen(false)} 
            className={`group flex items-center gap-4 ${activeColors.primary} hover:brightness-110 text-white px-10 py-4 rounded-2xl transition-all active:scale-95 shadow-xl border border-white/10`}
          >
            <span className="text-xs font-black uppercase tracking-widest">{t.close}</span>
            <svg className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180 group-hover:scale-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-12 ${isDark ? 'bg-slate-800' : 'bg-[#F1F3F5]'}`}>
           {filteredHistory.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-20 group/empty">
                <svg className="w-40 h-40 mb-8 transition-all duration-1000 group-hover/empty:scale-110 group-hover/empty:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 01-7 7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                <p className="text-3xl font-black uppercase tracking-widest">No Results Found</p>
             </div>
           ) : (
             <>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 relative z-10">
                {filteredHistory.slice(0, historyLimit).map((item, idx) => {
                  const sensitiveMatches = getSensitiveMatches(item.id);
                  const isSensitive = sensitiveMatches && sensitiveMatches.length > 0;
                
                const cardBgClass = isSensitive 
                    ? (isDark ? 'bg-red-900/10 border-red-500/30' : 'bg-red-50 border-red-100')
                    : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200');
                
                const innerBorderClass = isSensitive
                    ? (isDark ? 'border-red-500/30 hover:border-red-400' : 'border-red-100 hover:border-red-300')
                    : (isDark ? 'border-slate-700 hover:border-indigo-400/50' : 'border-slate-200 hover:border-indigo-300');

                return (
                <div 
                  key={item.id ? `${item.id}-${idx}` : `hist-exp-${idx}`} 
                  className={`relative rounded-[3rem] transition-all duration-500 group overflow-hidden ${cardBgClass}`}
                  onMouseEnter={() => setHoveredCardId(item.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  <div 
                    onClick={() => loadHistoryItem(item)} 
                    className={`p-8 border h-full flex flex-col cursor-pointer ${innerBorderClass}`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${activeColors.soft.replace('bg-', 'bg-opacity-10 bg-')} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    <div className="mb-6 flex items-start justify-between relative z-10">
                       <div className="flex gap-2 items-center">
                           <div className={`px-3 py-1 ${activeColors.soft} ${activeColors.text} rounded-lg text-[8px] font-black uppercase tracking-widest ring-1 ${activeColors.border.replace('border-', 'border-opacity-20 border-')} transition-transform group-hover:scale-110 group-hover:-rotate-3`}>
                               {item.extension || 'FILE'}
                           </div>
                           {/* Sensitive Match Pill */}
                           {isSensitive && (
                               <div className="flex flex-wrap gap-1">
                                 {sensitiveMatches.slice(0, 2).map((match: string, idx: number) => (
                                   <div 
                                     key={idx} 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       loadHistoryItem(item, match);
                                     }}
                                     className="px-3 py-1 bg-red-600 hover:bg-red-500 cursor-pointer transition-colors text-white rounded-lg text-[8px] font-black uppercase tracking-widest ring-1 ring-red-500 shadow-lg shadow-red-500/20 animate-pulse"
                                   >
                                       {match}
                                   </div>
                                 ))}
                                 {sensitiveMatches.length > 2 && (
                                   <div className="px-3 py-1 bg-red-600/80 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
                                       +{sensitiveMatches.length - 2}
                                   </div>
                                 )}
                               </div>
                           )}
                       </div>
                       
                       <div className={`text-slate-400 group-hover:${activeColors.text} transition-all duration-500 group-hover:scale-150 group-hover:rotate-12`}>
                          <svg className={`w-6 h-6 ${isSensitive ? 'text-red-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       </div>
                    </div>
                    <h4 className={`text-sm font-black line-clamp-2 mb-8 uppercase tracking-tight leading-relaxed transition-colors font-stylish-bn group-hover:text-indigo-500 relative z-10 ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.fileName}</h4>
                    <div className="mt-auto pt-6 border-t border-slate-100/50 flex items-center justify-between relative z-10">
                       <div className="flex flex-col group/info-date"><span className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1.5 group-hover/info-date:opacity-100 transition-opacity">{t.historyLabelDate}</span><span className={`text-[11px] font-black ${isDark ? 'text-white/80' : 'text-slate-600'}`}>{new Date(item.date).toLocaleDateString()}</span></div>
                       <div className="flex flex-col items-end group/info-dur">
                          <span className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1.5 group-hover/info-dur:opacity-100 transition-opacity">DURATION / TIME</span>
                          <div className="flex items-center gap-1.5">
                              <span className={`text-[11px] font-black ${activeColors.text}`}>{item.duration}</span>
                              {item.bgbRemark && (
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-1 rounded ${
                                      item.bgbRemark === 'Positive' ? 'text-green-500 bg-green-500/10' :
                                      item.bgbRemark === 'Negative' ? 'text-red-500 bg-red-500/10' :
                                      'text-yellow-500 bg-yellow-500/10'
                                  }`}>
                                      {item.bgbRemark}
                                  </span>
                              )}
                              <span className={`text-[9px] font-bold opacity-40 ${isDark ? 'text-white' : 'text-slate-600'}`}>({formatProcessingTime(item.timeTaken)})</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Scrollable Popup Overlay on Hover */}
                  {hoveredCardId === item.id && (
                    <div 
                      className={`absolute inset-0 z-20 p-6 backdrop-blur-xl transition-all animate-in fade-in duration-300 overflow-hidden flex flex-col ${isDark ? 'bg-slate-900/95' : 'bg-white/95'}`}
                      onClick={(e) => e.stopPropagation()} // Prevent triggering load when interacting with popup text
                    >
                      <div className="flex items-center justify-between mb-3 shrink-0 border-b border-white/10 pb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${activeColors.text}`}>TRANSCRIPT PREVIEW</span>
                        <div onClick={() => loadHistoryItem(item)} className="cursor-pointer p-1.5 bg-white/10 rounded-full hover:bg-indigo-600 hover:text-white transition-all group" title="Open File">
                           <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                        <p className={`text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                          {(() => {
                             const textContent = item.transcript || "No transcript content...";
                             if (!isSensitive) return textContent;

                             const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                             const regex = new RegExp(`(${sensitiveMatches.map(escapeRegExp).join('|')})`, 'gi');
                             return textContent.split(regex).map((part: string, i: number) => 
                               sensitiveMatches.some((match: string) => part.toLowerCase() === match.toLowerCase()) ? (
                                 <mark 
                                    key={i} 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      loadHistoryItem(item, part);
                                    }}
                                    className="bg-red-500 hover:bg-red-400 cursor-pointer transition-colors text-white px-1 rounded-sm font-bold mx-0.5 animate-pulse"
                                 >
                                   {part}
                                 </mark>
                               ) : part
                             );
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
             </div>
             
             {/* Lazy Loading Indicator */}
             {isHistoryLoading && historyLimit < filteredHistory.length && (
               <div className="flex justify-center items-center py-12 animate-in fade-in duration-300 col-span-full">
                 <div className={`flex items-center gap-3 px-6 py-3 rounded-full ${isDark ? 'bg-slate-800/80 border-white/10' : 'bg-white border-slate-200'} border shadow-xl`}>
                   <div className={`w-5 h-5 rounded-full border-2 ${activeColors.border} border-t-transparent animate-spin`}></div>
                   <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} tracking-widest uppercase`}>
                     {t.history === 'ইতিহাস' ? 'আরও লোড হচ্ছে...' : 'Loading more...'}
                   </span>
                 </div>
               </div>
             )}
             
             <div ref={bottomRef} style={{ height: '20px' }}></div>
           </>
           )}
        </div>
      </div>
    </div>
  );
};
