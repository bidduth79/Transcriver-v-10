import { useState, useEffect } from 'react';
import { STORES, getAllFromStore, addToStore, deleteFromStore } from '../../../services/db';
import { YouTubeChannel, YouTubeApiKey, YouTubeVideo, QueueState } from '../../../types/youtube';

export const useYouTubeMonitor = () => {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [apiKeys, setApiKeys] = useState<YouTubeApiKey[]>([]);
  const [queueState, setQueueState] = useState<QueueState>({
    isAutoProcess: localStorage.getItem('yt_monitor_auto_pilot') === 'true',
    isAutoDownload: localStorage.getItem('yt_monitor_auto_download') === 'true',
    isPaused: false,
    activeVideoId: null,
    queue: [],
    history: [],
    deletedVideoIds: []
  });

  // Load initial data
  const loadData = async () => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('yt_monitor_last_date');
    
    // Always load channels and API keys
    const loadedChannels = (await getAllFromStore(STORES.YOUTUBE_CHANNELS)) as YouTubeChannel[];
    const loadedKeys = (await getAllFromStore(STORES.YOUTUBE_API_KEYS)) as YouTubeApiKey[];
    setChannels(loadedChannels || []);
    
    // Check for API key recovery (YouTube quota resets at midnight PT)
    const validKeys = loadedKeys || [];
    let keysUpdated = false;
    const currentDatePT = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", year: 'numeric', month: 'numeric', day: 'numeric' });
    
    for (const key of validKeys) {
      if (key.isExhausted && key.exhaustedAt) {
        const exhaustedDatePT = new Date(key.exhaustedAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles", year: 'numeric', month: 'numeric', day: 'numeric' });
        if (exhaustedDatePT !== currentDatePT) {
          key.isExhausted = false;
          key.exhaustedAt = undefined;
          await addToStore(STORES.YOUTUBE_API_KEYS, key);
          keysUpdated = true;
        }
      }
    }
    setApiKeys(validKeys);

    if (lastDate && lastDate !== today) {
      // Date changed, clear queue and history
      const loadedQueue = (await getAllFromStore(STORES.YOUTUBE_QUEUE)) as YouTubeVideo[];
      for (const v of (loadedQueue || [])) {
        await deleteFromStore(STORES.YOUTUBE_QUEUE, v.id);
      }
      localStorage.setItem('yt_monitor_last_date', today);
      localStorage.removeItem('yt_deleted_videos');
      setQueueState(prev => ({ ...prev, queue: [], history: [], deletedVideoIds: [] }));
    } else {
      if (!lastDate) localStorage.setItem('yt_monitor_last_date', today);
      
      const loadedQueue = (await getAllFromStore(STORES.YOUTUBE_QUEUE)) as YouTubeVideo[];
      
      const validQueue: YouTubeVideo[] = [];
      const validHistory: YouTubeVideo[] = [];
      const deletedIds: string[] = [];
      
      for (const v of (loadedQueue || [])) {
        if (v.isDeleted) {
          deletedIds.push(v.videoId);
        } else if (v.isRead) {
          validHistory.push(v);
        } else {
          // Reset stuck videos
          if (v.status === 'downloading' || v.status === 'transcribing') {
            v.status = 'pending';
            v.progress = 0;
            addToStore(STORES.YOUTUBE_QUEUE, v).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'কিউ আপডেট করতে ব্যর্থ: ' + err.message } })));
          }
          validQueue.push(v);
        }
      }
      
      setQueueState(prev => ({
        ...prev,
        queue: validQueue,
        history: validHistory,
        deletedVideoIds: deletedIds
      }));
    }
  };

  useEffect(() => {
    // Set defaults if not present
    if (!localStorage.getItem('yt_default_download_type')) {
      localStorage.setItem('yt_default_download_type', 'audio');
    }
    if (!localStorage.getItem('yt_default_audio_format')) {
      localStorage.setItem('yt_default_audio_format', 'audio'); // 'audio' maps to Opus 16k in our system
    }
    if (!localStorage.getItem('yt_default_video_format')) {
      localStorage.setItem('yt_default_video_format', '720p');
    }
    if (!localStorage.getItem('yt_default_bitrate')) {
      localStorage.setItem('yt_default_bitrate', '16');
    }
    if (!localStorage.getItem('yt_default_channels')) {
      localStorage.setItem('yt_default_channels', '1');
    }
    if (!localStorage.getItem('yt_default_samplerate')) {
      localStorage.setItem('yt_default_samplerate', '16000');
    }

    loadData();

    const handleChannelsUpdate = () => {
      getAllFromStore(STORES.YOUTUBE_CHANNELS).then(data => setChannels((data as YouTubeChannel[]) || []));
    };
    const handleApiKeysUpdate = () => {
      getAllFromStore(STORES.YOUTUBE_API_KEYS).then(data => setApiKeys((data as YouTubeApiKey[]) || []));
    };
    const handleQueueUpdate = () => {
      loadData();
    };

    window.addEventListener(`store-updated-${STORES.YOUTUBE_CHANNELS}`, handleChannelsUpdate);
    window.addEventListener(`store-updated-${STORES.YOUTUBE_API_KEYS}`, handleApiKeysUpdate);
    window.addEventListener(`store-updated-${STORES.YOUTUBE_QUEUE}`, handleQueueUpdate);

    return () => {
      window.removeEventListener(`store-updated-${STORES.YOUTUBE_CHANNELS}`, handleChannelsUpdate);
      window.removeEventListener(`store-updated-${STORES.YOUTUBE_API_KEYS}`, handleApiKeysUpdate);
      window.removeEventListener(`store-updated-${STORES.YOUTUBE_QUEUE}`, handleQueueUpdate);
    };
  }, []);

  // Midnight reset logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleMidnightReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0); // Next midnight
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();

      timeoutId = setTimeout(() => {
        loadData();
        // Reschedule for the next day
        scheduleMidnightReset();
      }, timeUntilMidnight);
    };

    scheduleMidnightReset();

    return () => clearTimeout(timeoutId);
  }, []);

  const updateVideo = async (id: string, updates: Partial<YouTubeVideo>) => {
    setQueueState(prev => {
      const inQueue = prev.queue.find(v => v.id === id);
      const inHistory = prev.history.find(v => v.id === id);
      
      if (inQueue) {
        const updatedVideo = { ...inQueue, ...updates };
        addToStore(STORES.YOUTUBE_QUEUE, updatedVideo).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'ভিডিও আপডেট করতে ব্যর্থ: ' + err.message } })));
        return {
          ...prev,
          queue: prev.queue.map(v => v.id === id ? updatedVideo : v)
        };
      }
      
      if (inHistory) {
        const updatedVideo = { ...inHistory, ...updates };
        addToStore(STORES.YOUTUBE_QUEUE, updatedVideo).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'হিস্টোরি আপডেট করতে ব্যর্থ: ' + err.message } })));
        return {
          ...prev,
          history: prev.history.map(v => v.id === id ? updatedVideo : v)
        };
      }
      
      return prev;
    });
  };

  const addChannel = async (channel: YouTubeChannel) => {
    await addToStore(STORES.YOUTUBE_CHANNELS, channel);
    setChannels(prev => [...prev, channel]);
  };

  const updateChannel = async (id: string, updatedChannel: Partial<YouTubeChannel>) => {
    const channel = channels.find(c => c.id === id);
    if (!channel) return;
    const newChannel = { ...channel, ...updatedChannel };
    await addToStore(STORES.YOUTUBE_CHANNELS, newChannel);
    setChannels(prev => prev.map(c => c.id === id ? newChannel : c));
  };

  const removeChannel = async (id: string) => {
    await deleteFromStore(STORES.YOUTUBE_CHANNELS, id);
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  const addApiKey = async (key: YouTubeApiKey) => {
    await addToStore(STORES.YOUTUBE_API_KEYS, key);
    setApiKeys(prev => [...prev, key]);
  };

  const updateApiKey = async (id: string, updatedKey: Partial<YouTubeApiKey>) => {
    const key = apiKeys.find(k => k.id === id);
    if (!key) return;
    const newKey = { ...key, ...updatedKey };
    await addToStore(STORES.YOUTUBE_API_KEYS, newKey);
    setApiKeys(prev => prev.map(k => k.id === id ? newKey : k));
  };

  const removeApiKey = async (id: string) => {
    await deleteFromStore(STORES.YOUTUBE_API_KEYS, id);
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const toggleAutoProcess = () => {
    setQueueState(prev => {
      const newState = !prev.isAutoProcess;
      localStorage.setItem('yt_monitor_auto_pilot', String(newState));
      if (newState) {
        localStorage.setItem('yt_monitor_auto_download', 'false');
        return { ...prev, isAutoProcess: newState, isAutoDownload: false };
      }
      return { ...prev, isAutoProcess: newState };
    });
  };

  const toggleAutoDownload = () => {
    setQueueState(prev => {
      const newState = !prev.isAutoDownload;
      localStorage.setItem('yt_monitor_auto_download', String(newState));
      if (newState) {
        localStorage.setItem('yt_monitor_auto_pilot', 'false');
        return { ...prev, isAutoDownload: newState, isAutoProcess: false };
      }
      return { ...prev, isAutoDownload: newState };
    });
  };

  const togglePause = () => {
    setQueueState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const addVideoToQueue = async (video: YouTubeVideo, isManual: boolean = false) => {
    setQueueState(prev => {
      if (!isManual) {
        const existingInQueue = prev.queue.find(v => v.videoId === video.videoId);
        if (existingInQueue) {
          // If it exists in queue, just update it
          const updatedQueue = prev.queue.map(v => v.videoId === video.videoId ? video : v);
          addToStore(STORES.YOUTUBE_QUEUE, video).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'কিউতে ভিডিও যোগ করতে ব্যর্থ: ' + err.message } })));
          return { ...prev, queue: updatedQueue };
        }
        
        if (prev.history.some(v => v.videoId === video.videoId)) {
          return prev;
        }
      } else {
        const existingInQueue = prev.queue.find(v => v.id === video.id);
        if (existingInQueue) {
          const updatedQueue = prev.queue.map(v => v.id === video.id ? video : v);
          addToStore(STORES.YOUTUBE_QUEUE, video).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'কিউতে ভিডিও আপডেট করতে ব্যর্থ: ' + err.message } })));
          return { ...prev, queue: updatedQueue };
        }
      }
      
      addToStore(STORES.YOUTUBE_QUEUE, video).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'কিউতে ভিডিও যোগ করতে ব্যর্থ: ' + err.message } })));
      return { ...prev, queue: [...prev.queue, video] };
    });
  };

  const markAllAsRead = async () => {
    const videosToMove = queueState.queue.filter(v => v.status !== 'downloading' && v.status !== 'transcribing');
    const videosToKeep = queueState.queue.filter(v => v.status === 'downloading' || v.status === 'transcribing');
    const now = Date.now();

    const updatedQueue = videosToMove.map(v => ({
      ...v,
      isRead: true,
      markedAt: now
    }));
    
    // Update DB
    for (const v of updatedQueue) {
      await addToStore(STORES.YOUTUBE_QUEUE, v);
    }
    
    setQueueState(prev => ({
      ...prev,
      queue: videosToKeep,
      history: [...prev.history, ...updatedQueue]
    }));
  };

  const markAsRead = async (id: string) => {
    const videoToMark = queueState.queue.find(v => v.id === id);
    if (!videoToMark) return;

    const updatedVideo = { ...videoToMark, isRead: true, markedAt: Date.now() };
    await addToStore(STORES.YOUTUBE_QUEUE, updatedVideo);

    setQueueState(prev => ({
      ...prev,
      queue: prev.queue.filter(v => v.id !== id),
      history: [...prev.history, updatedVideo]
    }));
  };

  const bulkUpdateStatus = async (ids: string[], status: YouTubeVideo['status']) => {
    setQueueState(prev => {
      const newQueue = prev.queue.map(v => {
        if (ids.includes(v.id)) {
          const updated = { ...v, status, progress: status === 'pending' ? 0 : v.progress };
          addToStore(STORES.YOUTUBE_QUEUE, updated).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'স্ট্যাটাস আপডেট করতে ব্যর্থ: ' + err.message } })));
          return updated;
        }
        return v;
      });
      return { ...prev, queue: newQueue };
    });
  };

  const bulkDelete = async (ids: string[]) => {
    const videosToDelete = [...queueState.queue, ...queueState.history].filter(v => ids.includes(v.id));
    const newDeletedIds = videosToDelete.map(v => v.videoId);

    for (const video of videosToDelete) {
      const updatedVideo = { ...video, isDeleted: true };
      await addToStore(STORES.YOUTUBE_QUEUE, updatedVideo);
    }

    setQueueState(prev => ({
      ...prev,
      queue: prev.queue.filter(v => !ids.includes(v.id)),
      history: prev.history.filter(v => !ids.includes(v.id)),
      deletedVideoIds: [...new Set([...prev.deletedVideoIds, ...newDeletedIds])]
    }));
  };

  const bulkMarkAsRead = async (ids: string[]) => {
    const videosToMove = queueState.queue.filter(v => ids.includes(v.id));
    const now = Date.now();
    const updatedVideos = videosToMove.map(v => ({ ...v, isRead: true, markedAt: now }));
    
    for (const v of updatedVideos) {
      await addToStore(STORES.YOUTUBE_QUEUE, v);
    }
    
    setQueueState(prev => ({
      ...prev,
      queue: prev.queue.filter(v => !ids.includes(v.id)),
      history: [...prev.history, ...updatedVideos]
    }));
  };

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  
  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const toggleSelectVideo = (id: string) => {
    setSelectedVideoIds(prev => 
      prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
    );
  };

  const selectAll = (videos: YouTubeVideo[]) => {
    setSelectedVideoIds(videos.map(v => v.id));
  };

  const clearSelection = () => {
    setSelectedVideoIds([]);
  };

  const bulkAction = async (action: 'download' | 'stop' | 'start' | 'delete' | 'clear') => {
    const ids = selectedVideoIds;
    if (ids.length === 0) return;

    if (action === 'delete') {
      await bulkDelete(ids);
    } else if (action === 'download' || action === 'start') {
      const isAnyDownloading = queueState.queue.some(v => v.status === 'downloading');
      let first = true;
      
      setQueueState(prev => {
        const newQueue = [...prev.queue];
        const newHistory = [...prev.history];
        
        ids.forEach(id => {
          const inQueueIndex = newQueue.findIndex(v => v.id === id);
          const inHistoryIndex = newHistory.findIndex(v => v.id === id);
          
          let videoToProcess = null;
          let isCompleted = false;
          
          if (inQueueIndex !== -1) {
            videoToProcess = newQueue[inQueueIndex];
            isCompleted = videoToProcess.status === 'completed' || videoToProcess.status === 'downloaded';
            if (!isCompleted) {
              // Just update status
              const status = (first && !isAnyDownloading) ? 'downloading' : 'waiting';
              first = false;
              newQueue[inQueueIndex] = { ...videoToProcess, status: status as any, progress: 0 };
              addToStore(STORES.YOUTUBE_QUEUE, newQueue[inQueueIndex]).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'ভিডিও প্রসেস করতে ব্যর্থ: ' + err.message } })));
              return;
            }
          } else if (inHistoryIndex !== -1) {
            videoToProcess = newHistory[inHistoryIndex];
            isCompleted = true; // History items are considered completed/read
          }
          
          if (videoToProcess && isCompleted) {
            // Create a new entry for re-download
            const count = newHistory.filter(v => v.videoId === videoToProcess!.videoId).length;
            
            const baseTitle = videoToProcess.title.replace(/ \d+$/, '');
            const newTitle = count > 0 ? `${baseTitle} ${count}` : videoToProcess.title;
            const status = (first && !isAnyDownloading) ? 'downloading' : 'waiting';
            first = false;
            
            const newVideo = { 
              ...videoToProcess, 
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              title: newTitle,
              status: status as any, 
              progress: 0 
            };
            newQueue.push(newVideo);
            addToStore(STORES.YOUTUBE_QUEUE, newVideo).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'নতুন ভিডিও যোগ করতে ব্যর্থ: ' + err.message } })));
          }
        });
        
        return { ...prev, queue: newQueue };
      });
    } else if (action === 'stop') {
      await bulkUpdateStatus(ids, 'pending');
    } else if (action === 'clear') {
       // Clear completed from selection
       const completedIds = queueState.queue.filter(v => ids.includes(v.id) && v.status === 'completed').map(v => v.id);
       await bulkUpdateStatus(completedIds, 'downloaded');
    }
    
    if (action !== 'download' && action !== 'start') {
        clearSelection();
    }
  };

  const retryErrors = async () => {
    setQueueState(prev => {
      const newQueue = prev.queue.map(v => {
        if (v.status === 'error' || v.status === 'failed') {
          const updated = { ...v, status: 'pending' as any, progress: 0, error: undefined, retryCount: 0 };
          addToStore(STORES.YOUTUBE_QUEUE, updated).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'স্ট্যাটাস আপডেট করতে ব্যর্থ: ' + err.message } })));
          return updated;
        }
        return v;
      });
      return { ...prev, queue: newQueue };
    });
  };

  return {
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
    selectedVideoIds,
    toggleSelectVideo,
    selectAll,
    clearSelection,
    bulkAction,
    showReportModal,
    setShowReportModal,
    completedCount,
    setCompletedCount,
    errorCount,
    setErrorCount,
    retryErrors
  };
};
