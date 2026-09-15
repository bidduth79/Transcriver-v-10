
import React, { useState, useMemo } from 'react';
import { TranscriptModals } from './components/TranscriptModals';
import { TranscriptContent } from './components/TranscriptContent';
import { ProcessingView } from './ProcessingView.tsx';
import { useTranscriptScroll, useTranscriptSync, useLogoAnimation, useSensitiveKeywords } from './hooks/useTranscriptOutput';
import { useBgbAnalysis } from './hooks/useBgbAnalysis';
import { useSpeakerProfile } from '../../hooks/useSpeakerProfile';
import { TranscriptSidebarTools } from './components/TranscriptSidebarTools';
import { TranscriptScrollControls } from './components/TranscriptScrollControls';
import { TranscriptIdleView } from './components/TranscriptIdleView';
import { TranscriptErrorView } from './components/TranscriptErrorView';
import { TranscriptToolbar } from './TranscriptToolbar';
import { renderFormattedTranscriptInternal, escapeRegExp } from './TranscriptViewer';

export const TranscriptOutput = ({
  t, status, transcriptSearchInputRef, searchTerm,
  handleSearchChange, activeColors, setStatus, setTranscript,
  mainBgColor, fileUrl, textColor, isDark, setIsSidebarOpen, fileMeta, processTranscription,
  cardBorder, transcript,
  fontSize, setFontSize,
  matchCount, currentMatchIndex, goToNextMatch, goToPrevMatch, errorMessage, 
  transformTranscript, transformingType, addToast, appLang, history, onSeek, onModelUpdate, setIsAiLoading,
  audioCurrentTime = 0, activeTranscriptSourceMeta,
  progress = 0, currentStage = '', elapsedSeconds = 0, estimatedSeconds = 0,
  setActiveHistoryId, activeHistoryId, setTranscriptMeta, audioRef
}) => {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const { logoOffset, logoContainerRef, handleLogoMouseMove, handleLogoMouseLeave } = useLogoAnimation();
  const { isSynced, isKaraokeEnabled, setIsKaraokeEnabled, transcriptSegments } = useTranscriptSync(fileUrl, transcript, activeTranscriptSourceMeta, fileMeta, status);

  const handleToggleKaraoke = (enabled: boolean) => {
    setIsKaraokeEnabled(enabled);
    if (audioRef?.current) {
      if (!enabled) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((e: any) => console.warn('Audio play failed:', e));
      }
    }
  };

  const handleRenameSpeaker = async (oldName: string) => {
    const newName = window.prompt(appLang === 'bn' ? `"${oldName}" এর নতুন নাম দিন:` : `Rename "${oldName}" to:`, oldName);
    if (newName && newName.trim() !== '' && newName !== oldName) {
      // Find occurrences of **oldName** or **oldName:** and replace with newName
      const regex = new RegExp(`\\*\\*\\s*${escapeRegExp(oldName)}\\s*(:?)\\s*\\*\\*`, 'gi');
      const updatedTranscript = transcript.replace(regex, `**${newName}$1**`);
      setTranscript(updatedTranscript);
      addToast(appLang === 'bn' ? 'স্পীকারের নাম পরিবর্তন করা হয়েছে' : 'Speaker renamed successfully', 'success');
      
      if (activeHistoryId) {
        const { getFromStore, addToStore, STORES } = await import('../../services/db');
        const item: any = await getFromStore(STORES.HISTORY, activeHistoryId);
        if (item) {
          item.transcript = updatedTranscript;
          await addToStore(STORES.HISTORY, item);
        }
      }
    }
  };

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
        setIsKaraokeEnabled={handleToggleKaraoke}
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
      <div className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-700`}>
        {/* BACKGROUND IMAGE LAYER - ABSOLUTE */}
        <div className="absolute inset-0 z-0">
          {/* Overlay to ensure text readability against the global video background */}
            <div className={`absolute inset-0 ${isDark ? 'bg-slate-900/40' : 'bg-white/40'} pointer-events-none`}></div>
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

        {/* IDLE OR EMPTY COMPLETED STATE */}
        {(status === 'idle' || (status === 'completed' && !transcript)) && (
          <TranscriptIdleView 
            t={t}
            fileUrl={fileUrl}
            isDark={isDark}
            activeColors={activeColors}
            fileMeta={fileMeta}
            setIsSidebarOpen={setIsSidebarOpen}
            processTranscription={processTranscription}
            logoOffset={logoOffset}
            logoContainerRef={logoContainerRef}
            handleLogoMouseMove={handleLogoMouseMove}
            handleLogoMouseLeave={handleLogoMouseLeave}
          />
        )}

        {/* COMPLETED WITH TRANSCRIPT OR PROCESSING WITH TRANSCRIPT STATE */}
        {((status === 'completed' && transcript) || (status === 'processing' && transcript)) && (
          <>
            <div 
              ref={scrollContainerRef} 
              onScroll={handleScroll} 
              onWheel={handleUserInteraction}
              onTouchMove={handleUserInteraction}
              onMouseDown={handleUserInteraction}
              onKeyDown={handleUserInteraction}
              className={`flex-1 w-full overflow-y-auto transcript-scrollbar p-6 md:p-8 lg:p-16 xl:p-24 relative z-10 animate-in slide-in-from-bottom-8 duration-700 ${isSensitive ? (isDark ? 'bg-red-950/10' : 'bg-red-50/30') : ''}`}
            >
              <div className="max-w-6xl mx-auto relative">
                {/* FLOATING SENSITIVE WORDS BOX */}
                <TranscriptSidebarTools
                  sensitiveMatches={sensitiveMatches}
                  sensitiveWordCounts={sensitiveWordCounts}
                  appLang={appLang}
                  isDark={isDark}
                  searchTerm={searchTerm}
                  goToNextMatch={goToNextMatch}
                  handleSearchChange={handleSearchChange}
                  isBgbAnalysisEnabled={isBgbAnalysisEnabled}
                  setIsBgbAnalysisEnabled={setIsBgbAnalysisEnabled}
                  bgbAnalysisResult={bgbAnalysisResult}
                  isAnalyzing={isAnalyzing}
                  triggerAnalysis={triggerAnalysis}
                />

                <div className={`p-6 md:p-10 lg:p-20 rounded-[2rem] md:rounded-[3rem] border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-700 group/content ${
                  isSensitive 
                    ? (isDark ? 'bg-red-950/30 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'bg-red-50/80 border-red-200 shadow-[0_0_30px_rgba(239,68,68,0.1)]')
                    : (isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-white/40')
                }`}>
                <TranscriptContent
                  fontSize={fontSize}
                  isDark={isDark}
                  t={t}
                  activeTranscriptSourceMeta={activeTranscriptSourceMeta}
                  appLang={appLang}
                  transcriptSegments={transcriptSegments}
                  audioCurrentTime={audioCurrentTime}
                  searchTerm={searchTerm}
                  currentMatchIndex={currentMatchIndex}
                  isSynced={isSynced}
                  isKaraokeEnabled={isKaraokeEnabled}
                  transcript={transcript}
                  sensitiveMatches={sensitiveMatches}
                  onSeek={onSeek}
                  openProfile={openProfile}
                  onRenameSpeaker={handleRenameSpeaker}
                  transcriptEndRef={transcriptEndRef}
                />
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
          <TranscriptErrorView
            errorMessage={errorMessage}
            isDark={isDark}
            setStatus={setStatus}
          />
        )}
      </div>

      {(status === 'completed' || (status === 'processing' && transcript)) && (
        <TranscriptScrollControls
          localScrollPercent={localScrollPercent}
          scrollToTop={scrollToTop}
          scrollToBottom={scrollToBottom}
          activeColors={activeColors}
        />
      )}

      {/* Modals */}
      <TranscriptModals
        isSummaryOpen={isSummaryOpen}
        setIsSummaryOpen={setIsSummaryOpen}
        isReportOpen={isReportOpen}
        setIsReportOpen={setIsReportOpen}
        isAnalysisOpen={isAnalysisOpen}
        setIsAnalysisOpen={setIsAnalysisOpen}
        isSpeakerProfileOpen={isSpeakerProfileOpen}
        closeProfile={closeProfile}
        speakerName={speakerName}
        speakerProfile={speakerProfile}
        isSpeakerLoading={isSpeakerLoading}
        speakerError={speakerError}
        refreshProfile={refreshProfile}
        updateCustomNote={updateCustomNote}
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
        history={history}
        renderFormattedTranscriptInternal={renderFormattedTranscriptInternal}
        currentMatchIndex={currentMatchIndex}
        sensitiveMatches={sensitiveMatches}
        openProfile={openProfile}
        setTranscript={setTranscript}
        setStatus={setStatus}
      />
    </section>
  );
};
