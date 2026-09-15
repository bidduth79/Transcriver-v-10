import { useState } from 'react';
import { YouTubeVideo, QueueState } from '../../../types/youtube';
import { STORES, addToStore } from '../../../services/db';

export const useYouTubeSelection = (
  queueState: QueueState,
  setQueueState: React.Dispatch<React.SetStateAction<QueueState>>,
  bulkDelete: (ids: string[]) => Promise<void>,
  bulkUpdateStatus: (ids: string[], status: YouTubeVideo['status']) => Promise<void>
) => {
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

  return {
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
    setErrorCount
  };
};
