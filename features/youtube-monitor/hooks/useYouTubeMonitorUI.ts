import { useState } from 'react';
import { YouTubeApiKey } from '../../../types/youtube';

export function useYouTubeMonitorUI(
  appLang: 'en' | 'bn',
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  channels: any[],
  apiKeys: YouTubeApiKey[],
  queueState: any,
  addChannel: any,
  updateChannel: any,
  addApiKey: any,
  updateApiKey: any,
  fetchYouTubeVideos: any,
  rotateApiKey: any,
  addVideoToQueue: any,
  markAllAsRead: any,
  bulkAction: any,
  bulkMarkAsRead: any,
  selectedIds: string[],
  setIsSelectMode: (v: boolean) => void,
  clearSelection: () => void,
  parseISO8601Duration: any
) {
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

  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelTitle, setEditChannelTitle] = useState('');
  const [editChannelValue, setEditChannelValue] = useState('');

  const [editingApiKeyId, setEditingApiKeyId] = useState<string | null>(null);
  const [editApiLabel, setEditApiLabel] = useState('');
  const [editApiValue, setEditApiValue] = useState('');

  const [isFetching, setIsFetching] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

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
                if (publishedDate !== today) continue;

                const defaultKeywords = 'টকশো, সীমান্ত, বিজিবি, বিজিবি মহাপরিচালক, ডিজি বিজিবি, বিএসএফ, বর্ডার, পুশইন, সীমান্ত হত্যা';
                const keywordsStr = localStorage.getItem('yt_monitor_keywords') ?? defaultKeywords;
                const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0) : [];
                
                if (keywords.length > 0) {
                  const titleLower = item.snippet.title?.toLowerCase() || '';
                  const descriptionLower = item.snippet.description?.toLowerCase() || '';
                  const hasKeywordMatched = keywords.some(kw => titleLower.includes(kw) || descriptionLower.includes(kw));
                  if (!hasKeywordMatched) continue; 
                }

                const exists = queueState.queue.some((v: any) => v.videoId === item.id.videoId) || 
                               queueState.history.some((v: any) => v.videoId === item.id.videoId);
                
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

                  const video = {
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
              await updateApiKey(activeKey.id, { isExhausted: true, exhaustedAt: Date.now() });
              currentApiKeys = currentApiKeys.filter(k => k.id !== activeKey!.id);
              activeKey = rotateApiKey(currentApiKeys);
              if (!activeKey) {
                addToast(appLang === 'bn' ? 'সব এপিআই কি কোটা শেষ' : 'All API keys exhausted', 'error');
                return;
              }
              retries++;
            } else {
              addToast(`Error fetching ${channel.title}: ${errorMsg}`, 'error');
              break;
            }
          }
          if (channels.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
          }
        }
      }
    } finally {
      setIsFetching(false);
    }
  };

  return {
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
  };
}
