import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Youtube, Key, Play, Pause, Plus, Trash2, RefreshCw, Loader2, 
  Wifi, Filter, Search, SortDesc, CheckSquare, LayoutGrid, Square, CheckCircle2,
  Calendar, Clock, Download, ChevronDown, Video, Headphones, Settings, Copy, Bot, Volume2, Sparkles, List, Link as LinkIcon
} from 'lucide-react';
import { YouTubeChannel, YouTubeApiKey, YouTubeVideo, QueueState } from '../../../types/youtube';
import { useYouTubeLinks } from '../hooks/useYouTubeLinks';
import { useYouTubeMonitor } from '../hooks/useYouTubeMonitor';
import { useYouTubeMonitorUI } from '../hooks/useYouTubeMonitorUI';
import { useVideoFilter } from '../hooks/useVideoFilter';
import { useQueueProcessor } from '../hooks/useQueueProcessor';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { fetchYouTubeVideos, rotateApiKey } from '../services/youtubeService';
import { parseISO8601Duration } from '../../../utils/timeUtils';
import { YouTubeDownloadQueue } from './YouTubeDownloadQueue';
import { ChannelSettings } from './ChannelSettings';
import { ApiSettings } from './ApiSettings';
import { MonitorSettings } from './MonitorSettings';
import { MonitorVideoSection } from './MonitorVideoSection';
import { YouTubeMonitorMainContent } from './YouTubeMonitorMainContent';
import { MonitorBulkActions } from './MonitorBulkActions';
import { MonitorFilterMenu } from './MonitorFilterMenu';
import { YouTubeMonitorHeader } from './YouTubeMonitorHeader';
import { YouTubeLinkModal } from './YouTubeLinkModal';
import { YouTubeReportModal } from './YouTubeReportModal';
import { STORES, getFromStore, addToStore } from '../../../services/db';
import { formatTime, toBengaliNumber, getRelativeTime, formatDate } from '../utils/formatters';

interface YouTubeMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeColors: any;
  appLang: 'en' | 'bn';
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onLoadTranscript?: (transcript: string, title: string, duration: string, historyId?: string, channelName?: string, date?: string, videoId?: string) => void;
  onStartTranscription?: (file: Blob, metadata: { name: string, duration: string, size?: string, type?: string, channelName?: string, date?: string }, isAutoProcess?: boolean) => Promise<string | undefined>;
  isAppProcessing?: boolean;
}

export const YouTubeMonitor: React.FC<YouTubeMonitorProps> = ({
  isOpen,
  onClose,
  isDark,
  activeColors,
  appLang,
  addToast,
  onLoadTranscript,
  onStartTranscription,
  isAppProcessing = false
}) => {
  const { downloadedLinks, setDownloadedLinks, visitedLinks, markLinkVisited } = useYouTubeLinks();

  const filterRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);
  const monitorRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HTMLDivElement>(null);

  const {
    channels,
    apiKeys,
    queueState,
    setQueueState,
    addChannel,
    updateChannel,
    removeChannel,
    addApiKey,
    updateApiKey,
    removeApiKey,
    toggleAutoProcess,
    toggleAutoDownload,
    togglePause,
    addVideoToQueue,
    markAllAsRead,
    markAsRead,
    updateVideo,
    bulkUpdateStatus,
    bulkDelete,
    bulkMarkAsRead,
    isSelectMode,
    setIsSelectMode,
    selectedVideoIds: selectedIds,
    toggleSelectVideo,
    selectAll: handleSelectAll,
    clearSelection,
    bulkAction,
    showReportModal,
    setShowReportModal,
    completedCount,
    setCompletedCount,
    errorCount,
    setErrorCount,
    retryErrors
  } = useYouTubeMonitor();

  const {
    monitorFilter, setMonitorFilter,
    searchQuery, setSearchQuery,
    selectedChannelFilter, setSelectedChannelFilter,
    selectedDurationFilter, setSelectedDurationFilter,
    selectedDateFilter, setSelectedDateFilter,
    selectedTimeFilter, setSelectedTimeFilter,
    selectedStatusFilter, setSelectedStatusFilter,
    recentVideos, oldVideos,
    groupedRecent, groupedOld
  } = useVideoFilter(queueState);

  const {
    newChannelId, setNewChannelId,
    newChannelTitle, setNewChannelTitle,
    newApiKey, setNewApiKey,
    newApiLabel, setNewApiLabel,
    showChannelSettings, setShowChannelSettings,
    showApiSettings, setShowApiSettings,
    showMonitorSettings, setShowMonitorSettings,
    isMobileMenuOpen, setIsMobileMenuOpen,
    openDownloadId, setOpenDownloadId,
    showFilterMenu, setShowFilterMenu,
    isLinkModalOpen, setIsLinkModalOpen,
    editingChannelId, setEditingChannelId,
    editChannelTitle, setEditChannelTitle,
    editChannelValue, setEditChannelValue,
    editingApiKeyId, setEditingApiKeyId,
    editApiLabel, setEditApiLabel,
    editApiValue, setEditApiValue,
    isFetching, setIsFetching,
    showVoiceSettings, setShowVoiceSettings,
    handleAddChannel,
    handleMarkAllRead,
    handleBulkDownload,
    handleBulkDelete,
    handleBulkMarkRead,
    handleBulkStop,
    handleBulkStart,
    handleBulkClearDownload,
    handleAddKey,
    handleSaveChannel,
    handleSaveApiKey,
    fetchVideos
  } = useYouTubeMonitorUI(
    appLang,
    addToast,
    channels,
    apiKeys,
    queueState,
    addChannel,
    updateChannel,
    addApiKey,
    updateApiKey,
    fetchYouTubeVideos,
    rotateApiKey,
    addVideoToQueue,
    markAllAsRead,
    bulkAction,
    bulkMarkAsRead,
    selectedIds,
    setIsSelectMode,
    clearSelection,
    parseISO8601Duration
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterMenu && filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
      if (showChannelSettings && channelRef.current && !channelRef.current.contains(event.target as Node)) {
        setShowChannelSettings(false);
      }
      if (showMonitorSettings && monitorRef.current && !monitorRef.current.contains(event.target as Node)) {
        setShowMonitorSettings(false);
      }
      if (showApiSettings && apiRef.current && !apiRef.current.contains(event.target as Node)) {
        setShowApiSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterMenu, showChannelSettings, showMonitorSettings, showApiSettings]);

  const {
    isVoiceEnabled,
    toggleVoice,
    voices,
    selectedVoiceURI,
    selectVoice,
    announce,
    isSpeaking
  } = useVoiceAssistant();

  // Initialize Queue Processor
  const { countdown, currentAction } = useQueueProcessor(
    queueState, 
    setQueueState,
    queueState.isPaused, 
    queueState.isAutoProcess,
    queueState.isAutoDownload,
    onStartTranscription,
    isAppProcessing,
    announce,
    appLang,
    setShowReportModal,
    setCompletedCount,
    setErrorCount
  );  return (
    <motion.div
      initial={false}
      animate={{ 
        opacity: isOpen ? 1 : 0, 
        y: isOpen ? 0 : 20,
        pointerEvents: isOpen ? 'auto' : 'none',
        zIndex: isOpen ? 50 : -10
      }}
      className={`absolute inset-0 flex flex-col overflow-hidden ${isDark ? 'bg-gray-900/40 backdrop-blur-sm' : 'bg-[#F8F9FA]/40 backdrop-blur-sm'}`}
    >
          {/* Header */}
        <YouTubeMonitorHeader
          onClose={onClose}
          isDark={isDark}
          appLang={appLang}
          queueState={queueState}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isLinkModalOpen={isLinkModalOpen}
          setIsLinkModalOpen={setIsLinkModalOpen}
          isSelectMode={isSelectMode}
          setIsSelectMode={setIsSelectMode}
          clearSelection={clearSelection}
          selectedIds={selectedIds}
          bulkAction={bulkAction}
          filterRef={filterRef}
          showFilterMenu={showFilterMenu}
          setShowFilterMenu={setShowFilterMenu}
          setShowChannelSettings={setShowChannelSettings}
          setShowApiSettings={setShowApiSettings}
          setShowMonitorSettings={setShowMonitorSettings}
          setShowVoiceSettings={setShowVoiceSettings}
          selectedChannelFilter={selectedChannelFilter}
          setSelectedChannelFilter={setSelectedChannelFilter}
          selectedDurationFilter={selectedDurationFilter}
          setSelectedDurationFilter={setSelectedDurationFilter}
          selectedDateFilter={selectedDateFilter}
          setSelectedDateFilter={setSelectedDateFilter}
          selectedTimeFilter={selectedTimeFilter}
          setSelectedTimeFilter={setSelectedTimeFilter}
          selectedStatusFilter={selectedStatusFilter}
          setSelectedStatusFilter={setSelectedStatusFilter}
          channels={channels}
          monitorFilter={monitorFilter}
          setMonitorFilter={setMonitorFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          channelRef={channelRef}
          showChannelSettings={showChannelSettings}
          newChannelTitle={newChannelTitle}
          setNewChannelTitle={setNewChannelTitle}
          newChannelId={newChannelId}
          setNewChannelId={setNewChannelId}
          handleAddChannel={handleAddChannel}
          editingChannelId={editingChannelId}
          setEditingChannelId={setEditingChannelId}
          editChannelTitle={editChannelTitle}
          setEditChannelTitle={setEditChannelTitle}
          editChannelValue={editChannelValue}
          setEditChannelValue={setEditChannelValue}
          handleSaveChannel={handleSaveChannel}
          removeChannel={removeChannel}
          handleMarkAllRead={handleMarkAllRead}
          toggleAutoProcess={toggleAutoProcess}
          toggleAutoDownload={toggleAutoDownload}
          fetchVideos={fetchVideos}
          isFetching={isFetching}
          monitorRef={monitorRef}
          showMonitorSettings={showMonitorSettings}
          showVoiceSettings={showVoiceSettings}
          isVoiceEnabled={isVoiceEnabled}
          toggleVoice={toggleVoice}
          voices={voices}
          selectedVoiceURI={selectedVoiceURI}
          selectVoice={selectVoice}
          announce={announce}
          isSpeaking={isSpeaking}
          apiRef={apiRef}
          showApiSettings={showApiSettings}
          apiKeys={apiKeys}
          newApiLabel={newApiLabel}
          setNewApiLabel={setNewApiLabel}
          newApiKey={newApiKey}
          setNewApiKey={setNewApiKey}
          handleAddKey={handleAddKey}
          editingApiKeyId={editingApiKeyId}
          setEditingApiKeyId={setEditingApiKeyId}
          editApiLabel={editApiLabel}
          setEditApiLabel={setEditApiLabel}
          editApiValue={editApiValue}
          setEditApiValue={setEditApiValue}
          handleSaveApiKey={handleSaveApiKey}
          removeApiKey={removeApiKey}
          recentVideos={recentVideos}
          oldVideos={oldVideos}
          handleSelectAll={handleSelectAll}
          handleBulkDownload={handleBulkDownload}
          handleBulkMarkRead={handleBulkMarkRead}
          handleBulkStart={handleBulkStart}
          handleBulkStop={handleBulkStop}
          handleBulkClearDownload={handleBulkClearDownload}
          handleBulkDelete={handleBulkDelete}
        />

        {/* Status Banner */}
        <AnimatePresence>
          {(queueState.isAutoProcess || queueState.isAutoDownload) && (countdown !== null || currentAction) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`border-b overflow-hidden ${isDark ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100'}`}
            >
              <div className="px-6 py-2 flex items-center justify-center gap-3">
                {countdown !== null ? (
                  <>
                    <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      {appLang === 'bn' ? `পরবর্তী ভিডিওর জন্য অপেক্ষা করুন: ${toBengaliNumber(countdown)} সেকেন্ড...` : `Waiting for next video: ${countdown} seconds...`}
                    </span>
                  </>
                ) : (
                  <>
                    <Bot className={`w-4 h-4 animate-pulse ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      {currentAction}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <YouTubeMonitorMainContent
          queueState={queueState}
          appLang={appLang}
          updateVideo={updateVideo}
          addToast={addToast}
          setQueueState={setQueueState}
          recentVideos={recentVideos}
          oldVideos={oldVideos}
          isDark={isDark}
          groupedRecent={groupedRecent}
          openDownloadId={openDownloadId}
          setOpenDownloadId={setOpenDownloadId}
          formatTime={formatTime}
          markAsRead={markAsRead}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          toggleSelectVideo={toggleSelectVideo}
          onLoadTranscript={onLoadTranscript}
          onStartTranscription={onStartTranscription}
          addVideoToQueue={addVideoToQueue}
          groupedOld={groupedOld}
        />

        {/* Link Modal */}
        <YouTubeLinkModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          isDark={isDark}
          appLang={appLang}
          downloadedLinks={downloadedLinks}
          visitedLinks={visitedLinks}
          markLinkVisited={markLinkVisited}
          addToast={addToast}
        />

        {/* Report Modal */}
        {showReportModal && (
          <YouTubeReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            isDark={isDark}
            appLang={appLang}
            completedCount={completedCount}
            errorCount={errorCount}
            onRetryErrors={retryErrors}
          />
        )}

        </motion.div>
  );
};

