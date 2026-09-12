import React, { useEffect, useState } from 'react';
import { QueueState, YouTubeVideo } from '../../../types/youtube';
import { getApiUrl } from '../../../services/api';
import { STORES, addToStore, getFromStore } from '../../../services/db';
import { getActiveProvider, incrementTotalCalls } from '../../../services/ApiKeyManager';
import { playSuccessSound, playErrorSound, playCompletionSound } from '../utils/audio';

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
  const processingVideoIdRef = React.useRef<string | null>(null);
  const isProcessingRef = React.useRef<boolean>(false);
  const sessionStatsRef = React.useRef({ completed: 0, errors: 0 });

  useEffect(() => {
    if (isPaused || queueState.activeVideoId || isAppProcessing) {
      if (queueState.activeVideoId) {
        processingVideoIdRef.current = queueState.activeVideoId;
      }
      return;
    }

    // Pick the next video to process
    // Priority: 
    // 1. Any video already marked as 'downloading' or 'transcribing' (to resume/continue)
    // 2. The first video marked as 'waiting'
    // 3. If auto-process is on, the first 'pending' video OR 'error' video with retryCount < 2
    
    // Helper to check if a video should be skipped by auto-pilot
    const shouldSkipAuto = (v: YouTubeVideo) => {
      if (v.isLive) return true;
      return false;
    };

    const nextVideo = queueState.queue.find(v => v.status === 'downloading' || v.status === 'transcribing') || 
                     queueState.queue.find(v => v.status === 'waiting') ||
                     ((isAutoProcess || isAutoDownload) ? queueState.queue.find(v => (v.status === 'pending' || (v.status === 'error' && (v.retryCount || 0) < 4)) && !shouldSkipAuto(v)) : null);
    
    if (!nextVideo) {
      processingVideoIdRef.current = null;
      
      // If we were processing and now there are no more videos, show the report
      if (isProcessingRef.current && (isAutoProcess || isAutoDownload)) {
        isProcessingRef.current = false;
        playCompletionSound();
        if (sessionStatsRef.current.completed > 0 || sessionStatsRef.current.errors > 0) {
          setCompletedCount?.(sessionStatsRef.current.completed);
          setErrorCount?.(sessionStatsRef.current.errors);
          setShowReportModal?.(true);
          
          // Reset stats for next session
          sessionStatsRef.current = { completed: 0, errors: 0 };
        }
      }
      return;
    }

    isProcessingRef.current = true;

    if (processingVideoIdRef.current === nextVideo.id) {
      return;
    }
    processingVideoIdRef.current = nextVideo.id;

    // Process next video
    const processVideo = async (video: YouTubeVideo) => {
      setQueueState(prev => ({ ...prev, activeVideoId: video.videoId }));
      
      try {
        let base64Data = '';
        
        // 1. Download if not already downloaded/transcribing
        if (video.status !== 'transcribing' && video.status !== 'completed') {
          console.log(`Downloading ${video.title} (Attempt ${(video.retryCount || 0) + 1})...`);
          
          // Anti-bot delay logic
          let delayMs = 0;
          if (video.retryCount && video.retryCount > 0) {
            // Exponential backoff for retries: 30s, 60s, 120s
            const baseDelay = 30000;
            delayMs = baseDelay * Math.pow(2, video.retryCount - 1);
            
            // If previous error was a rate limit or bot detection, add a massive penalty delay (5 minutes)
            if (video.error && (video.error.includes('RATE_LIMIT') || video.error.includes('429') || video.error.toLowerCase().includes('bot') || video.error.toLowerCase().includes('sign in'))) {
              delayMs += 5 * 60 * 1000; 
              console.warn("Rate limit detected previously. Applying extended penalty delay.");
            }
          } else if (isAutoProcess || isAutoDownload) {
            // Random delay between 8 to 20 seconds for normal auto-processing to mimic human behavior better
            delayMs = Math.floor(Math.random() * (20000 - 8000 + 1)) + 8000; 
          }

          if (delayMs > 0) {
            console.log(`Anti-bot: Waiting ${delayMs/1000}s before request...`);
            setQueueState(prev => ({
              ...prev,
              queue: prev.queue.map(v => v.id === video.id ? { ...v, status: 'downloading', progress: 5 } : v)
            }));
            
            // Countdown logic
            let remaining = Math.ceil(delayMs / 1000);
            setCountdown(remaining);
            setCurrentAction(`Waiting for ${video.title}...`);
            onAnnounce?.(appLang === 'bn' ? 'ডাউনলোডের জন্য অপেক্ষা করা হচ্ছে' : 'Waiting before downloading');
            
            while (remaining > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              remaining--;
              setCountdown(remaining);
            }
            setCountdown(null);
          }

          setCurrentAction(`Downloading ${video.title}...`);
          onAnnounce?.(appLang === 'bn' ? 'ডাউনলোড শুরু হচ্ছে' : 'Downloading started');
          
          setQueueState(prev => ({
            ...prev,
            queue: prev.queue.map(v => v.id === video.id ? { ...v, status: 'downloading', progress: 10 } : v)
          }));

          const apiUrl = getApiUrl('youtube.php');
          const url = `https://www.youtube.com/watch?v=${video.videoId}`;
          const defaultDownloadType = localStorage.getItem('yt_default_download_type') || 'audio';
          const defaultAudioFormat = localStorage.getItem('yt_default_audio_format') || 'audio';
          const defaultVideoFormat = localStorage.getItem('yt_default_video_format') || '720p';
          
          let targetQuality = video.format?.quality;
          if (!targetQuality) {
            if (isAutoProcess) {
              targetQuality = 'audio'; // Auto-pilot always needs audio
            } else if (isAutoDownload) {
              targetQuality = defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat;
            } else {
              targetQuality = defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat; // Fallback
            }
          }

          const bodyPayload = { 
              url, 
              title: video.title,
              quality: targetQuality,
              bitrate: localStorage.getItem('yt_default_bitrate') || '16',
              channels: localStorage.getItem('yt_default_channels') || '1',
              samplerate: localStorage.getItem('yt_default_samplerate') || '16000',
          };

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
          });

          if (response.status === 429) {
            throw new Error("RATE_LIMIT: HTTP 429 Too Many Requests (YouTube IP Block)");
          }

          const text = await response.text();
          let result;
          try {
            result = JSON.parse(text);
          } catch (e) {
            console.error("Server Raw Response:", text);
            window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'সার্ভার এরর (JSON Parse Failed)' } }));
            throw new Error("সার্ভার এরর (JSON Parse Failed)");
          }

          if (result.error) {
            const errStr = result.error.toLowerCase();
            if (errStr.includes('bot') || errStr.includes('sign in') || errStr.includes('429') || errStr.includes('too many requests')) {
              throw new Error(`RATE_LIMIT: ${result.error}`);
            }
            throw new Error(result.error);
          }

          if (result.base64) {
            base64Data = result.base64;
            
            // Save audio to store for manual transcription later
            await addToStore(STORES.YOUTUBE_AUDIO, {
              id: video.id,
              videoId: video.videoId,
              base64: base64Data,
              date: new Date().toISOString()
            });

            // Save link to downloaded links list
            try {
              const linksStr = localStorage.getItem('jarvis_downloaded_links') || '[]';
              const links = JSON.parse(linksStr);
              const urlToSave = `https://www.youtube.com/watch?v=${video.videoId}`;
              if (!links.some((l: any) => l.url === urlToSave)) {
                links.unshift({ url: urlToSave, title: video.title, timestamp: new Date().toISOString() });
                localStorage.setItem('jarvis_downloaded_links', JSON.stringify(links));
                window.dispatchEvent(new Event('jarvis_links_updated'));
                
                // Sync to cloud
                const visitedStr = localStorage.getItem('yt_visited_links') || '[]';
                addToStore(STORES.YOUTUBE_LINKS, {
                  id: 'links_data',
                  downloaded: links,
                  visited: JSON.parse(visitedStr),
                  updatedAt: new Date().toISOString()
                }).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'লিঙ্ক সেভ করতে ব্যর্থ: ' + err.message } })));
              }
            } catch (e: any) {
              console.error("Error saving downloaded link", e);
              window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'ডাউনলোড লিঙ্ক সেভ করতে ব্যর্থ: ' + e.message } }));
            }
            
            // Update status to downloaded/transcribing
            setQueueState(prev => ({
              ...prev,
              queue: prev.queue.map(v => v.id === video.id ? { ...v, status: 'transcribing', progress: 50, retryCount: 0 } : v) // Reset retry count for next step
            }));
          } else {
            throw new Error('Invalid response structure from server');
          }
        }

        // 2. Transcribe
        if (isAutoProcess && onStartTranscription) {
          // Wait if app is busy
          if (isAppProcessing) {
            console.log("App busy, waiting to transcribe...");
            setQueueState(prev => ({ ...prev, activeVideoId: null }));
            return;
          }

          console.log(`Transcribing ${video.title} (Attempt ${(video.retryCount || 0) + 1})...`);
          setCurrentAction(`Transcribing ${video.title}...`);
          onAnnounce?.(appLang === 'bn' ? 'ট্রান্সক্রিপশন শুরু হচ্ছে' : 'Transcription started');
          
          if (!base64Data) {
             const audioData = await getFromStore(STORES.YOUTUBE_AUDIO, video.id) as any;
             if (audioData && audioData.base64) {
               base64Data = audioData.base64;
             } else {
               // Re-download if audio is missing
               const apiUrl = getApiUrl('youtube.php');
               const url = `https://www.youtube.com/watch?v=${video.videoId}`;
               const res = await fetch(apiUrl, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ url, title: video.title, quality: 'audio' })
               });
               
               if (res.status === 429) {
                 throw new Error("RATE_LIMIT: HTTP 429 Too Many Requests (YouTube IP Block)");
               }
               
               const data = await res.json();
               
               if (data.error) {
                 const errStr = data.error.toLowerCase();
                 if (errStr.includes('bot') || errStr.includes('sign in') || errStr.includes('429') || errStr.includes('too many requests')) {
                   throw new Error(`RATE_LIMIT: ${data.error}`);
                 }
                 throw new Error(data.error);
               }
               
               if (data.base64) base64Data = data.base64;
               else throw new Error("Could not retrieve audio for transcription");
             }
          }

          // Convert base64 to Blob natively to prevent UI freeze
          const byteCharacters = atob(base64Data);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
          }
           
          const blob = new Blob([byteArray], { type: 'audio/mp3' });

          // Start transcription in main app and wait for it to finish
          const transcript = await onStartTranscription(blob, { 
            name: video.title, 
            duration: video.duration || '00:00',
            size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB',
            type: blob.type || 'audio/mp3',
            channelName: video.channelTitle,
            date: video.publishedAt
          }, isAutoProcess);
          
          // Free memory
          base64Data = '';
          
          if (!transcript) {
            throw new Error("Transcription failed in main app");
          }

          // Save transcript to YouTube transcripts store
          const transcriptItem = {
            id: video.videoId,
            videoId: video.videoId,
            title: video.title,
            transcript,
            date: new Date().toISOString()
          };
          await addToStore(STORES.TRANSCRIPTS, transcriptItem);
          
          // 3. Finalize
          setQueueState(prev => {
            const updatedVideo = { ...video, status: 'completed' as const, progress: 100, retryCount: 0 };
            addToStore(STORES.YOUTUBE_QUEUE, updatedVideo).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'ভিডিও স্ট্যাটাস আপডেট করতে ব্যর্থ: ' + err.message } })));
            playSuccessSound();
            onAnnounce?.(appLang === 'bn' ? 'ট্রান্সক্রিপশন সম্পন্ন হয়েছে' : 'Transcription completed');
            
            sessionStatsRef.current.completed += 1;
            
            if (prev.history.some(v => v.id === video.id)) {
              return {
                ...prev,
                activeVideoId: null,
                queue: prev.queue.map(v => v.id === video.id ? updatedVideo : v)
              };
            }
            return {
              ...prev,
              activeVideoId: null,
              queue: prev.queue.map(v => v.id === video.id ? updatedVideo : v),
              history: [...prev.history, updatedVideo]
            };
          });
        } else {
          // If not auto-process, just mark as completed after download
          setQueueState(prev => {
            const updatedVideo = { ...video, status: 'completed' as const, progress: 100, retryCount: 0 };
            addToStore(STORES.YOUTUBE_QUEUE, updatedVideo).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'ভিডিও স্ট্যাটাস আপডেট করতে ব্যর্থ: ' + err.message } })));
            playSuccessSound();
            onAnnounce?.(appLang === 'bn' ? 'ডাউনলোড সম্পন্ন হয়েছে' : 'Download completed');
            
            sessionStatsRef.current.completed += 1;
            
            return {
              ...prev,
              activeVideoId: null,
              queue: prev.queue.map(v => v.id === video.id ? updatedVideo : v),
              history: [...prev.history, updatedVideo]
            };
          });
        }

      } catch (error: any) {
        console.error('Error processing video:', error);
        
        const errorMessage = String(error);
        const isRateLimit = errorMessage.includes('RATE_LIMIT') || errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.toLowerCase().includes('bot');
        
        if (!isRateLimit) {
          window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'ভিডিও প্রসেসিং এ সমস্যা হয়েছে: ' + error.message } }));
        } else {
          window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'ইউটিউব থেকে ব্লক করা হয়েছে (Rate Limit)। ৫ মিনিট পর আবার চেষ্টা করা হবে।' } }));
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
          addToStore(STORES.YOUTUBE_QUEUE, updatedVideo).catch(err => window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'এরর স্ট্যাটাস আপডেট করতে ব্যর্থ: ' + err.message } })));

          if (isFailed) {
            sessionStatsRef.current.errors += 1;
          }

          return {
            ...prev,
            activeVideoId: null,
            queue: prev.queue.map(v => v.id === video.id ? updatedVideo : v)
          };
        });
      }
    };

    processVideo(nextVideo);
  }, [queueState.queue, isPaused, isAutoProcess, isAutoDownload, queueState.activeVideoId, setQueueState, isAppProcessing, onAnnounce, appLang, setShowReportModal, setCompletedCount, setErrorCount]);

  return { countdown, currentAction };
};
