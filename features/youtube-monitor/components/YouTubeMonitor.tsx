import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Youtube, Key, Play, Pause, Plus, Trash2, RefreshCw, Loader2, 
  Wifi, Filter, Search, SortDesc, CheckSquare, LayoutGrid, Square, CheckCircle2,
  Calendar, Clock, Download, ChevronDown, Video, Headphones, Settings, Copy, Bot, Volume2, Sparkles, List, Link as LinkIcon
} from 'lucide-react';
import { YouTubeChannel, YouTubeApiKey, YouTubeVideo, QueueState } from '../../../types/youtube';
import { useYouTubeMonitor } from '../hooks/useYouTubeMonitor';
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
  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelTitle, setNewChannelTitle] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiLabel, setNewApiLabel] = useState('');
  
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showMonitorSettings, setShowMonitorSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDownloadId, setOpenDownloadId] = useState<string | null>(null);

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [downloadedLinks, setDownloadedLinks] = useState<{url: string, title: string, timestamp: string}[]>([]);
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('yt_visited_links');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markLinkVisited = (url: string) => {
    setVisitedLinks(prev => {
      const newSet = new Set(prev);
      newSet.add(url);
      localStorage.setItem('yt_visited_links', JSON.stringify(Array.from(newSet)));
      
      // Sync to cloud
      addToStore(STORES.YOUTUBE_LINKS, {
        id: 'links_data',
        downloaded: downloadedLinks,
        visited: Array.from(newSet),
        updatedAt: new Date().toISOString()
      }).catch(console.error);

      return newSet;
    });
  };

  useEffect(() => {
    const syncLinks = async () => {
      try {
        const cloudData = await getFromStore(STORES.YOUTUBE_LINKS, 'links_data');
        let mergedDownloaded = [];
        let mergedVisited = new Set<string>();

        const localDownloadedStr = localStorage.getItem('jarvis_downloaded_links') || '[]';
        const localDownloaded = JSON.parse(localDownloadedStr);
        
        const localVisitedStr = localStorage.getItem('yt_visited_links') || '[]';
        const localVisited = JSON.parse(localVisitedStr);

        if (cloudData) {
          const cloudDownloaded = (cloudData as any).downloaded || [];
          const cloudVisited = (cloudData as any).visited || [];
          
          // Merge downloaded
          mergedDownloaded = [...localDownloaded];
          cloudDownloaded.forEach((cd: any) => {
            if (!mergedDownloaded.some(ld => ld.url === cd.url)) {
              mergedDownloaded.push(cd);
            }
          });
          // Sort by timestamp descending
          mergedDownloaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          // Merge visited
          mergedVisited = new Set([...localVisited, ...cloudVisited]);
          
          localStorage.setItem('jarvis_downloaded_links', JSON.stringify(mergedDownloaded));
          localStorage.setItem('yt_visited_links', JSON.stringify(Array.from(mergedVisited)));
        } else {
          mergedDownloaded = localDownloaded;
          mergedVisited = new Set(localVisited);
          
          // Initial sync to cloud if local data exists
          if (mergedDownloaded.length > 0 || mergedVisited.size > 0) {
            addToStore(STORES.YOUTUBE_LINKS, {
              id: 'links_data',
              downloaded: mergedDownloaded,
              visited: Array.from(mergedVisited),
              updatedAt: new Date().toISOString()
            }).catch(console.error);
          }
        }

        setDownloadedLinks(mergedDownloaded);
        setVisitedLinks(mergedVisited);
      } catch (e) {
        console.error("Error syncing links from cloud", e);
      }
    };

    const loadLinks = () => {
      try {
        const linksStr = localStorage.getItem('jarvis_downloaded_links') || '[]';
        setDownloadedLinks(JSON.parse(linksStr));
      } catch (e) {
        console.error("Error loading links", e);
      }
    };

    syncLinks();
    window.addEventListener('jarvis_links_updated', loadLinks);
    return () => window.removeEventListener('jarvis_links_updated', loadLinks);
  }, []);

  const filterRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);
  const monitorRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HTMLDivElement>(null);

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

  // Edit States
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelTitle, setEditChannelTitle] = useState('');
  const [editChannelValue, setEditChannelValue] = useState('');

  const [editingApiKeyId, setEditingApiKeyId] = useState<string | null>(null);
  const [editApiLabel, setEditApiLabel] = useState('');
  const [editApiValue, setEditApiValue] = useState('');

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

  const [isFetching, setIsFetching] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

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
  );

  const fetchVideos = async () => {
    if (channels.length === 0) {
      addToast('No channels added to monitor', 'warning');
      return;
    }
    
    setIsFetching(true);
    try {
      let currentApiKeys = [...apiKeys];
      let activeKey = rotateApiKey(currentApiKeys);
      
      if (!activeKey) {
        addToast('No active API keys found', 'error');
        setIsFetching(false);
        return;
      }

      // Move current videos to history before fetching new ones
      await markAllAsRead();

      const today = new Date().toDateString();

      for (const channel of channels) {
        let success = false;
        let retries = 0;
        
        while (!success && retries < apiKeys.length) {
        if (!activeKey) break;
        
        try {
          const data = await fetchYouTubeVideos(channel.channelId, activeKey.key);
          
          if (data.items) {
            for (const item of data.items) {
              const publishedDate = new Date(item.snippet.publishedAt).toDateString();
              
              // Only add if published today
              if (publishedDate !== today) continue;

              // Check keyword filter
              const defaultKeywords = 'টকশো, সীমান্ত, বিজিবি, বিজিবি মহাপরিচালক, ডিজি বিজিবি, বিএসএফ, বর্ডার, পুশইন, সীমান্ত হত্যা';
              const keywordsStr = localStorage.getItem('yt_monitor_keywords') ?? defaultKeywords;
              const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0) : [];
              
              if (keywords.length > 0) {
                const titleLower = item.snippet.title?.toLowerCase() || '';
                const descriptionLower = item.snippet.description?.toLowerCase() || '';
                const hasKeywordMatched = keywords.some(kw => titleLower.includes(kw) || descriptionLower.includes(kw));
                if (!hasKeywordMatched) {
                  continue; // Skip video since it doesn't match any keyword
                }
              }

              // Check if video already exists in queue/history
              const exists = queueState.queue.some(v => v.videoId === item.id.videoId) || 
                             queueState.history.some(v => v.videoId === item.id.videoId);
              
              // Check if video was deleted today (soft deleted)
              const isBlacklisted = queueState.deletedVideoIds.includes(item.id.videoId);
              
              if (!exists && !isBlacklisted) {
                const defaultDownloadType = (localStorage.getItem('yt_default_download_type') as 'video' | 'audio') || 'audio';
                const defaultVideoFormat = localStorage.getItem('yt_default_video_format') || '720p';
                const defaultAudioFormat = localStorage.getItem('yt_default_audio_format') || '16k';
                
                const getFormatLabel = (type: 'video' | 'audio', quality: string) => {
                  if (type === 'video') return quality;
                  if (quality === 'audio_best') return 'Best';
                  if (quality === 'mp3') return 'MP3 128k';
                  if (quality === '64k') return 'MP3 64k';
                  if (quality === '32k') return 'MP3 32k';
                  if (quality === '16k') return 'MP3 16k';
                  if (quality === 'm4a') return 'M4A';
                  if (quality === 'wav') return 'WAV';
                  if (quality === 'opus') return 'Opus HQ';
                  if (quality === 'audio') return 'Opus 16kHz (16 bit, 1 channel)';
                  return quality;
                };

                const formatToUse = { 
                  type: defaultDownloadType, 
                  quality: defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat, 
                  label: getFormatLabel(defaultDownloadType, defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat) 
                };

                const video: YouTubeVideo = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  videoId: item.id.videoId,
                  channelId: channel.channelId,
                  channelTitle: channel.title,
                  title: item.snippet.title,
                  description: item.snippet.description,
                  thumbnailUrl: item.snippet.thumbnails.high.url,
                  publishedAt: item.snippet.publishedAt,
                  duration: parseISO8601Duration(item.duration),
                  isLive: item.snippet.liveBroadcastContent === 'live',
                  status: 'pending',
                  format: formatToUse
                };
                await addVideoToQueue(video);
              }
            }
          }
          success = true;
        } catch (e: any) {
          console.error('Error fetching videos:', e);
          const errorMsg = e.message || String(e);
          
          if (errorMsg.includes('QUOTA_EXCEEDED')) {
            addToast(appLang === 'bn' ? `কোটা শেষ: ${activeKey.label}. পরিবর্তন করা হচ্ছে...` : `Quota exceeded: ${activeKey.label}. Rotating...`, 'warning');
            
            // Mark key as exhausted in DB and state
            await updateApiKey(activeKey.id, { isExhausted: true, exhaustedAt: Date.now() });
            
            // Remove from local array to prevent re-selection
            currentApiKeys = currentApiKeys.filter(k => k.id !== activeKey!.id);
            activeKey = rotateApiKey(currentApiKeys);
            
            if (!activeKey) {
              addToast(appLang === 'bn' ? 'সব এপিআই কি কোটা শেষ' : 'All API keys exhausted', 'error');
              return; // Stop fetching completely
            }
            retries++;
          } else {
            addToast(`Error fetching ${channel.title}: ${errorMsg}`, 'error');
            break; // Break while loop, move to next channel
          }
        }
        
        // Anti-bot: Small delay between checking different channels
        if (channels.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000)); // 2-4 seconds
        }
      }
    }
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddChannel = async () => {
    if (!newChannelId.trim() || !newChannelTitle.trim()) {
      addToast(appLang === 'bn' ? 'চ্যানেল আইডি এবং নাম দুটোই দিন' : 'Provide both Channel ID and Name', 'warning');
      return;
    }
    const channel = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      channelId: newChannelId.trim(),
      title: newChannelTitle.trim(), 
      addedAt: Date.now()
    };
    await addChannel(channel);
    setNewChannelId('');
    setNewChannelTitle('');
    addToast(appLang === 'bn' ? 'চ্যানেল যোগ করা হয়েছে' : 'Channel added', 'success');
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    addToast(appLang === 'bn' ? 'সবগুলো পঠিত হিসেবে মার্ক করা হয়েছে' : 'All marked as read', 'success');
  };

  const handleBulkDownload = () => {
    if (selectedIds.length === 0) return;
    bulkAction('download');
    addToast(appLang === 'bn' ? `${selectedIds.length}টি ভিডিও কিউতে যোগ করা হয়েছে` : `${selectedIds.length} videos added to queue`, 'success');
    setIsSelectMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await bulkAction('delete');
    addToast(appLang === 'bn' ? `${selectedIds.length}টি ভিডিও ডিলিট করা হয়েছে` : `${selectedIds.length} videos deleted`, 'success');
    setIsSelectMode(false);
  };

  const handleBulkMarkRead = async () => {
    if (selectedIds.length === 0) return;
    await bulkMarkAsRead(selectedIds);
    addToast(appLang === 'bn' ? `${selectedIds.length}টি ভিডিও পঠিত হিসেবে মার্ক করা হয়েছে` : `${selectedIds.length} videos marked as read`, 'success');
    setIsSelectMode(false);
    clearSelection();
  };

  const handleBulkStop = () => {
    if (selectedIds.length === 0) return;
    bulkAction('stop');
    addToast(appLang === 'bn' ? `${selectedIds.length}টি ভিডিও স্টপ করা হয়েছে` : `${selectedIds.length} videos stopped`, 'info');
    setIsSelectMode(false);
  };

  const handleBulkStart = () => {
    if (selectedIds.length === 0) return;
    bulkAction('start');
    addToast(appLang === 'bn' ? `${selectedIds.length}টি ভিডিও স্টার্ট করা হয়েছে` : `${selectedIds.length} videos started`, 'success');
    setIsSelectMode(false);
  };

  const handleBulkClearDownload = () => {
    if (selectedIds.length === 0) return;
    bulkAction('clear');
    addToast(appLang === 'bn' ? `${selectedIds.length}টি ভিডিওর ডাউনলোড ক্লিয়ার করা হয়েছে` : `${selectedIds.length} videos download cleared`, 'info');
    setIsSelectMode(false);
  };

  const handleAddKey = async () => {
    if (!newApiKey.trim()) return;
    const key = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      key: newApiKey.trim(),
      label: newApiLabel.trim() || 'API Key',
      isActive: true,
      isExhausted: false,
      addedAt: Date.now()
    };
    await addApiKey(key);
    setNewApiKey('');
    setNewApiLabel('');
    addToast(appLang === 'bn' ? 'এপিআই কি যোগ করা হয়েছে' : 'API Key added', 'success');
  };

  const handleSaveChannel = async (id: string) => {
    if (!editChannelTitle.trim() || !editChannelValue.trim()) return;
    await updateChannel(id, { title: editChannelTitle.trim(), channelId: editChannelValue.trim() });
    setEditingChannelId(null);
    addToast(appLang === 'bn' ? 'চ্যানেল আপডেট করা হয়েছে' : 'Channel updated', 'success');
  };

  const handleSaveApiKey = async (id: string, updates?: Partial<YouTubeApiKey>) => {
    if (updates) {
      if (updates.isPrimary) {
        // Unset primary for all other keys
        for (const k of apiKeys) {
          if (k.id !== id && k.isPrimary) {
            await updateApiKey(k.id, { isPrimary: false });
          }
        }
      }
      await updateApiKey(id, updates);
      if (updates.isExhausted === false) {
        addToast(appLang === 'bn' ? 'কোটা রিস্টোর করা হয়েছে' : 'Quota restored', 'success');
      } else if (updates.isActive !== undefined) {
        addToast(appLang === 'bn' ? (updates.isActive ? 'এপিআই কি সক্রিয় করা হয়েছে' : 'এপিআই কি নিষ্ক্রিয় করা হয়েছে') : (updates.isActive ? 'API Key enabled' : 'API Key disabled'), 'success');
      } else if (updates.isPrimary) {
        addToast(appLang === 'bn' ? 'প্রাইমারি কি সেট করা হয়েছে' : 'Primary key set', 'success');
      }
      return;
    }
    if (!editApiValue.trim()) return;
    await updateApiKey(id, { label: editApiLabel.trim(), key: editApiValue.trim() });
    setEditingApiKeyId(null);
    addToast(appLang === 'bn' ? 'এপিআই কি আপডেট করা হয়েছে' : 'API Key updated', 'success');
  };

  return (
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
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-12">
              <YouTubeDownloadQueue
                queue={queueState.queue}
                appLang={appLang}
                onUpdateVideo={updateVideo}
                addToast={addToast}
                onPause={(id) => {
                  updateVideo(id, { status: 'pending' });
                }}
                onStart={(id) => {
                  updateVideo(id, { status: 'downloading' });
                }}
                onStop={(id) => {
                  updateVideo(id, { status: 'pending', progress: 0 });
                }}
                onRetry={(id) => {
                  updateVideo(id, { status: 'pending', progress: 0, error: undefined, retryCount: 0 });
                }}
                onDelete={(id) => {
                  setQueueState(prev => ({
                    ...prev,
                    queue: prev.queue.filter(v => v.id !== id)
                  }));
                  import('../../../services/db').then(({ deleteFromStore, STORES }) => {
                    deleteFromStore(STORES.YOUTUBE_QUEUE, id);
                  });
                }}
                onClear={() => {
                  setQueueState(prev => {
                    const newQueue = prev.queue.map(v => {
                      if (v.status === 'completed') {
                        const updated = { ...v, status: 'downloaded' as any };
                        import('../../../services/db').then(({ addToStore, STORES }) => {
                          addToStore(STORES.YOUTUBE_QUEUE, updated).catch(console.error);
                        });
                        return updated;
                      }
                      return v;
                    });

                    return {
                      ...prev,
                      queue: newQueue
                    };
                  });
                }}
              />

              {recentVideos.length === 0 && oldVideos.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-64 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Youtube className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">কোনো ভিডিও পাওয়া যায়নি</p>
                </div>
              ) : (
                <>
                  <MonitorVideoSection
                    groupedVideos={groupedRecent}
                    title={appLang === 'bn' ? 'সাম্প্রতিক ভিডিও' : 'Recent Videos'}
                    icon={<Video className="w-5 h-5 text-red-500" />}
                    appLang={appLang}
                    openDownloadId={openDownloadId}
                    setOpenDownloadId={setOpenDownloadId}
                    formatTime={formatTime}
                    addToast={addToast}
                    onMarkAsRead={markAsRead}
                    onUpdateVideo={updateVideo}
                    isSelectMode={isSelectMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectVideo}
                    onLoadTranscript={onLoadTranscript}
                    onStartTranscription={onStartTranscription}
                    queueState={queueState}
                    addVideoToQueue={addVideoToQueue}
                    isDark={isDark}
                  />
                  
                  <MonitorVideoSection
                    groupedVideos={groupedOld}
                    title={appLang === 'bn' ? 'পুরাতন ভিডিও' : 'Old Videos'}
                    icon={<Clock className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />}
                    appLang={appLang}
                    openDownloadId={openDownloadId}
                    setOpenDownloadId={setOpenDownloadId}
                    formatTime={formatTime}
                    addToast={addToast}
                    onMarkAsRead={markAsRead}
                    onUpdateVideo={updateVideo}
                    isSelectMode={isSelectMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectVideo}
                    onLoadTranscript={onLoadTranscript}
                    onStartTranscription={onStartTranscription}
                    queueState={queueState}
                    addVideoToQueue={addVideoToQueue}
                    isDark={isDark}
                  />
                </>
              )}
            </div>
          </div>

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

