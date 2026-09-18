import { useState, useRef } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { YouTubeVideo, QueueState } from '../../../types/youtube';
import { getApiUrl } from '../../../services/api';
import { STORES, addToStore } from '../../../services/db';
import React from 'react';

export const useQueueDownload = (
  setQueueState: React.Dispatch<React.SetStateAction<QueueState>>,
  setCountdown: React.Dispatch<React.SetStateAction<number | null>>,
  setCurrentAction: React.Dispatch<React.SetStateAction<string | null>>,
  onAnnounce?: (message: string) => void,
  appLang: 'en' | 'bn' = 'en'
) => {
  const downloadVideo = async (video: YouTubeVideo, isAutoProcess: boolean, isAutoDownload: boolean): Promise<string> => {
    let delayMs = 0;
    if (video.retryCount && video.retryCount > 0) {
      const baseDelay = 30000;
      delayMs = baseDelay * Math.pow(2, video.retryCount - 1);
      if (video.error && (video.error.includes('RATE_LIMIT') || video.error.includes('429') || video.error.toLowerCase().includes('bot') || video.error.toLowerCase().includes('sign in'))) {
        delayMs += 5 * 60 * 1000; 
        console.warn("Rate limit detected previously. Applying extended penalty delay.");
      }
    } else if (isAutoProcess || isAutoDownload) {
      delayMs = Math.floor(Math.random() * (20000 - 8000 + 1)) + 8000; 
    }

    if (delayMs > 0) {
      console.log(`Anti-bot: Waiting ${delayMs/1000}s before request...`);
      setQueueState(prev => ({
        ...prev,
        queue: prev.queue.map(v => v.id === video.id ? { ...v, status: 'downloading', progress: 5 } : v)
      }));
      
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
        targetQuality = 'audio';
      } else if (isAutoDownload) {
        targetQuality = defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat;
      } else {
        targetQuality = defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat;
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
      useAppStore.getState().setAppError('সার্ভার এরর (JSON Parse Failed)');
      throw new Error("সার্ভার এরর (JSON Parse Failed)");
    }

    if (result.error) {
      const errStr = result.error.toLowerCase();
      if (errStr.includes('bot') || errStr.includes('sign in') || errStr.includes('429') || errStr.includes('too many requests')) {
        throw new Error(`RATE_LIMIT: ${result.error}`);
      }
      throw new Error(result.error);
    }

    if (!result.base64) {
      throw new Error('Invalid response structure from server');
    }

    const base64Data = result.base64;
    
    await addToStore(STORES.YOUTUBE_AUDIO, {
      id: video.id,
      videoId: video.videoId,
      base64: base64Data,
      date: new Date().toISOString()
    });

    try {
      const linksStr = localStorage.getItem('jarvis_downloaded_links') || '[]';
      const links = JSON.parse(linksStr);
      const urlToSave = `https://www.youtube.com/watch?v=${video.videoId}`;
      if (!links.some((l: any) => l.url === urlToSave)) {
        links.unshift({ url: urlToSave, title: video.title, timestamp: new Date().toISOString() });
        localStorage.setItem('jarvis_downloaded_links', JSON.stringify(links));
        useAppStore.getState().triggerJarvisLinksUpdated();
        
        const visitedStr = localStorage.getItem('yt_visited_links') || '[]';
        addToStore(STORES.YOUTUBE_LINKS, {
          id: 'links_data',
          downloaded: links,
          visited: JSON.parse(visitedStr),
          updatedAt: new Date().toISOString()
        }).catch(err => useAppStore.getState().setAppError('লিঙ্ক সেভ করতে ব্যর্থ: ' + err.message));
      }
    } catch (e: any) {
      console.error("Error saving downloaded link", e);
      useAppStore.getState().setAppError('ডাউনলোড লিঙ্ক সেভ করতে ব্যর্থ: ' + e.message);
    }
    
    setQueueState(prev => ({
      ...prev,
      queue: prev.queue.map(v => v.id === video.id ? { ...v, status: 'transcribing', progress: 50, retryCount: 0 } : v)
    }));
    
    return base64Data;
  };

  return { downloadVideo };
};
