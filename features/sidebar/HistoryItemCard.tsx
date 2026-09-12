import React from 'react';
import { useHistoryItemCard } from './hooks/useHistoryItemCard';

export const HistoryItemCard = ({ 
  item, 
  activeHistoryId, 
  loadHistoryItem, 
  onDeleteHistoryItem, 
  isDark, 
  activeColors, 
  appLang, 
  getSensitiveMatches,
  isDuplicate,
  toggleFavorite
}: any) => {
  const sensitiveMatches = getSensitiveMatches(item.transcript);
  const isSensitive = sensitiveMatches && sensitiveMatches.length > 0;
  const isActive = activeHistoryId === item.id;
  
  const {
    handleStart,
    handleEnd,
    handleClick,
    handleTouchEnd,
    formatProcessingTime
  } = useHistoryItemCard(item, onDeleteHistoryItem, loadHistoryItem);

  // Determine classes based on state
  let itemClass = "";
  
  if (isActive) {
      // ACTIVE STATE: Light Green as requested
      itemClass = isDark 
          ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
          : 'bg-green-50 border-green-400 shadow-md';
  } else if (isDuplicate) {
      // DUPLICATE STATE: Light Yellow as requested
      itemClass = isDark 
          ? 'bg-yellow-900/20 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
          : 'bg-yellow-50 border-yellow-400 shadow-md';
  } else if (isSensitive) {
      // Sensitive State
      itemClass = isDark 
          ? 'bg-red-900/10 border-red-500/30 hover:bg-red-900/20 hover:border-red-500/50' 
          : 'bg-red-50 border-red-100 hover:bg-red-100 hover:border-red-200';
  } else {
      // Default State
      itemClass = isDark 
          ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-indigo-400/50' 
          : 'bg-white border-slate-100 hover:bg-indigo-50 hover:border-indigo-200';
  }

  return (
    <div 
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className={`p-4 border rounded-2xl transition-all group relative active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-xl select-none ${itemClass}`}
    >
      <div className="mb-2 flex justify-between items-start gap-2">
          <p className={`text-[11px] font-bold ${isActive ? (isDark ? 'text-green-400' : 'text-green-800') : (isDark ? 'text-white/90' : 'text-slate-700')} truncate font-stylish-bn transition-colors group-hover:text-indigo-500`}>
            {item.fileName?.replace(/_/g, ' ').replace(/#/g, '').replace(/\s+/g, ' ').trim()}
          </p>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (toggleFavorite) toggleFavorite(item.id);
            }}
            className={`p-1 shrink-0 rounded-full transition-colors ${item.isFavorite ? 'text-amber-400' : 'text-slate-400/50 hover:text-amber-400'}`}
          >
            <svg className="w-4 h-4" fill={item.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
      </div>
      
      <div className={`flex flex-col gap-2 text-[9px] ${isActive ? (isDark ? 'text-green-200/60' : 'text-green-700/60') : (isDark ? 'text-white/40' : 'text-slate-400')} font-black uppercase tracking-wider`}>
        {/* Date & Time Row */}
        <div className="flex items-center justify-between w-full" title="Creation Date">
            <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>{new Date(item.date).toLocaleTimeString(appLang === 'bn' ? 'bn-BD' : 'en-US', { timeStyle: 'short' })}</span>
                {item.hasBeenOpened && (
                  <span title={appLang === 'bn' ? "ইতিপূর্বে খোলা হয়েছে" : "Previously Opened"}>
                    <svg className={`w-3 h-3 ml-0.5 ${isActive ? (isDark ? 'text-green-400' : 'text-green-600') : 'text-indigo-400/70 group-hover:text-indigo-500'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </span>
                )}
            </div>
            <div className="flex items-center gap-1.5">
                {isDuplicate && (
                    <span className={`shrink-0 px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                        DUPLICATE
                    </span>
                )}
                {isActive && (
                   <span className={`shrink-0 px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                       LOADED
                   </span>
                )}
                {isSensitive && !isActive && (
                    <div className="relative group/badge flex flex-col items-end z-10">
                      {/* Default View: Shows only the first match or a summary */}
                      <div className="flex gap-1 justify-end transition-opacity duration-300 group-hover/badge:opacity-0 group-hover/badge:invisible">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            loadHistoryItem(item, sensitiveMatches[0]);
                          }}
                          className="shrink-0 px-1.5 py-0.5 bg-red-600 hover:bg-red-500 cursor-pointer transition-colors text-white text-[8px] font-black rounded uppercase tracking-wider animate-pulse"
                        >
                            {sensitiveMatches[0]}
                        </span>
                        {sensitiveMatches.length > 1 && (
                          <span className="shrink-0 px-1.5 py-0.5 bg-red-600/80 text-white text-[8px] font-black rounded uppercase tracking-wider">
                              +{sensitiveMatches.length - 1}
                          </span>
                        )}
                      </div>

                      {/* Expanded View: Shows all matches vertically on hover */}
                      <div className="flex flex-col gap-1 items-end opacity-0 invisible translate-y-[10px] transition-all duration-300 group-hover/badge:opacity-100 group-hover/badge:visible group-hover/badge:translate-y-0 bg-slate-900/90 p-1.5 rounded-lg shadow-xl border border-red-500/30 absolute bottom-full right-0 mb-1 min-w-max">
                        {sensitiveMatches.map((match: string, idx: number) => (
                          <span 
                            key={idx} 
                            onClick={(e) => {
                                e.stopPropagation();
                                loadHistoryItem(item, match);
                            }}
                            className="shrink-0 px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[8px] font-black rounded uppercase tracking-wider cursor-pointer transition-colors"
                          >
                              {match}
                          </span>
                        ))}
                      </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Processing Time & Duration Row */}
        <div className={`flex items-center justify-between border-t border-dashed pt-1.5 mt-0.5 ${isActive ? (isDark ? 'border-green-500/30' : 'border-green-300') : 'border-current/20'}`}>
            <div className="flex items-center gap-1.5">
                <span className="opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1" title="File Duration">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {item.duration}
                </span>
                {item.bgbRemark && (
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1 rounded ${
                        item.bgbRemark === 'Positive' ? 'text-green-500 bg-green-500/10' :
                        item.bgbRemark === 'Negative' ? 'text-red-500 bg-red-500/10' :
                        'text-yellow-500 bg-yellow-500/10'
                    }`}>
                        {item.bgbRemark}
                    </span>
                )}
            </div>
            <span className={`${isActive ? (isDark ? 'text-green-300' : 'text-green-600') : activeColors.text} flex items-center gap-1`} title="Processing Time">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {formatProcessingTime(item.timeTaken)}
            </span>
        </div>
      </div>
    </div>
  );
};
