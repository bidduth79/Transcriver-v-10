import { useState } from 'react';
import { YouTubeApiKey } from '../../../types/youtube';
import { useYouTubeMonitorFetch } from './useYouTubeMonitorFetch';

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

  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  const { isFetching, setIsFetching, fetchVideos } = useYouTubeMonitorFetch(
    appLang, addToast, channels, apiKeys, queueState, fetchYouTubeVideos, rotateApiKey, addVideoToQueue, markAllAsRead, updateApiKey, parseISO8601Duration
  );

  const handleAddChannel = async () => {
    if (!newChannelId.trim() || !newChannelTitle.trim()) {
      addToast(appLang === 'bn' ? 'চ্যানেল আইডি এবং নাম দুটোই দিন' : 'Provide both Channel ID and Name', 'warning');
      return;
    }
    const channel = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
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
