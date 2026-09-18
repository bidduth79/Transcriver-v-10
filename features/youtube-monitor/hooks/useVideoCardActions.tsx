import { STORES, getFromStore, addToStore, getAllFromStore } from '../../../services/db';
import { getApiUrl } from '../../../services/api';
import { copyToClipboard } from '../../../utils/clipboard';
import { toast } from 'sonner';
import { CheckCircle, Mic } from 'lucide-react';
import React from 'react';
import { YouTubeVideo } from '../../../types/youtube';

interface UseVideoCardActionsProps {
  video: YouTubeVideo;
  appLang: 'en' | 'bn';
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onUpdateVideo: (id: string, updates: Partial<YouTubeVideo>) => void;
  onLoadTranscript?: (transcript: string, title: string, duration: string, historyId?: string, channelName?: string, date?: string, videoId?: string) => void;
  onStartTranscription?: (file: Blob, metadata: { name: string, duration: string, size?: string, type?: string, channelName?: string, date?: string }, isAutoProcess?: boolean) => Promise<string | undefined>;
}

export const useVideoCardActions = ({
  video,
  appLang,
  addToast,
  onUpdateVideo,
  onLoadTranscript,
  onStartTranscription
}: UseVideoCardActionsProps) => {

  const handleCopyLink = async () => {
    const success = await copyToClipboard(`https://www.youtube.com/watch?v=${video.videoId}`);
    if (success) {
      onUpdateVideo(video.id, { linkCopied: true });
      addToast(appLang === 'bn' ? 'লিংক কপি করা হয়েছে' : 'Link copied', 'success');
    } else {
      addToast(appLang === 'bn' ? 'লিংক কপি করতে সমস্যা হয়েছে' : 'Failed to copy link', 'error');
    }
  };

  const startTranscriptionProcess = async () => {
    if (!onStartTranscription) return;
    addToast(appLang === 'bn' ? 'অডিও প্রস্তুত হচ্ছে...' : 'Preparing audio...', 'info');
    try {
      let base64Data = null;
      let format = 'mp3';
      const audioData = await getFromStore(STORES.YOUTUBE_AUDIO, video.id) as any;
      if (audioData && audioData.base64) {
        base64Data = audioData.base64;
        format = audioData.format || 'mp3';
      } else {
        const apiUrl = getApiUrl('youtube.php');
        const url = `https://www.youtube.com/watch?v=${video.videoId}`;
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, quality: 'audio' })
        });
        
        if (res.status === 429) {
          throw new Error("ইউটিউব থেকে ব্লক করা হয়েছে (Rate Limit)। কিছুক্ষণ পর আবার চেষ্টা করুন।");
        }
        
        const data = await res.json();
        
        if (data.error) {
          const errStr = data.error.toLowerCase();
          if (errStr.includes('bot') || errStr.includes('sign in') || errStr.includes('429') || errStr.includes('too many requests')) {
            throw new Error("ইউটিউব থেকে ব্লক করা হয়েছে (Rate Limit)। কিছুক্ষণ পর আবার চেষ্টা করুন।");
          }
          throw new Error(data.error);
        }
        
        if (data.base64) {
          base64Data = data.base64;
          format = data.format || 'mp3';
        } else {
          throw new Error(data.error || "Could not retrieve audio");
        }
      }
      
      if (base64Data) {
        let mimeType = 'audio/mp3';
        const ext = format.toLowerCase();
        if (ext === 'm4a') mimeType = 'audio/mp4';
        else if (ext === 'wav') mimeType = 'audio/wav';
        else if (ext === 'opus' || ext === 'ogg') mimeType = 'audio/ogg';
        else if (ext === 'webm') mimeType = 'video/webm';
        else if (ext === 'mp4') mimeType = 'video/mp4';
        else if (ext === 'aac') mimeType = 'audio/aac';

        const byteCharacters = atob(base64Data);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        
        const blob = new Blob([byteArray], { type: mimeType });
        
        // Free memory
        base64Data = null;
        
        const transcript = await onStartTranscription(blob, { 
          name: video.title, 
          duration: video.duration || '00:00',
          size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB',
          type: blob.type || mimeType,
          channelName: video.channelTitle,
          date: video.publishedAt
        }, false);
        
        if (transcript) {
          const transcriptItem = {
            id: video.videoId,
            videoId: video.videoId,
            title: video.title,
            transcript,
            date: new Date().toISOString()
          };
          await addToStore(STORES.TRANSCRIPTS, transcriptItem);
        }
      }
    } catch (e) {
      addToast(String(e), 'error');
    }
  };

  const handleTranscriptionClick = async () => {
    const allHistory = (await getAllFromStore(STORES.HISTORY)) as any[];
    const existingHistory = allHistory.find((h: any) => h.fileName === video.title);

    if (existingHistory) {
      toast.custom((t) => (
        <div className="flex flex-col gap-3 p-4 bg-blue-600 text-white rounded-lg shadow-xl border border-blue-500 max-w-sm w-full">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle size={22} className="text-white" />
            </div>
            <div className="flex flex-col flex-grow text-left">
              <span className="font-semibold text-white text-base leading-tight">
                {appLang === 'bn' ? 'ট্রান্সক্রাইভ পূর্বে করা আছে!' : 'Already Transcribed!'}
              </span>
              <span className="text-white/90 text-sm mt-1 leading-snug">
                {appLang === 'bn' ? 'আপনি কি করতে চান?' : 'What do you want to do?'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 w-full mt-1">
            <button 
              onClick={() => { toast.dismiss(t); onLoadTranscript?.(existingHistory.transcript, video.title, video.duration || '00:00', existingHistory.id, video.channelTitle, video.publishedAt, video.id); }}
              className="flex-1 bg-white text-blue-600 border-none py-2 px-4 rounded-lg font-semibold text-sm cursor-pointer hover:bg-blue-50 transition-colors"
            >
              {appLang === 'bn' ? 'লোড করুন' : 'Load'}
            </button>
            <button 
              onClick={() => { toast.dismiss(t); startTranscriptionProcess(); }}
              className="flex-1 bg-transparent text-white border border-white/40 py-2 px-4 rounded-lg font-semibold text-sm cursor-pointer hover:bg-white/10 transition-colors"
            >
              {appLang === 'bn' ? 'পুনরায় ট্রান্সক্রিপ্ট করুন' : 'Transcribe Again'}
            </button>
          </div>
        </div>
      ), { duration: Number.POSITIVE_INFINITY });
    } else {
      toast.custom((t) => (
        <div className="flex flex-col gap-3 p-4 bg-blue-600 text-white rounded-lg shadow-xl border border-blue-500 max-w-sm w-full">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
              <Mic size={22} className="text-white" />
            </div>
            <div className="flex flex-col flex-grow text-left">
              <span className="font-semibold text-white text-base leading-tight">
                {appLang === 'bn' ? 'ট্রান্সক্রিপশন শুরু করুন' : 'Start Transcription'}
              </span>
              <span className="text-white/90 text-sm mt-1 leading-snug">
                {appLang === 'bn' ? 'আপনি কি এই ভিডিওটির অডিও ট্রান্সক্রাইব করতে চান?' : 'Do you want to transcribe the audio of this video?'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 w-full mt-1">
            <button 
              onClick={() => { toast.dismiss(t); startTranscriptionProcess(); }}
              className="flex-1 bg-white text-blue-600 border-none py-2 px-4 rounded-lg font-semibold text-sm cursor-pointer hover:bg-blue-50 transition-colors"
            >
              {appLang === 'bn' ? 'শুরু করুন' : 'Start'}
            </button>
            <button 
              onClick={() => { toast.dismiss(t); }}
              className="flex-1 bg-transparent text-white border border-white/40 py-2 px-4 rounded-lg font-semibold text-sm cursor-pointer hover:bg-white/10 transition-colors"
            >
              {appLang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </div>
      ), { duration: Number.POSITIVE_INFINITY });
    }
  };

  return {
    handleCopyLink,
    handleTranscriptionClick
  };
};
