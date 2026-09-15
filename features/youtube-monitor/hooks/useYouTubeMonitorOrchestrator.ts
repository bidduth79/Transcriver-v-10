import { useRef } from 'react';
import { useYouTubeLinks } from './useYouTubeLinks';
import { useYouTubeMonitor } from './useYouTubeMonitor';
import { useYouTubeMonitorUI } from './useYouTubeMonitorUI';
import { useVideoFilter } from './useVideoFilter';
import { useQueueProcessor } from './useQueueProcessor';
import { useVoiceAssistant } from './useVoiceAssistant';
import { fetchYouTubeVideos, rotateApiKey } from '../services/youtubeService';
import { parseISO8601Duration } from '../../../utils/timeUtils';
import { formatTime } from '../utils/formatters';

export const useYouTubeMonitorOrchestrator = (
  appLang: 'en' | 'bn',
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  isAppProcessing: boolean,
  onStartTranscription?: (file: Blob, metadata: any, isAutoProcess?: boolean) => Promise<string | undefined>,
  onLoadTranscript?: (transcript: string, title: string, duration: string, historyId?: string, channelName?: string, date?: string, videoId?: string) => void
) => {
  const { downloadedLinks, setDownloadedLinks, visitedLinks, markLinkVisited } = useYouTubeLinks();

  const filterRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);
  const monitorRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HTMLDivElement>(null);

  const {
    channels, apiKeys, queueState, setQueueState,
    addChannel, updateChannel, removeChannel,
    addApiKey, updateApiKey, removeApiKey,
    toggleAutoProcess, toggleAutoDownload, togglePause,
    addVideoToQueue, markAllAsRead, markAsRead,
    updateVideo, bulkUpdateStatus, bulkDelete, bulkMarkAsRead,
    isSelectMode, setIsSelectMode, selectedVideoIds: selectedIds,
    toggleSelectVideo, selectAll: handleSelectAll, clearSelection,
    bulkAction, showReportModal, setShowReportModal,
    completedCount, setCompletedCount, errorCount, setErrorCount, retryErrors
  } = useYouTubeMonitor();

  const {
    monitorFilter, setMonitorFilter, searchQuery, setSearchQuery,
    selectedChannelFilter, setSelectedChannelFilter,
    selectedDurationFilter, setSelectedDurationFilter,
    selectedDateFilter, setSelectedDateFilter,
    selectedTimeFilter, setSelectedTimeFilter,
    selectedStatusFilter, setSelectedStatusFilter,
    recentVideos, oldVideos, groupedRecent, groupedOld
  } = useVideoFilter(queueState);

  const {
    newChannelId, setNewChannelId, newChannelTitle, setNewChannelTitle,
    newApiKey, setNewApiKey, newApiLabel, setNewApiLabel,
    showChannelSettings, setShowChannelSettings,
    showApiSettings, setShowApiSettings,
    showMonitorSettings, setShowMonitorSettings,
    isMobileMenuOpen, setIsMobileMenuOpen,
    openDownloadId, setOpenDownloadId,
    showFilterMenu, setShowFilterMenu,
    isLinkModalOpen, setIsLinkModalOpen,
    editingChannelId, setEditingChannelId,
    editChannelTitle, setEditChannelTitle, editChannelValue, setEditChannelValue,
    editingApiKeyId, setEditingApiKeyId,
    editApiLabel, setEditApiLabel, editApiValue, setEditApiValue,
    isFetching, setIsFetching, showVoiceSettings, setShowVoiceSettings,
    handleAddChannel, handleMarkAllRead, handleBulkDownload, handleBulkDelete,
    handleBulkMarkRead, handleBulkStop, handleBulkStart, handleBulkClearDownload,
    handleAddKey, handleSaveChannel, handleSaveApiKey, fetchVideos
  } = useYouTubeMonitorUI(
    appLang, addToast, channels, apiKeys, queueState, addChannel, updateChannel,
    addApiKey, updateApiKey, fetchYouTubeVideos, rotateApiKey, addVideoToQueue,
    markAllAsRead, bulkAction, bulkMarkAsRead, selectedIds, setIsSelectMode, clearSelection, parseISO8601Duration
  );

  const {
    isVoiceEnabled, toggleVoice, voices, selectedVoiceURI,
    selectVoice, announce, isSpeaking
  } = useVoiceAssistant();

  const { countdown, currentAction } = useQueueProcessor(
    queueState, setQueueState, queueState.isPaused, queueState.isAutoProcess, queueState.isAutoDownload,
    onStartTranscription, isAppProcessing, announce, appLang, setShowReportModal, setCompletedCount, setErrorCount
  );

  const headerProps = {
    appLang, queueState, isMobileMenuOpen, setIsMobileMenuOpen,
    isLinkModalOpen, setIsLinkModalOpen, isSelectMode, setIsSelectMode,
    clearSelection, selectedIds, bulkAction, filterRef, showFilterMenu, setShowFilterMenu,
    setShowChannelSettings, setShowApiSettings, setShowMonitorSettings, setShowVoiceSettings,
    selectedChannelFilter, setSelectedChannelFilter, selectedDurationFilter, setSelectedDurationFilter,
    selectedDateFilter, setSelectedDateFilter, selectedTimeFilter, setSelectedTimeFilter,
    selectedStatusFilter, setSelectedStatusFilter, channels, monitorFilter, setMonitorFilter,
    searchQuery, setSearchQuery, channelRef, showChannelSettings, newChannelTitle, setNewChannelTitle,
    newChannelId, setNewChannelId, handleAddChannel, editingChannelId, setEditingChannelId,
    editChannelTitle, setEditChannelTitle, editChannelValue, setEditChannelValue,
    handleSaveChannel, removeChannel, handleMarkAllRead, toggleAutoProcess, toggleAutoDownload,
    fetchVideos, isFetching, monitorRef, showMonitorSettings, showVoiceSettings,
    isVoiceEnabled, toggleVoice, voices, selectedVoiceURI, selectVoice, announce, isSpeaking,
    apiRef, showApiSettings, apiKeys, newApiLabel, setNewApiLabel, newApiKey, setNewApiKey,
    handleAddKey, editingApiKeyId, setEditingApiKeyId, editApiLabel, setEditApiLabel,
    editApiValue, setEditApiValue, handleSaveApiKey, removeApiKey, recentVideos, oldVideos,
    handleSelectAll, handleBulkDownload, handleBulkMarkRead, handleBulkStart, handleBulkStop,
    handleBulkClearDownload, handleBulkDelete
  };

  const statusBannerProps = {
    queueState, countdown, currentAction, appLang
  };

  const mainContentProps = {
    queueState, appLang, updateVideo, addToast, setQueueState, recentVideos, oldVideos,
    groupedRecent, groupedOld, openDownloadId, setOpenDownloadId, formatTime, markAsRead,
    isSelectMode, selectedIds, toggleSelectVideo, onLoadTranscript, onStartTranscription, addVideoToQueue
  };

  const linkModalProps = {
    isLinkModalOpen, setIsLinkModalOpen, appLang, downloadedLinks, visitedLinks, markLinkVisited, addToast
  };

  const reportModalProps = {
    showReportModal, setShowReportModal, appLang, completedCount, errorCount, onRetryErrors: retryErrors
  };

  const refs = { filterRef, channelRef, monitorRef, apiRef };
  const showSettings = { showFilterMenu, setShowFilterMenu, showChannelSettings, setShowChannelSettings, showMonitorSettings, setShowMonitorSettings, showApiSettings, setShowApiSettings };

  return {
    headerProps,
    statusBannerProps,
    mainContentProps,
    linkModalProps,
    reportModalProps,
    refs,
    showSettings
  };
};
