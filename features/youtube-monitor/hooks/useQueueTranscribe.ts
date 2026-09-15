import { YouTubeVideo, QueueState } from '../../../types/youtube';
import { STORES, addToStore, getFromStore } from '../../../services/db';
import { getApiUrl } from '../../../services/api';
import React from 'react';

export const useQueueTranscribe = (
  setQueueState: React.Dispatch<React.SetStateAction<QueueState>>,
  setCurrentAction: React.Dispatch<React.SetStateAction<string | null>>,
  onAnnounce?: (message: string) => void,
  appLang: 'en' | 'bn' = 'en',
  onStartTranscription?: (file: Blob, metadata: { name: string, duration: string, size?: string, type?: string, channelName?: string, date?: string }, isAutoProcess?: boolean) => Promise<string | undefined>,
  isAppProcessing: boolean = false
) => {
  const transcribeVideo = async (video: YouTubeVideo, base64Data: string, isAutoProcess: boolean): Promise<void> => {
    if (!isAutoProcess || !onStartTranscription) {
      return;
    }

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

    const byteCharacters = atob(base64Data);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
     
    const blob = new Blob([byteArray], { type: 'audio/mp3' });

    const transcript = await onStartTranscription(blob, { 
      name: video.title, 
      duration: video.duration || '00:00',
      size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: blob.type || 'audio/mp3',
      channelName: video.channelTitle,
      date: video.publishedAt
    }, isAutoProcess);
    
    base64Data = '';
    
    if (!transcript) {
      throw new Error("Transcription failed in main app");
    }

    const transcriptItem = {
      id: video.videoId,
      videoId: video.videoId,
      title: video.title,
      transcript,
      date: new Date().toISOString()
    };
    await addToStore(STORES.TRANSCRIPTS, transcriptItem);
  };

  return { transcribeVideo };
};
