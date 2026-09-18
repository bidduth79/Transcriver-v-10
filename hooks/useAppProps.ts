import { loadAudioFromStore } from '../utils/audioUtils';

export function getSidebarProps(core: any) {
  return {
    t: core.t,
    isSidebarOpen: core.isSidebarOpen,
    setIsSidebarOpen: core.setIsSidebarOpen,
    sidebarSide: "left",
    bgColor: core.isDark ? 'bg-slate-900/50 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl',
    activeColors: core.activeColors,
    cardBg: core.cardBg,
    cardBorder: core.cardBorder,
    isDark: core.isDark,
    subTextColor: core.subTextColor,
    fileInputRef: core.fileInputRef,
    handleFileChange: core.handleFileChange,
    fileUrl: core.fileUrl,
    resetAll: core.handleResetAll,
    fileMeta: core.fileMeta,
    audioRef: core.audioRef,
    handleTimeUpdate: core.handleTimeUpdate,
    processTranscription: () => core.processTranscription(core.file),
    status: core.status,
    history: core.filteredHistory,
    fullHistory: core.history,
    totalHistoryCount: core.history.length,
    isLoadingHistory: core.isLoadingHistory,
    historyLimit: core.historyLimit,
    setHistoryLimit: core.setHistoryLimit,
    setIsHistoryFullscreen: core.setIsHistoryFullscreen,
    showFavoritesOnly: core.showFavoritesOnly,
    setShowFavoritesOnly: core.setShowFavoritesOnly,
    toggleFavorite: core.toggleFavorite,
    backupHistory: core.backupHistory,
    restoreHistory: core.restoreHistory,
    groupHistory: (items: any) => {
      const groups: any = {};
      (items || []).forEach((item: any) => {
        const d = item?.date ? new Date(item.date).toLocaleDateString('en-US') : 'Unknown';
        if (!groups[d]) groups[d] = [];
        groups[d].push(item);
      });
      return groups;
    },
    loadHistoryItem: async (item: any, searchKeyword?: string) => {
      core.setTranscript(item.transcript);
      core.setStatus('completed');
      core.setTranscriptMeta({ name: item.fileName, duration: item.duration, channelName: item.channelName, date: item.publishedDate });
      
      await loadAudioFromStore(item, core.setFile, core.setFileMeta, core.setFileUrl, core.setTranscriptMeta, core.fileUrl || undefined);
      if (!item.hasBeenOpened) {
        core.loadHistory();
      }

      core.setActiveHistoryId(item.id);
      if (searchKeyword) {
        setTimeout(() => {
          core.setSearchTerm(searchKeyword);
        }, 100);
      }
    },
    appLang: core.appLang,
    isRecording: core.isRecording,
    recordingTime: core.recordingTime,
    onStartRecording: core.startRecording,
    onStopRecording: core.stopRecording,
    activeHistoryId: core.activeHistoryId,
    onDeleteHistoryItem: core.handleDeleteHistoryItem,
    histSentimentFilter: core.histSentimentFilter,
    setHistSentimentFilter: core.setHistSentimentFilter,
    batchQueue: core.batchQueue,
    currentBatchIndex: core.currentBatchIndex,
    isBatchProcessing: core.isBatchProcessing,
    hasBatchStarted: core.hasBatchStarted,
    isBatchPaused: core.isBatchPaused,
    batchCountdown: core.batchCountdown,
    startBatch: core.startBatch,
    pauseBatch: core.pauseBatch,
    resumeBatch: core.resumeBatch,
    cancelBatch: core.cancelBatch,
    skipNextBatchFile: core.skipNextBatchFile,
    removeBatchFile: core.removeBatchFile,
    jumpToBatchFile: core.jumpToBatchFile,
    failedFiles: core.failedFiles,
    retryFailedFiles: core.retryFailedFiles,
    progress: core.batchProgress,
    etaSeconds: core.etaSeconds
  };
}

export function getAppModalsProps(core: any) {
  return {
    isInformationOpen: core.isInformationOpen,
    setIsInformationOpen: core.setIsInformationOpen,
    activeTool: core.activeTool,
    setActiveTool: core.setActiveTool,
    isToolsMinimized: core.isToolsMinimized,
    setIsToolsMinimized: core.setIsToolsMinimized,
    isSettingsOpen: core.isSettingsOpen,
    setIsSettingsOpen: core.setIsSettingsOpen,
    isActivityLogOpen: core.isActivityLogOpen,
    setIsActivityLogOpen: core.setIsActivityLogOpen,
    isReportOpen: core.isReportOpen,
    setIsReportOpen: core.setIsReportOpen,
    showSuccessModal: core.showSuccessModal,
    setShowSuccessModal: core.setShowSuccessModal,
    isBatchSummaryOpen: core.isBatchSummaryOpen,
    setIsBatchSummaryOpen: core.setIsBatchSummaryOpen,
    processedCount: core.processedCount,
    failedFiles: core.failedFiles,
    retryFailedFiles: core.retryFailedFiles,
    elapsedSeconds: core.elapsedSeconds,
    isDark: core.isDark,
    activeColors: core.activeColors,
    appLang: core.appLang,
    addToast: core.addToast,
    handleFileChange: core.handleFileChange
  };
}

export function getExpandedHistoryProps(core: any) {
  return {
    t: core.t,
    isDark: core.isDark,
    setIsHistoryFullscreen: core.setIsHistoryFullscreen,
    histSearch: core.histSearch,
    setHistSearch: core.setHistSearch,
    histDateFilter: core.histDateFilter,
    setHistDateFilter: core.setHistDateFilter,
    histSentimentFilter: core.histSentimentFilter,
    setHistSentimentFilter: core.setHistSentimentFilter,
    filteredHistory: core.filteredHistory,
    historyLimit: core.historyLimit,
    setHistoryLimit: core.setHistoryLimit,
    loadHistoryItem: async (item: any, searchKeyword?: string) => {
      core.setTranscript(item.transcript);
      core.setStatus('completed');
      core.setTranscriptMeta({ name: item.fileName, duration: item.duration, channelName: item.channelName, date: item.publishedDate });
      
      await loadAudioFromStore(item, core.setFile, core.setFileMeta, core.setFileUrl, core.setTranscriptMeta, core.fileUrl || undefined);
      if (!item.hasBeenOpened) {
        core.loadHistory();
      }

      core.setActiveHistoryId(item.id);
      core.setIsHistoryFullscreen(false);
      if (searchKeyword) {
        setTimeout(() => {
          core.setSearchTerm(searchKeyword);
        }, 100);
      }
    },
    activeColors: core.activeColors
  };
}

export function getYouTubeMonitorProps(core: any) {
  return {
    isOpen: core.activeTool === 'youtube_monitor',
    onClose: () => core.setActiveTool(null),
    isDark: core.isDark,
    activeColors: core.activeColors,
    appLang: core.appLang,
    addToast: core.addToast,
    onStartTranscription: core.processTranscription,
    isAppProcessing: core.status === 'processing',
    onLoadTranscript: async (transcript: string, title: string, duration: string | number, historyId?: string, channelName?: string, date?: string, videoId?: string) => {
      core.setTranscript(transcript);
      core.setStatus('completed');
      core.setTranscriptMeta({ name: title, duration, channelName, date });
      
      if (videoId) {
        try {
          const { getFromStore, STORES } = await import('../services/db');
          const localAudio = await getFromStore(STORES.YOUTUBE_AUDIO, videoId) as { blob: Blob } | undefined;
          if (localAudio && localAudio.blob) {
            const url = URL.createObjectURL(localAudio.blob);
            core.setFileUrl(url);
            core.setFile(new File([localAudio.blob], `${title}.m4a`, { type: 'audio/mp4' }));
          } else {
            core.setFileUrl('');
            core.setFile(null);
          }
        } catch (err) {
          console.error("Failed to load local audio:", err);
        }
      }
      
      core.setActiveHistoryId(historyId);
    }
  };
}

export function getTranscriptOutputProps(core: any) {
  return {
    t: core.t,
    status: core.status,
    transcriptSearchInputRef: core.transcriptSearchInputRef,
    searchTerm: core.searchTerm,
    handleSearchChange: (e: any) => core.setSearchTerm(e?.target?.value ?? ''),
    activeColors: core.activeColors,
    setStatus: core.setStatus,
    setTranscript: core.setTranscript,
    mainBgColor: core.mainBgColor,
    fileUrl: core.fileUrl,
    textColor: core.textColor,
    isDark: core.isDark,
    setIsSidebarOpen: core.setIsSidebarOpen,
    fileMeta: core.fileMeta,
    processTranscription: core.processTranscription,
    cardBorder: core.cardBorder,
    transcript: core.transcript,
    fontSize: core.fontSize,
    setFontSize: core.setFontSize,
    matchCount: core.matchCount,
    currentMatchIndex: core.currentMatchIndex,
    goToNextMatch: core.goToNextMatch,
    goToPrevMatch: core.goToPrevMatch,
    errorMessage: core.errorMessage,
    transformTranscript: core.handleTransformTranscript,
    transformingType: core.transformingType,
    addToast: core.addToast,
    appLang: core.appLang,
    history: core.history,
    onSeek: core.handleSeek,
    onModelUpdate: core.updateApiStats,
    setIsAiLoading: core.setIsAiLoading,
    audioCurrentTime: core.audioCurrentTime,
    activeTranscriptSourceMeta: core.transcriptMeta || core.fileMeta,
    progress: core.progress,
    currentStage: core.currentStage,
    elapsedSeconds: core.elapsedSeconds,
    estimatedSeconds: core.estimatedSeconds,
    setActiveHistoryId: core.setActiveHistoryId,
    activeHistoryId: core.activeHistoryId,
    setTranscriptMeta: core.setTranscriptMeta,
    audioRef: core.audioRef
  };
}
