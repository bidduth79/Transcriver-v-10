
import React, { useState, useMemo } from 'react';
import { SummaryModal } from '../../components/modals/SummaryModal';
import { ReportModal } from '../../components/modals/ReportModal';
import { FullscreenAnalysis } from '../../components/modals/FullscreenAnalysis';
import { SpeakerProfileSidebar } from '../../components/modals/SpeakerProfileSidebar';
import { ProcessingView } from './ProcessingView.tsx';
import { TranscriptToolbar } from './TranscriptToolbar';
import { TranscriptViewer, renderFormattedTranscriptInternal } from './TranscriptViewer';
import { useTranscriptScroll, useTranscriptSync, useLogoAnimation, useSensitiveKeywords } from './hooks/useTranscriptOutput';
import { useBgbAnalysis } from './hooks/useBgbAnalysis';
import { useSpeakerProfile } from '../../hooks/useSpeakerProfile';

export const TranscriptOutput = ({
  t, status, isSearchExpanded, setIsSearchExpanded, transcriptSearchInputRef, searchTerm,
  handleSearchChange, activeColors, downloadText, setStatus, setTranscript,
  mainBgColor, fileUrl, textColor, isDark, setIsSidebarOpen, fileMeta, processTranscription,
  transcriptCardBg, cardBorder, transcript,
  fontSize, setFontSize,
  matchCount, currentMatchIndex, goToNextMatch, goToPrevMatch, errorMessage, 
  transformTranscript, transformingType, scrollPercent = 0, addToast, appLang, history, onSeek, onModelUpdate, setIsAiLoading,
  audioCurrentTime = 0, activeTranscriptSourceMeta,
  progress = 0, currentStage = '', elapsedSeconds = 0, estimatedSeconds = 0,
  setActiveHistoryId, setTranscriptMeta
}) => {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const { logoOffset, logoContainerRef, handleLogoMouseMove, handleLogoMouseLeave } = useLogoAnimation();
  const { isSynced, isKaraokeEnabled, setIsKaraokeEnabled, transcriptSegments } = useTranscriptSync(fileUrl, transcript, activeTranscriptSourceMeta, fileMeta, status);
  const { scrollContainerRef, transcriptEndRef, localScrollPercent, handleScroll, handleUserInteraction, scrollToTop, scrollToBottom } = useTranscriptScroll(matchCount, searchTerm, currentMatchIndex, isSynced, isKaraokeEnabled, status, transcript, audioCurrentTime);
  const { sensitiveMatches, sensitiveWordCounts, isSensitive } = useSensitiveKeywords(transcript);
  const { isBgbAnalysisEnabled, setIsBgbAnalysisEnabled, bgbAnalysisResult, isAnalyzing, triggerAnalysis } = useBgbAnalysis(transcript, sensitiveMatches);
  const { isOpen: isSpeakerProfileOpen, speakerName, profile: speakerProfile, isLoading: isSpeakerLoading, error: speakerError, openProfile, closeProfile, refreshProfile, updateCustomNote } = useSpeakerProfile(transcript || '');

  const clearSearch = () => {
    handleSearchChange({ target: { value: '' } });
    transcriptSearchInputRef.current?.focus();
  };

  const handleSummaryClick = () => {
    setIsSummaryOpen(true);
  };

  const isDisabled = status !== 'completed';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm) {
      e.preventDefault();
      goToNextMatch();
    }
  };

  // UPDATED: Points to local file in /public/background.jpg
  const BACKGROUND_IMAGE_URL = "/background.jpg";

  return (
    <section className="flex-1 flex flex-col overflow-hidden relative transition-all duration-500 ease-in-out">
      {/* Header */}
      <TranscriptToolbar
        t={t}
        status={status}
        isSynced={isSynced}
        transcriptSegments={transcriptSegments}
        isKaraokeEnabled={isKaraokeEnabled}
        setIsKaraokeEnabled={setIsKaraokeEnabled}
        appLang={appLang}
        handleSummaryClick={handleSummaryClick}
        setIsReportOpen={setIsReportOpen}
        isDisabled={isDisabled}
        activeColors={activeColors}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        handleKeyDown={handleKeyDown}
        clearSearch={clearSearch}
        transcriptSearchInputRef={transcriptSearchInputRef}
        matchCount={matchCount}
        currentMatchIndex={currentMatchIndex}
        goToPrevMatch={goToPrevMatch}
        goToNextMatch={goToNextMatch}
        fontSize={fontSize}
        setFontSize={setFontSize}
        transformTranscript={transformTranscript}
        transformingType={transformingType}
        downloadText={downloadText}
        setIsAnalysisOpen={setIsAnalysisOpen}
        setTranscript={setTranscript}
        setStatus={setStatus}
        addToast={addToast}
        setActiveHistoryId={setActiveHistoryId}
        fileMeta={fileMeta}
        transcript={transcript}
        sensitiveMatches={sensitiveMatches}
      />

      {/* Main Content Area */}
      <div className={`flex-1 overflow-hidden relative transition-colors duration-700`}>
        {/* BACKGROUND IMAGE LAYER - ABSOLUTE */}
        <div className="absolute inset-0 z-0">
            {/* Overlay to ensure text readability against the global video background */}
            <div className={`absolute inset-0 ${isDark ? 'bg-slate-900/40' : 'bg-white/40'} backdrop-blur-sm pointer-events-none`}></div>
        </div>

        {/* Loading Spinner - for Transformations */}
        {transformingType !== null && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-16 h-16 border-4 border-indigo-400/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
            <p className="text-white font-black uppercase tracking-widest text-sm animate-pulse">{t.processingHeader}...</p>
          </div>
        )}

        {/* PROCESSING STATE (Empty Transcript) */}
        {status === 'processing' && !transcript && (
          <ProcessingView 
            t={t} 
            isDark={isDark} 
            textColor={textColor} 
            activeColors={activeColors} 
            progress={progress} 
            currentStage={currentStage} 
            elapsedSeconds={elapsedSeconds} 
            estimatedSeconds={estimatedSeconds} 
          />
        )}

        {/* IDLE STATE */}
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none p-6 md:p-12 text-center animate-in fade-in duration-500 z-10">
            {!fileUrl ? (
              <div className="relative z-10 flex flex-col items-center">
                
                {/* LOGO AREA */}
                <div 
                  className="mb-8 mx-auto relative w-48 h-48 flex items-center justify-center"
                  onMouseMove={handleLogoMouseMove}
                  onMouseLeave={handleLogoMouseLeave}
                  ref={logoContainerRef}
                >
                    <div 
                      className="transition-transform duration-300 ease-out"
                      style={{ transform: `translate(${logoOffset.x}px, ${logoOffset.y}px)` }}
                    >
                      <div className="animate-float">
                        <img 
                            src="/logo.png" 
                            alt="App Logo" 
                            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl opacity-90"
                        />
                      </div>
                    </div>
                </div>
                
                <h3 className={`text-lg md:text-xl font-black uppercase tracking-[0.4em] mb-4 opacity-70 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t.noMedia}</h3>
                <p className={`text-[10px] md:text-xs font-bold max-w-sm leading-relaxed opacity-60 mx-auto ${isDark ? 'text-white' : 'text-slate-700'}`}>{t.noMediaDesc}</p>
                <button onClick={() => setIsSidebarOpen(true)} className={`mt-8 md:mt-10 px-8 md:px-10 py-3 md:py-4 ${activeColors.primary} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-95 transition-all group cursor-pointer`}><svg className="w-4 h-4 mr-2 inline-block transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16m-7 6h7"/></svg>{t.openMenu}</button>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-80 scale-100 md:scale-110 relative z-10">
                <div className="w-24 h-24 md:w-32 md:h-32 mb-6 animate-bounce">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-xl" />
                </div>
                <h3 className={`text-xl md:text-2xl font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t.fileReady}</h3>
                <p className={`text-[10px] md:text-[11px] font-black text-white/80 uppercase tracking-widest bg-black/20 backdrop-blur-md px-3 py-1 rounded-full mb-8 max-w-md truncate shadow-sm border border-white/10`}>{fileMeta.name}</p>
                <button onClick={processTranscription} className={`px-12 md:px-16 py-4 md:py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-full text-xs md:text-sm font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all active:scale-95 border border-white/10 relative overflow-hidden group cursor-pointer`}><span className="relative z-10">{t.startTranscribe}</span><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div></button>
              </div>
            )}
          </div>
        )}

        {/* COMPLETED OR PROCESSING WITH TRANSCRIPT STATE */}
        {(status === 'completed' || (status === 'processing' && transcript)) && (
          <>
            <div 
              ref={scrollContainerRef} 
              onScroll={handleScroll} 
              onWheel={handleUserInteraction}
              onTouchMove={handleUserInteraction}
              onMouseDown={handleUserInteraction}
              onKeyDown={handleUserInteraction}
              className={`h-full w-full overflow-y-auto transcript-scrollbar p-6 md:p-8 lg:p-16 xl:p-24 relative z-10 animate-in slide-in-from-bottom-8 duration-700 ${isSensitive ? (isDark ? 'bg-red-950/10' : 'bg-red-50/30') : ''}`}
              style={status === 'processing' ? { maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)' } : {}}
            >
              <div className="max-w-6xl mx-auto relative">
                {/* FLOATING SENSITIVE WORDS BOX */}
                {sensitiveMatches?.length > 0 && (
                  <div className="absolute top-0 right-full h-full mr-6 xl:mr-10 z-30">
                    <div className={`sticky top-8 max-h-[calc(100vh-6rem)] w-48 md:w-56 flex flex-col gap-4 animate-in slide-in-from-top-8 duration-700 hidden xl:flex`}>
                      <div className={`p-4 rounded-3xl shadow-2xl backdrop-blur-xl border border-red-500/20 flex flex-col min-h-0 shrink ${isDark ? 'bg-slate-900/90' : 'bg-white/95'}`}>
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-red-500/20 shrink-0">
                          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          </div>
                          <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            {appLang === 'bn' ? 'সার্চিং ওয়ার্ড' : 'Searching Words'}
                          </h4>
                        </div>
                        
                        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                          {sensitiveWordCounts?.map((item, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => {
                                if (searchTerm === item.word) {
                                  goToNextMatch();
                                } else {
                                  handleSearchChange({ target: { value: item.word } } as any);
                                }
                              }}
                              className={`cursor-pointer flex items-center justify-between text-[10px] md:text-[11px] font-black tracking-wide px-3 py-2 rounded-xl shrink-0 transition-colors ${isDark ? 'bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/30' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100'}`} 
                              title={item.word}
                            >
                              <span className="truncate mr-2">{item.word}</span>
                              <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] ${isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-200/50 text-red-700'}`}>
                                {item.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* NEW BGB Analysis Card */}
                      <div className={`shrink-0 p-4 rounded-3xl shadow-2xl backdrop-blur-xl border overflow-y-auto custom-scrollbar transition-colors duration-500 ${
                          !isBgbAnalysisEnabled ? (isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200') :
                          isAnalyzing ? (isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-100/95 border-slate-200') :
                          bgbAnalysisResult?.remark === 'Positive' ? (isDark ? 'bg-emerald-950/90 border-emerald-500/40' : 'bg-emerald-50/95 border-emerald-400') :
                          bgbAnalysisResult?.remark === 'Negative' ? (isDark ? 'bg-red-950/90 border-red-500/40' : 'bg-red-50/95 border-red-400') :
                          (isDark ? 'bg-yellow-950/90 border-yellow-500/40' : 'bg-yellow-50/95 border-yellow-400')
                      }`}>
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10 shrink-0">
                          <div className="flex items-center gap-2">
                            {isBgbAnalysisEnabled && (bgbAnalysisResult || isAnalyzing) ? (
                              isAnalyzing ? (
                                  <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                  <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${
                                    bgbAnalysisResult?.remark === 'Positive' ? 'bg-emerald-500' :
                                    bgbAnalysisResult?.remark === 'Negative' ? 'bg-red-500' :
                                    'bg-yellow-500'
                                  }`}></div>
                              )
                            ) : (
                               <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
                            )}
                            <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${
                                !isBgbAnalysisEnabled || (!bgbAnalysisResult && !isAnalyzing) ? (isDark ? 'text-slate-500' : 'text-slate-500') :
                                isAnalyzing ? (isDark ? 'text-slate-400' : 'text-slate-600') :
                                bgbAnalysisResult?.remark === 'Positive' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') :
                                bgbAnalysisResult?.remark === 'Negative' ? (isDark ? 'text-red-400' : 'text-red-600') :
                                (isDark ? 'text-yellow-400' : 'text-yellow-600')
                            }`}>
                              {!isBgbAnalysisEnabled ? 'BGB Analysis' : isAnalyzing ? 'Analyzing...' : bgbAnalysisResult?.remark || 'Ready to Analyze'}
                            </h4>
                          </div>
                          
                          <button
                            onClick={() => setIsBgbAnalysisEnabled(!isBgbAnalysisEnabled)}
                            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isBgbAnalysisEnabled ? 'bg-indigo-500' : 'bg-slate-600'}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isBgbAnalysisEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        
                        {isBgbAnalysisEnabled && (
                          <div className="flex flex-col gap-2 min-h-0 shrink-0">
                            {!bgbAnalysisResult && !isAnalyzing ? (
                               <button 
                                 onClick={triggerAnalysis}
                                 className={`w-full py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                               >
                                 Start Analysis
                               </button>
                            ) : (
                               <p className={`text-[10px] md:text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                 {isAnalyzing ? 'Checking context for BGB impact...' : bgbAnalysisResult?.details}
                               </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className={`p-6 md:p-10 lg:p-20 rounded-[2rem] md:rounded-[3rem] border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-700 group/content backdrop-blur-xl ${
                  isSensitive 
                    ? (isDark ? 'bg-red-950/30 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'bg-red-50/80 border-red-200 shadow-[0_0_30px_rgba(239,68,68,0.1)]')
                    : (isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-white/40')
                }`}>
                <div style={{ fontSize: `${fontSize}px` }} className={`font-sans leading-relaxed text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {/* HEADER SECTION */}
                    <div className={`mb-8 pb-6 border-b text-center ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <h1 className={`text-2xl md:text-3xl font-black mb-3 leading-tight break-words text-balance mx-auto max-w-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {activeTranscriptSourceMeta?.name?.replace(/\.[^/.]+$/, "")?.replace(/_/g, ' ')?.replace(/#/g, '')?.replace(/\s+/g, ' ')?.trim() || t.transcript}
                      </h1>
                      <div className={`flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {activeTranscriptSourceMeta?.channelName && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            <span>{activeTranscriptSourceMeta.channelName}</span>
                          </div>
                        )}
                        {activeTranscriptSourceMeta?.date && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/></svg>
                            <span>{new Date(activeTranscriptSourceMeta.date).toLocaleDateString(appLang === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        )}
                        {activeTranscriptSourceMeta?.duration && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span>{activeTranscriptSourceMeta.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 
                       CRITICAL FIX: 
                       Check if transcriptSegments has items. If not (meaning timestamps missing or parsing failed),
                       fallback to renderFormattedTranscriptInternal instead of showing a blank synced view.
                    */}
                    <TranscriptViewer
                      transcriptSegments={transcriptSegments}
                      audioCurrentTime={audioCurrentTime}
                      fontSize={fontSize}
                      isDark={isDark}
                      searchTerm={searchTerm}
                      currentMatchIndex={currentMatchIndex}
                      isSynced={isSynced}
                      isKaraokeEnabled={isKaraokeEnabled}
                      transcript={transcript}
                      sensitiveMatches={sensitiveMatches}
                      onSeek={onSeek}
                      onSpeakerClick={openProfile}
                    />
                    <div ref={transcriptEndRef} />
                </div>
              </div>
              {status === 'completed' && (
                <div className="h-32 md:h-40 flex items-center justify-center">
                  <button 
                    onClick={() => {
                      setTranscript('');
                      setStatus('idle');
                      if (setActiveHistoryId) setActiveHistoryId(null);
                      // Clear transcriptMeta so activeTranscriptSourceMeta falls back to fileMeta
                      // This ensures isSynced becomes true when transcribing again
                      if (typeof setTranscriptMeta === 'function') {
                        setTranscriptMeta(null);
                      }
                    }} 
                    className="px-8 md:px-10 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {appLang === 'bn' ? 'নতুন করে চেষ্টা করুন' : 'Try Again'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* FLOATING TYPING INDICATOR */}
          {status === 'processing' && (
            <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border ${isDark ? 'bg-slate-900/80 border-slate-700/50 text-indigo-400' : 'bg-white/90 border-slate-200/50 text-indigo-600'}`}>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-sm tracking-wide">{appLang === 'bn' ? 'টাইপিং চলছে...' : 'Typing...'}</span>
              </div>
            </div>
          )}
        </>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 text-center animate-in fade-in duration-500 z-10">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20 backdrop-blur-md"><svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            <h3 className="text-xl md:text-2xl font-black text-red-500 uppercase tracking-widest mb-4">এরর হয়েছে!</h3>
            <p className={`text-xs md:text-sm font-bold max-w-md leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{errorMessage}</p>
            <button onClick={() => setStatus('idle')} className="mt-8 px-8 md:px-10 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl cursor-pointer">নতুন করে চেষ্টা করুন</button>
          </div>
        )}
      </div>

      {(status === 'completed' || (status === 'processing' && transcript)) && (
        <div className="absolute right-4 md:right-8 bottom-1/2 translate-y-1/2 flex flex-col items-center z-50 pointer-events-none hidden md:flex">
          <div className={`pointer-events-auto flex flex-col items-center bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-full py-2 px-1 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-500 scale-90 md:scale-100 ${localScrollPercent > 5 && localScrollPercent < 95 ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-4 hover:opacity-100 hover:translate-x-0'}`}>
            <button 
              onClick={scrollToTop} 
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 mb-1 ${localScrollPercent > 5 ? 'opacity-100 scale-100 text-white hover:bg-white/10' : 'opacity-0 scale-50 pointer-events-none'}`}
              title="Scroll to Top"
            >
              <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
            </button>
            <div className="flex flex-col items-center py-2 relative">
               <div className="w-0.5 h-16 bg-white/10 rounded-full overflow-hidden relative">
                  <div 
                    className={`absolute top-0 left-0 w-full transition-all duration-300 ${activeColors.primary}`}
                    style={{ height: `${localScrollPercent}%` }}
                  ></div>
               </div>
               <span className="text-[10px] font-black text-white mt-2 rotate-90 whitespace-nowrap tabular-nums">{localScrollPercent}%</span>
            </div>
            <button 
              onClick={scrollToBottom} 
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 mt-1 ${localScrollPercent < 95 ? 'opacity-100 scale-100 text-white hover:bg-white/10' : 'opacity-0 scale-50 pointer-events-none'}`}
              title="Scroll to Bottom"
            >
              <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <SummaryModal 
        isOpen={isSummaryOpen} 
        onClose={() => setIsSummaryOpen(false)} 
        transcript={transcript} 
        activeColors={activeColors} 
        isDark={isDark} 
        appLang={appLang}
        searchTerm={searchTerm}
        matchCount={matchCount}
        fileMeta={fileMeta}
        addToast={addToast}
        onSeek={onSeek}
        onModelUpdate={onModelUpdate}
        setIsAiLoading={setIsAiLoading}
      />
      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        transcript={transcript} 
        activeColors={activeColors} 
        isDark={isDark} 
        appLang={appLang} 
        fileMeta={fileMeta}
        searchTerm={searchTerm}
        addToast={addToast}
        onModelUpdate={onModelUpdate}
        setIsAiLoading={setIsAiLoading}
      />
      <FullscreenAnalysis 
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        history={history}
        transcript={transcript}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        renderFormattedTranscript={(text) => renderFormattedTranscriptInternal(text, searchTerm, isDark, currentMatchIndex, sensitiveMatches, onSeek, openProfile)}
        loadHistoryItem={(h) => {
          setTranscript(h.transcript);
          setStatus('completed');
          setIsAnalysisOpen(false);
          addToast(appLang === 'bn' ? "হিস্টোরি লোড হয়েছে" : "History loaded", 'info');
        }}
      />
      <SpeakerProfileSidebar 
        isOpen={isSpeakerProfileOpen}
        onClose={closeProfile}
        speakerName={speakerName}
        profile={speakerProfile}
        isLoading={isSpeakerLoading}
        error={speakerError}
        onRefresh={refreshProfile}
        onUpdateCustomNote={updateCustomNote}
        onSeek={onSeek}
      />
    </section>
  );
};
