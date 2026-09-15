import React from 'react';

export const HistoryToolbar = ({
  t,
  appLang,
  history,
  isDark,
  isDatePickerOpen,
  setIsDatePickerOpen,
  isSentimentPickerOpen,
  setIsSentimentPickerOpen,
  isSearchOpen,
  setIsSearchOpen,
  isLoadingDate,
  setIsLoadingDate,
  viewDate,
  setViewDate,
  calendarDays,
  availableDateStrings,
  flatItems,
  rowVirtualizer,
  histSentimentFilter,
  setHistSentimentFilter,
  showFavoritesOnly,
  setShowFavoritesOnly,
  backupHistory,
  restoreHistory,
  restoreInputRef,
  setIsHistoryFullscreen
}: any) => {
  return (
    <div className="flex items-center gap-1 shrink-0 z-10 transition-transform duration-500">
      <span className="flex items-center justify-center px-2 py-0.5 min-w-[24px] h-6 bg-white/10 text-white border border-white/5 rounded-full text-[10px] font-black shadow-inner shrink-0 mr-1 cursor-default">{(history?.length || 0)}</span>
    
      <div className="static flex gap-1">
      <div className="static">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsDatePickerOpen(!isDatePickerOpen); setIsSentimentPickerOpen(false); setIsSearchOpen(false); }} 
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all border shadow-inner shrink-0 cursor-pointer group ${isDatePickerOpen ? 'text-white bg-white/20 border-white/20' : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border-white/5'}`}
          title={appLang === 'bn' ? 'তারিখ দিয়ে খুঁজুন' : 'Filter by Date'}
        >
          <svg className="w-4 h-4 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        {isDatePickerOpen && (
        <div className={`absolute top-[calc(100%+0.5rem)] right-3 w-[220px] overflow-hidden rounded-2xl shadow-2xl border z-[9999] flex flex-col ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'} `} onClick={(e) => e.stopPropagation()}>
          <div className="p-2.5 relative">
            {isLoadingDate && (
                <div className="absolute inset-0 bg-inherit/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3 rounded-2xl">
                  <svg className="w-5 h-5 text-[#10b981] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[13px] font-bold pl-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {viewDate.toLocaleDateString(appLang === 'bn' ? 'bn-IN' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-0.5">
                <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
            
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-1.5 text-center border-b pb-1.5 border-slate-500/20">
              {(appLang === 'bn' ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(day => (
                <span key={day} className="text-[9px] font-medium text-slate-500">{day}</span>
              ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 gap-y-1.5 text-center">
              {calendarDays.map((calDay: any, i: number) => {
                const isTodayStr = new Date().toLocaleDateString('en-US');
                const calDayStr = calDay.date.toLocaleDateString('en-US');
                const hasHistory = availableDateStrings.has(calDayStr);
                const isToday = calDayStr === isTodayStr;
                
                return (
                  <button
                    key={i}
                    disabled={isLoadingDate}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLoadingDate(true);
                      const index = flatItems.findIndex((item: any) => item.type === 'header' && item.group === calDayStr);
                      setTimeout(() => {
                          if (index !== -1) {
                              rowVirtualizer.scrollToIndex(index, { align: 'start' });
                          }
                          setIsDatePickerOpen(false);
                          setIsLoadingDate(false);
                      }, 50); 
                    }}
                    title={hasHistory ? (appLang === 'bn' ? 'হিস্টোরি আছে' : 'Has history') : ''}
                    className={`
                      w-6 h-6 mx-auto flex items-center justify-center rounded-full text-[10px] transition-all relative
                      ${!calDay.isCurrentMonth ? (isDark ? 'text-slate-600 font-medium' : 'text-slate-400 font-medium') : (isDark ? 'text-slate-200 font-semibold' : 'text-slate-700 font-semibold')}
                      ${isToday 
                          ? 'bg-[#10b981] text-white hover:bg-[#059669]' 
                          : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {calDay.day}
                    {hasHistory && (
                        <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-[#10b981]'}`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>

      <div className="static">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsSentimentPickerOpen(!isSentimentPickerOpen); setIsDatePickerOpen(false); setIsSearchOpen(false); }} 
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all border shadow-inner shrink-0 cursor-pointer ${isSentimentPickerOpen ? 'text-white bg-white/20 border-white/20' : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border-white/5'} ${histSentimentFilter !== 'All' ? 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30' : ''}`}
          title={appLang === 'bn' ? 'সেন্টিমেন্ট ফিল্টার' : 'Sentiment Filter'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        {isSentimentPickerOpen && (
          <div className={`absolute top-[calc(100%+0.5rem)] right-3 w-[140px] overflow-hidden rounded-2xl shadow-2xl border z-[9999] flex flex-col ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'} `} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col p-1.5 gap-1">
              <button onClick={() => { setHistSentimentFilter('All'); setIsSentimentPickerOpen(false); }} className={`px-3 py-2 text-left text-xs font-bold rounded-xl transition-colors ${histSentimentFilter === 'All' ? (isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')}`}>All</button>
              <button onClick={() => { setHistSentimentFilter('Positive'); setIsSentimentPickerOpen(false); }} className={`px-3 py-2 text-left text-xs font-bold rounded-xl transition-colors ${histSentimentFilter === 'Positive' ? 'bg-green-500/20 text-green-500' : (isDark ? 'hover:bg-slate-800 text-green-400' : 'hover:bg-slate-100 text-green-600')}`}>Positive</button>
              <button onClick={() => { setHistSentimentFilter('Negative'); setIsSentimentPickerOpen(false); }} className={`px-3 py-2 text-left text-xs font-bold rounded-xl transition-colors ${histSentimentFilter === 'Negative' ? 'bg-red-500/20 text-red-500' : (isDark ? 'hover:bg-slate-800 text-red-400' : 'hover:bg-slate-100 text-red-600')}`}>Negative</button>
              <button onClick={() => { setHistSentimentFilter('Neutral'); setIsSentimentPickerOpen(false); }} className={`px-3 py-2 text-left text-xs font-bold rounded-xl transition-colors ${histSentimentFilter === 'Neutral' ? 'bg-yellow-500/20 text-yellow-500' : (isDark ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-slate-100 text-yellow-600')}`}>Neutral</button>
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="flex gap-1 border-r border-white/10 pr-1 mr-1">
      <button 
        onClick={(e) => { e.stopPropagation(); setShowFavoritesOnly(!showFavoritesOnly); }} 
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all border shadow-inner shrink-0 cursor-pointer group ${showFavoritesOnly ? 'text-amber-400 bg-amber-400/20 border-amber-400/30' : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border-white/5'}`}
        title={appLang === 'bn' ? 'শুধু বুকমার্ক দেখান' : 'Show Favorites Only'}
      >
        <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-125" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); backupHistory(); }} 
        className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-green-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5 shadow-inner shrink-0 cursor-pointer group" 
        title={appLang === 'bn' ? 'ব্যাকআপ' : 'Backup'}
      >
        <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (restoreInputRef.current) restoreInputRef.current.click(); 
        }} 
        className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-indigo-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5 shadow-inner shrink-0 cursor-pointer group" 
        title={appLang === 'bn' ? 'রিস্টোর' : 'Restore'}
      >
        <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </button>
      <input 
        type="file" 
        ref={restoreInputRef}
        accept=".json" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files?.[0] && restoreHistory) {
            restoreHistory(e.target.files[0]);
            e.target.value = '';
          }
        }} 
      />
    </div>

    <button 
      onClick={(e) => { e.stopPropagation(); setIsSearchOpen(!isSearchOpen); setIsDatePickerOpen(false); }} 
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all border shadow-inner shrink-0 cursor-pointer group ${isSearchOpen ? 'text-white bg-white/20 border-white/20' : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border-white/5'}`}
      title={appLang === 'bn' ? 'সার্চ করুন' : 'Search'}
    >
      <svg className="w-4 h-4 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
    
    <button 
      onClick={(e) => { e.stopPropagation(); setIsHistoryFullscreen(true); }} 
      className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5 shadow-inner shrink-0 group cursor-pointer" 
      title={t.expand}
    >
      <svg className="w-4 h-4 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
    </button>
  </div>
  );
};
