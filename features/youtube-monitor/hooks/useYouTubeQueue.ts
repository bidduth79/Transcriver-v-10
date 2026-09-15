import { useState, useEffect } from 'react';
import { STORES, getAllFromStore, addToStore, deleteFromStore } from '../../../services/db';
import { YouTubeVideo, QueueState } from '../../../types/youtube';

export const useYouTubeQueue = () => {
  const [queueState, setQueueState] = useState<QueueState>({
    isAutoProcess: localStorage.getItem('yt_monitor_auto_pilot') === 'true',
    isAutoDownload: localStorage.getItem('yt_monitor_auto_download') === 'true',
    isPaused: false,
    activeVideoId: null,
    queue: [],
    history: [],
    deletedVideoIds: []
  });

  const loadQueue = async () => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('yt_monitor_last_date');
    
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
      localStorage.setItem('yt_default_audio_format', 'audio');
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

    loadQueue();

    const handleQueueUpdate = () => {
      loadQueue();
    };

    window.addEventListener(`store-updated-${STORES.YOUTUBE_QUEUE}`, handleQueueUpdate);

    return () => {
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
        loadQueue();
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
        return { ...prev, queue: prev.queue.map(v => v.id === id ? updatedVideo : v) };
      }
      
      if (inHistory) {
        const updatedVideo = { ...inHistory, ...updates };
        addToStore(STORES.YOUTUBE_QUEUE, updatedVideo).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'হিস্টোরি আপডেট করতে ব্যর্থ: ' + err.message } })));
        return { ...prev, history: prev.history.map(v => v.id === id ? updatedVideo : v) };
      }
      
      return prev;
    });
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
          const updatedQueue = prev.queue.map(v => v.videoId === video.videoId ? video : v);
          addToStore(STORES.YOUTUBE_QUEUE, video).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'কিউতে ভিডিও যোগ করতে ব্যর্থ: ' + err.message } })));
          return { ...prev, queue: updatedQueue };
        }
        
        if (prev.history.some(v => v.videoId === video.videoId)) return prev;
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

    const updatedQueue = videosToMove.map(v => ({ ...v, isRead: true, markedAt: now }));
    
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
    queueState,
    setQueueState,
    updateVideo,
    toggleAutoProcess,
    toggleAutoDownload,
    togglePause,
    addVideoToQueue,
    markAllAsRead,
    markAsRead,
    bulkUpdateStatus,
    bulkDelete,
    bulkMarkAsRead,
    retryErrors
  };
};
