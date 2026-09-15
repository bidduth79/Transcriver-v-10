
import React from 'react';
import { YouTubeInput } from '../tools/YouTubeInput.tsx';
import { HistoryItemCard } from './HistoryItemCard';
import { AudioVideoInput } from './AudioVideoInput';
import { FileInfoSection } from './FileInfoSection';
import { SidebarHistory } from './SidebarHistory';
import { useSidebarHistory } from './hooks/useSidebarHistory';
import { useSidebar } from './hooks/useSidebar';
import { BatchProcessingQueue } from './BatchProcessingQueue';

export const Sidebar = ({
  t, isSidebarOpen, setIsSidebarOpen, sidebarSide, bgColor, activeColors,
  cardBg, cardBorder, isDark, subTextColor, fileInputRef, handleFileChange,
  fileUrl, resetAll, fileMeta, audioRef, processTranscription, status,
  history = [], fullHistory = [], isLoadingHistory, historyLimit, setHistoryLimit, setIsHistoryFullscreen, groupHistory, loadHistoryItem, appLang,
  showFavoritesOnly, setShowFavoritesOnly, toggleFavorite, backupHistory, restoreHistory,
  isRecording, recordingTime, onStartRecording, onStopRecording,
  activeHistoryId, onDeleteHistoryItem,
  histSentimentFilter, setHistSentimentFilter,
  batchQueue = [], currentBatchIndex = 0, isBatchProcessing = false,
  hasBatchStarted = false, isBatchPaused = false, batchCountdown = 0,
  failedFiles = [], retryFailedFiles,
  progress = 0, etaSeconds = null,
  startBatch, pauseBatch, resumeBatch, cancelBatch, skipNextBatchFile, removeBatchFile, jumpToBatchFile, handleTimeUpdate,
  totalHistoryCount
}: any) => {
  const {
    activeTab,
    setActiveTab,
    playbackRate,
    getSensitiveMatches,
    formatTime,
    handleYouTubeSuccess,
    changePlaybackRate,
    skipTime,
    getHeaderTitle
  } = useSidebar(appLang, handleFileChange, audioRef);
  
  const { isHistoryLoading, bottomRef } = useSidebarHistory(history, historyLimit, setHistoryLimit);
  const [scrollContainerEl, setScrollContainerEl] = React.useState<HTMLDivElement | null>(null);

  const fullGroupedHistory = groupHistory(history);

  return (
    <aside 
      className={`h-full ${bgColor} z-[60] transition-all duration-500 ease-in-out transform flex flex-col overflow-hidden absolute md:relative
        ${isSidebarOpen ? 'w-full md:w-[400px] p-0 shadow-[25px_0_70px_-15px_rgba(0,0,0,0.5)]' : 'w-0 p-0'}
        ${sidebarSide === 'left' ? 'left-0 border-r border-slate-200/20' : 'right-0 border-l border-slate-200/20 shadow-[-25px_0_70px_-15px_rgba(0,0,0,0.5)]'}`}
    >
      <div className="flex flex-col h-full w-full md:w-[400px] overflow-hidden relative">
        
        {/* Mobile Close Button */}
        <div className="md:hidden absolute top-4 right-4 z-50">
           <button 
             onClick={() => setIsSidebarOpen(false)}
             className="p-3 bg-red-500 text-white rounded-full shadow-lg active:scale-95 transition-transform cursor-pointer group"
           >
             <svg className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Main Scrolling Container */}
        <div ref={setScrollContainerEl} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          
          {/* Audio/Video Input Section */}
          <AudioVideoInput
            t={t}
            isRecording={isRecording}
            activeColors={activeColors}
            getHeaderTitle={() => getHeaderTitle(isRecording, t)}
            cardBg={cardBg}
            cardBorder={cardBorder}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fileInputRef={fileInputRef}
            onStartRecording={onStartRecording}
            handleFileChange={handleFileChange}
            handleYouTubeSuccess={handleYouTubeSuccess}
            isDark={isDark}
            appLang={appLang}
            recordingTime={recordingTime}
            onStopRecording={onStopRecording}
            formatTime={formatTime}
          />

          {/* Batch Processing Queue */}
          <BatchProcessingQueue
            appLang={appLang}
            isDark={isDark}
            cardBg={cardBg}
            cardBorder={cardBorder}
            activeColors={activeColors}
            history={history}
            batchQueue={batchQueue}
            currentBatchIndex={currentBatchIndex}
            isBatchProcessing={isBatchProcessing}
            hasBatchStarted={hasBatchStarted}
            isBatchPaused={isBatchPaused}
            batchCountdown={batchCountdown}
            failedFiles={failedFiles}
            retryFailedFiles={retryFailedFiles}
            progress={progress}
            etaSeconds={etaSeconds}
            startBatch={startBatch}
            pauseBatch={pauseBatch}
            resumeBatch={resumeBatch}
            cancelBatch={cancelBatch}
            skipNextBatchFile={skipNextBatchFile}
            removeBatchFile={removeBatchFile}
            jumpToBatchFile={jumpToBatchFile}
          />

          {/* File Info Section */}
          <FileInfoSection
            fileUrl={fileUrl}
            isRecording={isRecording}
            t={t}
            resetAll={resetAll}
            cardBg={cardBg}
            cardBorder={cardBorder}
            isDark={isDark}
            subTextColor={subTextColor}
            fileMeta={fileMeta}
            activeColors={activeColors}
            audioRef={audioRef}
            handleTimeUpdate={handleTimeUpdate}
            skipTime={skipTime}
            playbackRate={playbackRate}
            changePlaybackRate={changePlaybackRate}
            processTranscription={processTranscription}
            setIsSidebarOpen={setIsSidebarOpen}
            status={status}
          />

          {/* History Section */}
          <SidebarHistory
            t={t}
            history={history}
            fullHistory={fullHistory}
            isLoadingHistory={isLoadingHistory}
            setIsHistoryFullscreen={setIsHistoryFullscreen}
            groupedHistory={fullGroupedHistory}
            cardBg={cardBg}
            cardBorder={cardBorder}
            activeHistoryId={activeHistoryId}
            loadHistoryItem={loadHistoryItem}
            onDeleteHistoryItem={onDeleteHistoryItem}
            isDark={isDark}
            activeColors={activeColors}
            appLang={appLang}
            getSensitiveMatches={getSensitiveMatches}
            bottomRef={bottomRef}
            isHistoryLoading={isHistoryLoading}
            historyLimit={historyLimit}
            setHistoryLimit={setHistoryLimit}
            scrollContainerEl={scrollContainerEl}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
            toggleFavorite={toggleFavorite}
            backupHistory={backupHistory}
            restoreHistory={restoreHistory}
            histSentimentFilter={histSentimentFilter}
            setHistSentimentFilter={setHistSentimentFilter}
            totalHistoryCount={totalHistoryCount}
          />
        </div>
      </div>
    </aside>
  );
};
