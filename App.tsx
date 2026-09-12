
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

// Expose Swal to window for inline onclick handlers in HTML strings
(window as any).Swal = Swal;

import { GoogleGenAI } from "@google/genai";
import { Header } from './components/layout/Header';
import { Sidebar } from './features/sidebar/Sidebar';
import { ExpandedHistory } from './features/sidebar/ExpandedHistory';
import { TranscriptOutput } from './features/transcript/TranscriptOutput';
import { Footer } from './components/layout/Footer';
import { SpiderWebBackground } from './components/layout/Background';
import { InformationModal } from './components/modals/InformationModal';
import { ToolsModal } from './components/modals/ToolsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ActivityLogsModal } from './components/modals/ActivityLogsModal';
import { TranscriberReportModal } from './components/reports/TranscriberReportModal';
import { SuccessModal } from './components/modals/SuccessModal'; 
import { BatchSummaryModal } from './components/modals/BatchSummaryModal';
import { YouTubeMonitor } from './features/youtube-monitor/components/YouTubeMonitor';
import { getActiveProvider, incrementTotalCalls, getTotalCalls } from './services/ApiKeyManager';
import { useTranscription } from './hooks/useTranscription';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useHistory } from './hooks/useHistory';
import { useTranscriptSearch } from './hooks/useTranscriptSearch';
import { useTransformTranscript } from './hooks/useTransformTranscript';
import { useApiStats } from './hooks/useApiStats';
import { useAppTheme } from './hooks/useAppTheme';
import { useAppModals } from './hooks/useAppModals';
import { useBatchProcessor } from './hooks/useBatchProcessor';
import { translations } from './translations';
import { useToast } from './hooks/useToast';
import { loadAudioFromStore } from './utils/audioUtils';
import { useFileHandler } from './hooks/useFileHandler';

const App: React.FC = () => {
  const {
    theme, setTheme, appLang, setAppLang, fontSize, setFontSize,
    isDark, t, activeColors, mainBgColor, textColor, cardBg, cardBorder, subTextColor
  } = useAppTheme();

  const {
    isSidebarOpen, setIsSidebarOpen,
    isInformationOpen, setIsInformationOpen,
    isActivityLogOpen, setIsActivityLogOpen,
    isReportOpen, setIsReportOpen,
    isSettingsOpen, setIsSettingsOpen,
    activeTool, setActiveTool,
    isToolsMinimized, setIsToolsMinimized
  } = useAppModals();

  const {
    totalApiCalls, activeApiKeySource, activeModelName,
    isAiLoading, setIsAiLoading, updateApiStats
  } = useApiStats();

  const { addToast } = useToast(appLang);

  // Custom Hooks
  const {
    history, historyLimit, setHistoryLimit,
    isHistoryFullscreen, setIsHistoryFullscreen,
    activeHistoryId, setActiveHistoryId,
    histSearch, setHistSearch,
    histDateFilter, setHistDateFilter,
    histSentimentFilter, setHistSentimentFilter,
    showFavoritesOnly, setShowFavoritesOnly,
    toggleFavorite, backupHistory, restoreHistory,
    loadHistory, handleDeleteHistoryItem, groupHistory, filteredHistory
  } = useHistory(appLang, addToast, (id) => {
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
      setTranscript('');
      setStatus('idle');
    }
  });

  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          const startTime = now + (i * 0.08);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
          osc.start(startTime);
          osc.stop(startTime + 0.8);
      });
    } catch (e) {
      console.error("Failed to play notification sound:", e);
    }
  };

  const {
    status, setStatus,
    transcript, setTranscript,
    errorMessage, setErrorMessage,
    progress, setProgress,
    currentStage, setCurrentStage,
    elapsedSeconds, setElapsedSeconds,
    estimatedSeconds, setEstimatedSeconds,
    file, setFile,
    fileUrl, setFileUrl,
    fileMeta, setFileMeta,
    showSuccessModal, setShowSuccessModal,
    processTranscription, resetAll: resetTranscription
  } = useTranscription(appLang, addToast, loadHistory, updateApiStats, playSuccessSound);

  const handleResetAll = () => {
    resetTranscription();
    setActiveHistoryId(null);
    setTranscriptMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    const folderInput = document.getElementById('folderInput') as HTMLInputElement;
    if (folderInput) {
      folderInput.value = '';
    }
  };

  // Separate state for transcript metadata (to compare with loaded file)
  const [transcriptMeta, setTranscriptMeta] = useState<any>(null);

  const {
    searchTerm, setSearchTerm,
    currentMatchIndex, setCurrentMatchIndex,
    matchCount, setMatchCount,
    transcriptSearchInputRef,
    goToNextMatch, goToPrevMatch
  } = useTranscriptSearch(transcript);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    batchQueue, setBatchQueue,
    currentBatchIndex, setCurrentBatchIndex,
    isBatchProcessing, setIsBatchProcessing,
    hasBatchStarted, setHasBatchStarted,
    isBatchPaused, setIsBatchPaused,
    isExtendedPause,
    batchCountdown, setBatchCountdown,
    failedFiles, processedCount, retryFailedFiles,
    progress: batchProgress, etaSeconds,
    isBatchSummaryOpen, setIsBatchSummaryOpen,
    startBatch, pauseBatch, resumeBatch, cancelBatch, skipNextBatchFile, jumpToBatchFile, removeBatchFile
  } = useBatchProcessor(
    appLang, addToast, setFile, setFileUrl, setActiveHistoryId, setTranscriptMeta, setFileMeta, processTranscription
  );

  const { handleFileChange } = useFileHandler({
    appLang,
    addToast,
    setFile,
    setFileUrl,
    fileUrl,
    setActiveHistoryId,
    setTranscriptMeta,
    setTranscript,
    setStatus,
    setFileMeta,
    processTranscription,
    history,
    setBatchQueue,
    setCurrentBatchIndex,
    setIsBatchProcessing,
    setHasBatchStarted,
    setIsBatchPaused,
    setBatchCountdown,
    fileInputRef
  });

  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecorder(
    appLang, addToast, (recordedFile) => handleFileChange({ target: { files: [recordedFile] } })
  );

  // Audio Player & Sync
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  useEffect(() => {
    loadHistory();
    updateApiStats();
    
    const handleHistoryUpdate = () => {
      loadHistory();
    };
    window.addEventListener(`store-updated-studio_history`, handleHistoryUpdate);
    
    const handleApiKeysUpdate = () => {
      updateApiStats();
    };
    window.addEventListener(`store-updated-api_keys`, handleApiKeysUpdate);
    window.addEventListener(`active-api-key-changed`, handleApiKeysUpdate);
    
    const handleAppError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addToast(customEvent.detail.message, 'error');
    };
    window.addEventListener('app-error', handleAppError);
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setAudioCurrentTime(audioRef.current.currentTime);
      }
    };
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.addEventListener('timeupdate', handleTimeUpdate);
    }
    return () => {
      window.removeEventListener(`store-updated-studio_history`, handleHistoryUpdate);
      window.removeEventListener(`store-updated-api_keys`, handleApiKeysUpdate);
      window.removeEventListener(`active-api-key-changed`, handleApiKeysUpdate);
      window.removeEventListener('app-error', handleAppError);
      if (audioEl) audioEl.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [fileUrl, loadHistory, updateApiStats, addToast]);



  const {
    transformingType,
    handleTransformTranscript
  } = useTransformTranscript(transcript, setTranscript, appLang, addToast, updateApiStats);

  const handleSeek = (time: string) => {
    if (!audioRef.current) return;
    // Strip brackets and split
    const cleanTime = time.replace(/[\[\]]/g, '');
    const parts = cleanTime.split(/[-:]/).map(s => s.trim()).filter(s => s);
    // Simple check if it matches MM:SS or HH:MM:SS, taking first part if range
    const target = parts.length > 0 ? parts.slice(0, 3).join(':') : "00:00"; 
    
    // Convert target to seconds
    const tParts = target.split(':').map(Number);
    let seconds = 0;
    if (tParts.length === 1) seconds = tParts[0];
    else if (tParts.length === 2) seconds = tParts[0] * 60 + tParts[1];
    else if (tParts.length === 3) seconds = tParts[0] * 3600 + tParts[1] * 60 + tParts[2];
    
    audioRef.current.currentTime = seconds;
    audioRef.current.play();
  };



  return (
    <div className={`flex h-screen overflow-hidden ${mainBgColor} ${textColor} font-sans selection:bg-indigo-500/30 ${isExtendedPause ? 'shadow-[inset_0_0_80px_rgba(239,68,68,0.6)] animate-pulse transition-all duration-500' : ''}`}>
      <SpiderWebBackground opacity={isDark ? "opacity-[0.15]" : "opacity-[0.05]"} />
      


      <div className="relative flex h-screen w-full">
        {/* Sidebar */}
        <Sidebar 
          t={t}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          sidebarSide="left"
          bgColor={isDark ? 'bg-slate-900/50 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl'}
          activeColors={activeColors}
          cardBg={cardBg}
          cardBorder={cardBorder}
          isDark={isDark}
          subTextColor={subTextColor}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          fileUrl={fileUrl}
          resetAll={handleResetAll}
          fileMeta={fileMeta}
          audioRef={audioRef}
          processTranscription={() => processTranscription(file)}
          status={status}
          history={filteredHistory}
          historyLimit={historyLimit}
          setHistoryLimit={setHistoryLimit}
          setIsHistoryFullscreen={setIsHistoryFullscreen}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
          toggleFavorite={toggleFavorite}
          backupHistory={backupHistory}
          restoreHistory={restoreHistory}
          groupHistory={(items) => {
            const groups: any = {};
            (items || []).forEach(item => {
              const d = item?.date ? new Date(item.date).toLocaleDateString() : 'Unknown';
              if (!groups[d]) groups[d] = [];
              groups[d].push(item);
            });
            return groups;
          }}
          loadHistoryItem={async (item, searchKeyword) => {
            setTranscript(item.transcript);
            setStatus('completed');
            setTranscriptMeta({ name: item.fileName, duration: item.duration, channelName: item.channelName, date: item.publishedDate });
            // Mark item as opened and try to load audio
            await loadAudioFromStore(item, setFile, setFileMeta, setFileUrl, setTranscriptMeta, fileUrl || undefined);
            if (!item.hasBeenOpened) {
              loadHistory();
            }

            setActiveHistoryId(item.id);
            if (searchKeyword) {
              setTimeout(() => {
                setSearchTerm(searchKeyword);
              }, 100);
            }
          }}
          appLang={appLang}
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          activeHistoryId={activeHistoryId}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          histSentimentFilter={histSentimentFilter}
          setHistSentimentFilter={setHistSentimentFilter}
          batchQueue={batchQueue}
          currentBatchIndex={currentBatchIndex}
          isBatchProcessing={isBatchProcessing}
          hasBatchStarted={hasBatchStarted}
          isBatchPaused={isBatchPaused}
          batchCountdown={batchCountdown}
          startBatch={startBatch}
          pauseBatch={pauseBatch}
          resumeBatch={resumeBatch}
          cancelBatch={cancelBatch}
          skipNextBatchFile={skipNextBatchFile}
          removeBatchFile={removeBatchFile}
          jumpToBatchFile={jumpToBatchFile}
          failedFiles={failedFiles}
          retryFailedFiles={retryFailedFiles}
          progress={batchProgress}
          etaSeconds={etaSeconds}
        />

        {/* Sidebar Toggle Arrow - Hidden on Mobile to avoid overlay issues */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 z-50 w-5 h-24 bg-indigo-600 border border-l-0 border-white/20 rounded-r-lg flex items-center justify-center transition-all duration-500 shadow-xl cursor-pointer hover:bg-indigo-500 group hidden md:flex ${isSidebarOpen ? 'left-[400px]' : 'left-0'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <svg 
            className={`w-3 h-3 text-white transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300">
          <Header 
            t={t}
            status={status}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isInformationOpen={isInformationOpen}
            setIsInformationOpen={setIsInformationOpen}
            isActivityLogOpen={isActivityLogOpen}
            setIsActivityLogOpen={setIsActivityLogOpen}
            isDark={isDark}
            setTheme={(v) => setTheme(typeof v === 'function' ? v(theme) : v)}
            appLang={appLang}
            setAppLang={(v) => setAppLang(typeof v === 'function' ? v(appLang) : v)}
            activeColors={activeColors}
            setActiveTool={(tool) => {
              setActiveTool(prev => prev === tool ? null : tool);
            }}
            setIsReportOpen={setIsReportOpen}
            setIsSettingsOpen={setIsSettingsOpen}
          />

          <div className="flex-1 flex flex-col relative overflow-hidden">
            {isExtendedPause && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
                <div className="text-red-500 text-[12rem] font-black leading-none animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                  {batchCountdown}
                </div>
                <div className="text-white text-2xl font-medium mt-8 tracking-wide animate-pulse">
                  {appLang === 'bn' ? 'ইউটিউব ব্লক এড়াতে বিরতি চলছে...' : 'Pausing to prevent YouTube block...'}
                </div>
              </div>
            )}
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <YouTubeMonitor 
                isOpen={activeTool === 'youtube_monitor'}
              onClose={() => setActiveTool(null)}
              isDark={isDark}
              activeColors={activeColors}
              appLang={appLang}
              addToast={addToast}
              onLoadTranscript={async (transcript, title, duration, historyId, channelName, date, videoId) => {
                setTranscript(transcript);
                setStatus('completed');
                setTranscriptMeta({ name: title, duration, channelName, date });
                
                // Try to load audio from store if videoId is provided
                if (videoId) {
                  await loadAudioFromStore({ videoId, title, duration }, setFile, setFileMeta, setFileUrl, setTranscriptMeta, fileUrl || undefined);
                }

                setActiveTool(null); // Close monitor to show transcript
                if (historyId) {
                  setActiveHistoryId(historyId);
                }
              }}
              onStartTranscription={async (file, metadata, isAutoProcess) => {
                const fileObj = file as File;
                setFile(fileObj);
                setFileMeta(metadata);
                setTranscriptMeta(null); // Clear previous transcript meta
                if (fileUrl) URL.revokeObjectURL(fileUrl);
                setFileUrl(URL.createObjectURL(fileObj));
                setActiveTool(null); // Always close monitor to show file info and transcription
                const result = await processTranscription(fileObj, metadata, isAutoProcess);
                return result?.success ? result.text : undefined;
              }}
              isAppProcessing={status === 'processing'}
            />

            <TranscriptOutput 
              t={t}
              status={status}
              isSearchExpanded={true}
              setIsSearchExpanded={() => {}}
              transcriptSearchInputRef={transcriptSearchInputRef}
              searchTerm={searchTerm}
              handleSearchChange={(e) => setSearchTerm(e.target.value)}
              activeColors={activeColors}
              downloadText={() => {}}
              setStatus={setStatus}
              setTranscript={setTranscript}
              mainBgColor={mainBgColor}
              fileUrl={fileUrl}
              textColor={textColor}
              isDark={isDark}
              setIsSidebarOpen={setIsSidebarOpen}
              fileMeta={fileMeta}
              processTranscription={() => processTranscription(file)}
              transcriptCardBg={cardBg}
              cardBorder={cardBorder}
              transcript={transcript}
              fontSize={fontSize}
              setFontSize={setFontSize}
              matchCount={matchCount}
              currentMatchIndex={currentMatchIndex}
              goToNextMatch={goToNextMatch}
              goToPrevMatch={goToPrevMatch}
              errorMessage={errorMessage}
              addToast={addToast}
              appLang={appLang}
              history={history}
              progress={progress}
              currentStage={currentStage}
              elapsedSeconds={elapsedSeconds}
              estimatedSeconds={estimatedSeconds}
              audioCurrentTime={audioCurrentTime}
              activeTranscriptSourceMeta={transcriptMeta || fileMeta}
              transformTranscript={handleTransformTranscript}
              transformingType={transformingType}
              onSeek={handleSeek}
              onModelUpdate={updateApiStats}
              setIsAiLoading={setIsAiLoading}
              setActiveHistoryId={setActiveHistoryId}
              setTranscriptMeta={setTranscriptMeta}
            />
            </div>

            <div className="hidden md:block">
              <Footer 
                t={t}
                activeColors={activeColors}
                activeApiKeySource={activeApiKeySource}
                activeModelName={activeModelName}
                totalApiCalls={totalApiCalls}
                isAiLoading={isAiLoading}
                appLang={appLang}
                isDark={isDark}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {isHistoryFullscreen && (
        <ExpandedHistory 
          t={t}
          isDark={isDark}
          setIsHistoryFullscreen={setIsHistoryFullscreen}
          histSearch={histSearch}
          setHistSearch={setHistSearch}
          histDateFilter={histDateFilter}
          setHistDateFilter={setHistDateFilter}
          histSentimentFilter={histSentimentFilter}
          setHistSentimentFilter={setHistSentimentFilter}
          filteredHistory={filteredHistory}
          loadHistoryItem={async (item, searchKeyword) => {
             setTranscript(item.transcript);
             setStatus('completed');
             setTranscriptMeta({ name: item.fileName, duration: item.duration, channelName: item.channelName, date: item.publishedDate });
             
             // Mark item as opened and try to load audio
             await loadAudioFromStore(item, setFile, setFileMeta, setFileUrl, setTranscriptMeta, fileUrl || undefined);
             if (!item.hasBeenOpened) {
               loadHistory();
             }

             setActiveHistoryId(item.id);
             setIsHistoryFullscreen(false);
             if (searchKeyword) {
               setTimeout(() => {
                 setSearchTerm(searchKeyword);
               }, 100);
             }
          }}
          activeColors={activeColors}
        />
      )}

      <InformationModal 
        isOpen={isInformationOpen}
        onClose={() => setIsInformationOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        addToast={addToast}
      />

      <ToolsModal 
        activeTool={activeTool === 'youtube_monitor' ? null : activeTool}
        onClose={() => setActiveTool(null)}
        isMinimized={isToolsMinimized}
        setIsMinimized={setIsToolsMinimized}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        addToast={addToast}
        onFileSelect={(f) => handleFileChange({ target: { files: [f] } }, true)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        addToast={addToast}
      />

      <ActivityLogsModal 
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
      />

      <TranscriberReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
      />

      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        elapsedSeconds={elapsedSeconds} 
        appLang={appLang} 
      />

      <BatchSummaryModal 
        isOpen={isBatchSummaryOpen}
        onClose={() => setIsBatchSummaryOpen(false)}
        processedCount={processedCount}
        failedFiles={failedFiles}
        onRetryFailed={retryFailedFiles}
        appLang={appLang}
        isDark={isDark}
        activeColors={activeColors}
      />

      {/* 
      <ChatBot 
        activeColors={activeColors}
        isDark={isDark}
        appLang={appLang}
        addToast={addToast}
      /> 
      */}
    </div>
  );
};

export default App;
