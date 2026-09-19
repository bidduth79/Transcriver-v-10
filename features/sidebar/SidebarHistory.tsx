import React, { useState, useMemo, useEffect } from 'react';
import { HistoryItemCard } from './HistoryItemCard';
import { useVirtualizer } from '@tanstack/react-virtual';

export const SidebarHistory = ({
  t,
  history,
  fullHistory,
  isLoadingHistory,
  setIsHistoryFullscreen,
  groupedHistory: initialGroupedHistory,
  cardBg,
  cardBorder,
  activeHistoryId,
  loadHistoryItem,
  onDeleteHistoryItem,
  isDark,
  activeColors,
  appLang,
  getSensitiveMatches,
  bottomRef,
  isHistoryLoading,
  historyLimit,
  setHistoryLimit,
  scrollContainerEl,
  showFavoritesOnly,
  setShowFavoritesOnly,
  toggleFavorite,
  backupHistory,
  restoreHistory,
  histSentimentFilter,
  setHistSentimentFilter,
  totalHistoryCount
}: any) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSentimentPickerOpen, setIsSentimentPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const restoreInputRef = React.useRef<HTMLInputElement>(null);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const listRef = React.useRef<HTMLDivElement>(null);

  // Close Pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsDatePickerOpen(false);
      setIsSentimentPickerOpen(false);
    };
    if (isDatePickerOpen || isSentimentPickerOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDatePickerOpen, isSentimentPickerOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);



  const duplicateFileCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (history || []).forEach((h: any) => {
      if (!counts[h.fileName]) counts[h.fileName] = 0;
      counts[h.fileName]++;
    });
    return counts;
  }, [history]);

  const processedGroupedHistory = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return initialGroupedHistory;
    }
    
    // Perform search on the entire history array, including transcript content
    const sourceArray = fullHistory && fullHistory.length > 0 ? fullHistory : (history || []);
    let filtered = sourceArray;
    
    if (debouncedSearchQuery.trim()) {
      const searchRegex = new RegExp(debouncedSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtered = sourceArray.filter((item: any) => {
        const rawFileName = item.fileName || '';
        const displayFileName = rawFileName.replace(/_/g, ' ').replace(/#/g, '').replace(/\s+/g, ' ').trim();
        const fileNameMatch = searchRegex.test(rawFileName) || searchRegex.test(displayFileName);
        const transcriptMatch = searchRegex.test(item.transcript || item.text || '');
        return fileNameMatch || transcriptMatch;
      });
    }

    // Group the filtered items
    const groups: any = {};
    filtered.forEach((item: any) => {
      const d = new Date(item.date).toLocaleDateString('en-US');
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    
    return groups;
  }, [history, fullHistory, initialGroupedHistory, debouncedSearchQuery]);

  const flatItems = useMemo(() => {
    const arr: any[] = [];
    Object.entries(processedGroupedHistory).forEach(([group, items]) => {
      arr.push({ type: 'header', group, count: (items as any[]).length });
      (items as any[]).forEach(item => {
        arr.push({ type: 'item', item, isDuplicate: duplicateFileCounts[item.fileName] > 1, group });
      });
    });
    return arr;
  }, [processedGroupedHistory, duplicateFileCounts]);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollContainerEl,
    estimateSize: (index) => flatItems[index].type === 'header' ? 50 : 120,
    overscan: 10,
  });

  const availableDateStrings = useMemo(() => {
    const dates = new Set<string>();
    (fullHistory || history || []).forEach((item: any) => {
      dates.add(new Date(item.date).toLocaleDateString('en-US'));
    });
    return dates;
  }, [fullHistory, history]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  }, [viewDate]);

  // Smoothly scroll to active item to prevent layout jump when FileInfoSection mounts
  const [prevActiveId, setPrevActiveId] = useState(activeHistoryId);
  useEffect(() => {
    if (activeHistoryId && activeHistoryId !== prevActiveId) {
      setPrevActiveId(activeHistoryId);
      const index = flatItems.findIndex((i: any) => i.type === 'item' && i.item.id === activeHistoryId);
      if (index !== -1) {
        // Small delay to allow FileInfoSection to render and update DOM heights
        setTimeout(() => {
          try {
            rowVirtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
          } catch (e) {
            // ignore
          }
        }, 150);
      }
    }
  }, [activeHistoryId, prevActiveId, flatItems, rowVirtualizer]);

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-4 pb-2 z-50 shrink-0 sticky top-0 bg-inherit">
        <div className="flex items-center bg-slate-950 px-3 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.4)] border border-white/10 mb-2 h-[52px] relative cursor-default overflow-hidden">
          <div className="peer/dot flex items-center group/dot cursor-pointer py-2 pr-4 z-20 shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)] shrink-0 animate-pulse`}></div>
            <div className="flex items-center overflow-hidden transition-all duration-500 max-w-0 opacity-0 group-hover/dot:max-w-[250px] group-hover/dot:opacity-100 group-hover/dot:ml-2">
              <span className="text-[12px] font-black uppercase tracking-[0.15em] text-white whitespace-nowrap">{t.history}</span>
            </div>
          </div>
          
          <div className="transition-all duration-500 flex-1"></div>

          <div className="flex items-center gap-1 shrink-0 z-10 transition-transform duration-500">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/5 shrink-0 hidden sm:inline-block mr-1`}>{totalHistoryCount !== undefined ? totalHistoryCount : (history?.length || 0)}</span>
          
            <div className="static flex gap-1">
            <div className="static">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsDatePickerOpen(!isDatePickerOpen); setIsSentimentPickerOpen(false); setIsSearchOpen(false); }} 
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all border shadow-inner shrink-0 cursor-pointer group ${isDatePickerOpen ? 'text-white bg-white/20 border-white/20' : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border-white/5'}`}
                title={t.filterByDate}
              >
                <svg className="w-4 h-4 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <div className="static">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsSentimentPickerOpen(!isSentimentPickerOpen); setIsDatePickerOpen(false); setIsSearchOpen(false); }} 
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all border shadow-inner shrink-0 cursor-pointer ${isSentimentPickerOpen ? 'text-white bg-white/20 border-white/20' : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border-white/5'} ${histSentimentFilter !== 'All' ? 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30' : ''}`}
                title={t.sentimentFilter}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex gap-1 border-r border-white/10 pr-1 mr-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowFavoritesOnly(!showFavoritesOnly); }} 
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all border shadow-inner shrink-0 cursor-pointer group ${showFavoritesOnly ? 'text-amber-400 bg-amber-400/20 border-amber-400/30' : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border-white/5'}`}
              title={t.showFavoritesOnly}
            >
              <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-125" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); backupHistory(); }} 
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-green-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5 shadow-inner shrink-0 cursor-pointer group" 
              title={t.backup}
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
              title={t.restore}
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
            title={t.search}
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
          <div className="transition-all duration-500 flex-1 peer-hover/dot:flex-none peer-hover/dot:w-0"></div>
        </div>

        {/* Pickers moved outside of overflow-hidden header */}
        {isDatePickerOpen && (
          <div className={`absolute top-[76px] right-[36px] w-[220px] overflow-hidden rounded-2xl shadow-2xl border z-[9999] flex flex-col ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'} `} onClick={(e) => e.stopPropagation()}>
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
                {calendarDays.map((calDay, i) => {
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
                        const index = flatItems.findIndex(i => i.type === 'header' && i.group === calDayStr);
                        setTimeout(() => {
                            if (index !== -1) {
                                rowVirtualizer.scrollToIndex(index, { align: 'start' });
                            }
                            setIsDatePickerOpen(false);
                            setIsLoadingDate(false);
                        }, 50); 
                      }}
                      title={hasHistory ? t.hasHistory : ''}
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
                      {hasHistory && !isToday && (
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#10b981]"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isSentimentPickerOpen && (
          <div className={`absolute top-[76px] right-[36px] w-[140px] overflow-hidden rounded-2xl shadow-2xl border z-[9999] flex flex-col ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'} `} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col p-1.5 gap-1">
              <button onClick={() => { setHistSentimentFilter('All'); setIsSentimentPickerOpen(false); }} className={`px-3 py-2 text-left text-xs font-bold rounded-xl transition-colors ${histSentimentFilter === 'All' ? (isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')}`}>All</button>
              <button onClick={() => { setHistSentimentFilter('Positive'); setIsSentimentPickerOpen(false); }} className={`px-3 py-2 text-left text-xs font-bold rounded-xl transition-colors ${histSentimentFilter === 'Positive' ? 'bg-green-500/20 text-green-500' : (isDark ? 'hover:bg-slate-800 text-green-400' : 'hover:bg-slate-100 text-green-600')}`}>Positive</button>
              <button onClick={() => { setHistSentimentFilter('Negative'); setIsSentimentPickerOpen(false); }} className={`px-3 py-2 text-left text-xs font-bold rounded-xl transition-colors ${histSentimentFilter === 'Negative' ? 'bg-red-500/20 text-red-500' : (isDark ? 'hover:bg-slate-800 text-red-400' : 'hover:bg-slate-100 text-red-600')}`}>Negative</button>
              <button onClick={() => { setHistSentimentFilter('Neutral'); setIsSentimentPickerOpen(false); }} className={`px-3 py-2 text-left text-xs font-bold rounded-xl transition-colors ${histSentimentFilter === 'Neutral' ? 'bg-yellow-500/20 text-yellow-500' : (isDark ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-slate-100 text-yellow-600')}`}>Neutral</button>
            </div>
          </div>
        )}
        
        {/* Search Input Expansion */}
        {isSearchOpen && (
          <div className="mb-2 w-full animate-in slide-in-from-top-2 fade-in duration-200">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchFilesText}
              className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
            />
          </div>
        )}
      </div>

      {/* History content */}
      <div className="px-6 pb-6 pt-1 relative" ref={listRef}>
        {isLoadingHistory && (!history || history.length === 0) ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`p-4 rounded-2xl border animate-pulse ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/60 border-slate-200/60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-4 rounded w-2/3 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                  <div className={`h-3 rounded w-8 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                </div>
                <div className={`h-3 rounded w-1/3 mb-4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <div className="flex gap-2">
                  <div className={`h-6 rounded-full w-16 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                  <div className={`h-6 rounded-full w-12 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center opacity-30 text-slate-400 group cursor-default">
            <svg className="w-10 h-10 mb-2 transition-transform duration-700 group-hover:rotate-180 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-[10px] font-bold uppercase tracking-widest">{t.empty}</p>
          </div>
        ) : Object.keys(processedGroupedHistory).length === 0 && searchQuery ? (
          <div className="h-40 flex flex-col items-center justify-center opacity-50 text-slate-400 group cursor-default">
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <p className="text-[10px] font-bold uppercase tracking-widest">{t.noResultsFound}</p>
          </div>
        ) : (
          <div className={`${cardBg} p-5 rounded-3xl border ${cardBorder} shadow-[0_30px_60px_rgba(0,0,0,0.25)] transition-all mb-4 relative`}>
             <div 
               style={{ 
                 height: `${rowVirtualizer.getTotalSize()}px`, 
                 width: '100%', 
                 position: 'relative' 
               }}
             >
               {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                 const flatItem = flatItems[virtualRow.index];
                 if (flatItem.type === 'header') {
                   return (
                     <div
                       key={virtualRow.key}
                       id={`history-group-${flatItem.group.replace(/[\s\/,]+/g, '-')}`}
                       data-index={virtualRow.index}
                       ref={rowVirtualizer.measureElement}
                       className="w-full flex justify-center py-2 z-30 pointer-events-none"
                       style={{
                         position: 'absolute',
                         top: 0,
                         left: 0,
                         transform: `translateY(${virtualRow.start}px)`
                       }}
                     >
                       <div className="flex items-center gap-2">
                         <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-full border border-white/10 shadow-lg uppercase tracking-widest relative z-30">
                           {flatItem.group}
                         </span>
                         <span className={`${activeColors?.primary || 'bg-indigo-600'} backdrop-blur-md text-white text-[10px] font-black px-2 py-1.5 rounded-full border border-white/20 shadow-lg shadow-black/10 relative z-30`}>
                           {flatItem.count}
                         </span>
                       </div>
                     </div>
                   );
                 } else {
                   const { item, isDuplicate } = flatItem;
                   return (
                     <div
                       key={virtualRow.key}
                       data-index={virtualRow.index}
                       ref={rowVirtualizer.measureElement}
                       style={{
                         position: 'absolute',
                         top: 0,
                         left: 0,
                         width: '100%',
                         transform: `translateY(${virtualRow.start}px)`
                       }}
                     >
                       <div className="pb-3">
                         <HistoryItemCard 
                           item={item}
                           activeHistoryId={activeHistoryId}
                           loadHistoryItem={loadHistoryItem}
                           onDeleteHistoryItem={onDeleteHistoryItem}
                           toggleFavorite={toggleFavorite}
                           isDark={isDark}
                           activeColors={activeColors}
                           appLang={appLang}
                           getSensitiveMatches={getSensitiveMatches}
                           isDuplicate={isDuplicate}
                         />
                       </div>
                     </div>
                   );
                 }
               })}
              </div>
          </div>
        )}
        <div ref={bottomRef} className="mt-2 flex flex-col gap-3 pb-4">
            {isHistoryLoading && (
              <div className={`p-4 rounded-2xl border animate-pulse ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/60 border-slate-200/60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-4 rounded w-2/3 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                  <div className={`h-3 rounded w-8 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                </div>
                <div className={`h-3 rounded w-1/3 mb-4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <div className="flex gap-2">
                  <div className={`h-6 rounded-full w-16 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                  <div className={`h-6 rounded-full w-12 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
