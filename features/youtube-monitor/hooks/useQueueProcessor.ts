import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { QueueState, YouTubeVideo } from '../../../types/youtube';
import { STORES, addToStore } from '../../../services/db';
import { playSuccessSound, playErrorSound, playCompletionSound } from '../utils/audio';
import { useQueueDownload } from './useQueueDownload';
import { useQueueTranscribe } from './useQueueTranscribe';

export const useQueueProcessor = (
  queueState: QueueState,
  setQueueState: React.Dispatch<React.SetStateAction<QueueState>>,
  isPaused: boolean,
  isAutoProcess: boolean,
  isAutoDownload: boolean,
  onStartTranscription?: (file: Blob, metadata: { name: string, duration: string, size?: string, type?: string, channelName?: string, date?: string }, isAutoProcess?: boolean) => Promise<string | undefined>,
  isAppProcessing: boolean = false,
  onAnnounce?: (message: string) => void,
  appLang: 'en' | 'bn' = 'en',
  setShowReportModal?: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletedCount?: React.Dispatch<React.SetStateAction<number>>,
  setErrorCount?: React.Dispatch<React.SetStateAction<number>>
) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const processingVideoIdRef = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const sessionStatsRef = useRef({ completed: 0, errors: 0 });

  const { downloadVideo } = useQueueDownload(setQueueState, setCountdown, setCurrentAction, onAnnounce, appLang);
  const { transcribeVideo } = useQueueTranscribe(setQueueState, setCurrentAction, onAnnounce, appLang, onStartTranscription, isAppProcessing);

  useEffect(() => {
    if (isPaused || queueState.activeVideoId || isAppProcessing) {
      if (queueState.activeVideoId) {
        processingVideoIdRef.current = queueState.activeVideoId;
      }
      return;
    }

    const shouldSkipAuto = (v: YouTubeVideo) => v.isLive;

    const nextVideo = queueState.queue.find(v => v.status === 'downloading' || v.status === 'transcribing') || 
                     queueState.queue.find(v => v.status === 'waiting') ||
                     ((isAutoProcess || isAutoDownload) ? queueState.queue.find(v => (v.status === 'pending' || (v.status === 'error' && (v.retryCount || 0) < 4)) && !shouldSkipAuto(v)) : null);
    
    if (!nextVideo) {
      processingVideoIdRef.current = null;
      if (isProcessingRef.current && (isAutoProcess || isAutoDownload)) {
        isProcessingRef.current = false;
        playCompletionSound();
        if (sessionStatsRef.current.completed > 0 || sessionStatsRef.current.errors > 0) {
          setCompletedCount?.(sessionStatsRef.current.completed);
          setErrorCount?.(sessionStatsRef.current.errors);
          setShowReportModal?.(true);
          sessionStatsRef.current = { completed: 0, errors: 0 };
        }
      }
      return;
    }

    isProcessingRef.current = true;
    if (processingVideoIdRef.current === nextVideo.id) return;
    processingVideoIdRef.current = nextVideo.id;

    const processVideo = async (video: YouTubeVideo) => {
      setQueueState(prev => ({ ...prev, activeVideoId: video.videoId }));
      
      try {
        let base64Data = '';
        
        if (video.status !== 'transcribing' && video.status !== 'completed') {
          console.log(`Downloading ${video.title} (Attempt ${(video.retryCount || 0) + 1})...`);
          base64Data = await downloadVideo(video, isAutoProcess, isAutoDownload);
        }

        if (isAutoProcess && onStartTranscription) {
          await transcribeVideo(video, base64Data, isAutoProcess);
          
          setQueueState(prev => {
            const updatedVideo = { ...video, status: 'completed' as const, progress: 100, retryCount: 0 };
            addToStore(STORES.YOUTUBE_QUEUE, updatedVideo).catch(err => useAppStore.getState().setAppError('ভিডিও স্ট্যাটাস আপডেট করতে ব্যর্থ: ' + err.message));
            playSuccessSound();
            onAnnounce?.(appLang === 'bn' ? 'ট্রান্সক্রিপশন সম্পন্ন হয়েছে' : 'Transcription completed');
            sessionStatsRef.current.completed += 1;
            
            if (prev.history.some(v => v.id === video.id)) {
              return { ...prev, activeVideoId: null, queue: prev.queue.map(v => v.id === video.id ? updatedVideo : v) };
            }
            return { ...prev, activeVideoId: null, queue: prev.queue.map(v => v.id === video.id ? updatedVideo : v), history: [...prev.history, updatedVideo] };
          });
        } else {
          setQueueState(prev => {
            const updatedVideo = { ...video, status: 'completed' as const, progress: 100, retryCount: 0 };
            addToStore(STORES.YOUTUBE_QUEUE, updatedVideo).catch(err => useAppStore.getState().setAppError('ভিডিও স্ট্যাটাস আপডেট করতে ব্যর্থ: ' + err.message));
            playSuccessSound();
            onAnnounce?.(appLang === 'bn' ? 'ডাউনলোড সম্পন্ন হয়েছে' : 'Download completed');
            sessionStatsRef.current.completed += 1;
            
            return { ...prev, activeVideoId: null, queue: prev.queue.map(v => v.id === video.id ? updatedVideo : v), history: [...prev.history, updatedVideo] };
          });
        }

      } catch (error: any) {
        console.error('Error processing video:', error);
        const errorMessage = String(error);
        const isRateLimit = errorMessage.includes('RATE_LIMIT') || errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.toLowerCase().includes('bot');
        
        if (!isRateLimit) {
          useAppStore.getState().setAppError('ভিডিও প্রসেসিং এ সমস্যা হয়েছে: ' + error.message);
        } else {
          useAppStore.getState().setAppError('ইউটিউব থেকে ব্লক করা হয়েছে (Rate Limit)। ৫ মিনিট পর আবার চেষ্টা করা হবে।');
        }

        const currentRetryCount = (video.retryCount || 0) + 1;
        playErrorSound();
        onAnnounce?.(appLang === 'bn' ? 'ভিডিও প্রসেসিং এ সমস্যা হয়েছে' : 'Error processing video');
        
        setQueueState(prev => {
          const maxRetries = 4;
          const isFailed = currentRetryCount >= maxRetries;
          const updatedVideo = { 
            ...video, 
            status: (isFailed ? 'failed' : 'error') as any, 
            error: errorMessage, 
            retryCount: currentRetryCount 
          };
          addToStore(STORES.YOUTUBE_QUEUE, updatedVideo).catch(err => useAppStore.getState().setAppError('এরর স্ট্যাটাস আপডেট করতে ব্যর্থ: ' + err.message));

          if (isFailed) {
            sessionStatsRef.current.errors += 1;
          }

          return { ...prev, activeVideoId: null, queue: prev.queue.map(v => v.id === video.id ? updatedVideo : v) };
        });
      }
    };

    processVideo(nextVideo);
  }, [queueState.queue, isPaused, isAutoProcess, isAutoDownload, queueState.activeVideoId, setQueueState, isAppProcessing, onAnnounce, appLang, setShowReportModal, setCompletedCount, setErrorCount, downloadVideo, transcribeVideo, onStartTranscription]);

  return { countdown, currentAction };
};
