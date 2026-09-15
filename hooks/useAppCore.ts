import { useState, useRef } from 'react';
import { useAppTheme } from './useAppTheme';
import { useAppModals } from './useAppModals';
import { useApiStats } from './useApiStats';
import { useToast } from './useToast';
import { useHistory } from './useHistory';
import { useTranscription } from './useTranscription';
import { useTranscriptSearch } from './useTranscriptSearch';
import { useBatchProcessor } from './useBatchProcessor';
import { useFileHandler } from './useFileHandler';
import { useAudioRecorder } from './useAudioRecorder';
import { useAudioPlayback } from './useAudioPlayback';
import { useAppEventListeners } from './useAppEventListeners';
import { useTransformTranscript } from './useTransformTranscript';
import { playSuccessSound } from '../utils/audioUtils';

export function useAppCore() {
  const {
    theme, setTheme, appLang, setAppLang, fontSize, setFontSize,
    isDark, t, activeColors, mainBgColor, textColor, cardBg, cardBorder, subTextColor,
    transcriptionMode, setTranscriptionMode
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

  const {
    history, historyLimit, setHistoryLimit,
    isHistoryFullscreen, setIsHistoryFullscreen,
    activeHistoryId, setActiveHistoryId,
    histSearch, setHistSearch,
    histDateFilter, setHistDateFilter,
    histSentimentFilter, setHistSentimentFilter,
    showFavoritesOnly, setShowFavoritesOnly,
    toggleFavorite, backupHistory, restoreHistory,
    loadHistory, handleDeleteHistoryItem, groupHistory, filteredHistory, isLoadingHistory
  } = useHistory(appLang, addToast, (id) => {
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
      setTranscript('');
      setStatus('idle');
    }
  });

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
  } = useTranscription(appLang, addToast, loadHistory, updateApiStats, playSuccessSound, transcriptionMode);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transcriptMeta, setTranscriptMeta] = useState<any>(null);

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

  const {
    searchTerm, setSearchTerm,
    currentMatchIndex, setCurrentMatchIndex,
    matchCount, setMatchCount,
    transcriptSearchInputRef,
    goToNextMatch, goToPrevMatch
  } = useTranscriptSearch(transcript);

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
    appLang, addToast, (recordedFile) => handleFileChange({ target: { files: [recordedFile] } } as any)
  );

  const { audioRef, audioCurrentTime, handleSeek, handleTimeUpdate } = useAudioPlayback();

  useAppEventListeners(loadHistory, updateApiStats, addToast, fileUrl);

  const {
    transformingType,
    handleTransformTranscript
  } = useTransformTranscript(transcript, setTranscript, appLang, addToast, updateApiStats);

  return {
    theme, setTheme, appLang, setAppLang, fontSize, setFontSize,
    isDark, t, activeColors, mainBgColor, textColor, cardBg, cardBorder, subTextColor,
    transcriptionMode, setTranscriptionMode,
    isSidebarOpen, setIsSidebarOpen,
    isInformationOpen, setIsInformationOpen,
    isActivityLogOpen, setIsActivityLogOpen,
    isReportOpen, setIsReportOpen,
    isSettingsOpen, setIsSettingsOpen,
    activeTool, setActiveTool,
    isToolsMinimized, setIsToolsMinimized,
    totalApiCalls, activeApiKeySource, activeModelName,
    isAiLoading, setIsAiLoading, updateApiStats,
    addToast,
    history, historyLimit, setHistoryLimit,
    isHistoryFullscreen, setIsHistoryFullscreen,
    activeHistoryId, setActiveHistoryId,
    histSearch, setHistSearch,
    histDateFilter, setHistDateFilter,
    histSentimentFilter, setHistSentimentFilter,
    showFavoritesOnly, setShowFavoritesOnly,
    toggleFavorite, backupHistory, restoreHistory,
    loadHistory, handleDeleteHistoryItem, groupHistory, filteredHistory, isLoadingHistory,
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
    processTranscription, resetTranscription,
    handleResetAll,
    transcriptMeta, setTranscriptMeta,
    searchTerm, setSearchTerm,
    currentMatchIndex, setCurrentMatchIndex,
    matchCount, setMatchCount,
    transcriptSearchInputRef,
    goToNextMatch, goToPrevMatch,
    fileInputRef,
    batchQueue, setBatchQueue,
    currentBatchIndex, setCurrentBatchIndex,
    isBatchProcessing, setIsBatchProcessing,
    hasBatchStarted, setHasBatchStarted,
    isBatchPaused, setIsBatchPaused,
    isExtendedPause,
    batchCountdown, setBatchCountdown,
    failedFiles, processedCount, retryFailedFiles,
    batchProgress, etaSeconds,
    isBatchSummaryOpen, setIsBatchSummaryOpen,
    startBatch, pauseBatch, resumeBatch, cancelBatch, skipNextBatchFile, jumpToBatchFile, removeBatchFile,
    handleFileChange,
    isRecording, recordingTime, startRecording, stopRecording,
    audioRef, audioCurrentTime, handleSeek, handleTimeUpdate,
    transformingType, handleTransformTranscript
  };
}
