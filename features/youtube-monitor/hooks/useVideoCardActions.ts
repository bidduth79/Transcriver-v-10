import { STORES, getFromStore, addToStore, getAllFromStore } from '../../../services/db';
import { getApiUrl } from '../../../services/api';
import { copyToClipboard } from '../../../utils/clipboard';
import Swal from 'sweetalert2';
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
      Swal.fire({
        html: `
          <div style="display: flex; flex-direction: column; padding: 16px 20px; min-width: 320px; max-width: 420px; gap: 16px;">
            <div style="display: flex; align-items: center; width: 100%; gap: 16px;">
              <div style="flex-shrink: 0; width: 40px; height: 40px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg style="width: 22px; height: 22px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
                <span style="font-weight: 600; color: white; font-size: 16px; line-height: 1.3;">${appLang === 'bn' ? 'ট্রান্সক্রাইভ পূর্বে করা আছে!' : 'Already Transcribed!'}</span>
                <span style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; line-height: 1.4;">${appLang === 'bn' ? 'আপনি কি করতে চান?' : 'What do you want to do?'}</span>
              </div>
            </div>
            <div style="display: flex; gap: 12px; width: 100%; margin-top: 4px;">
              <button id="swal-custom-load" style="flex: 1; background-color: white; color: #3b82f6; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'লোড করুন' : 'Load'}</button>
              <button id="swal-custom-retranscribe" style="flex: 1; background-color: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'পুনরায় ট্রান্সক্রিপ্ট করুন' : 'Transcribe Again'}</button>
            </div>
          </div>
        `,
        toast: false,
        position: 'center',
        showConfirmButton: false,
        showCloseButton: false,
        background: '#3b82f6',
        padding: 0,
        customClass: {
          container: 'custom-centered-modal-container',
          popup: 'custom-centered-modal-popup',
          htmlContainer: 'custom-centered-modal-html-container'
        },
        didOpen: () => {
          const loadBtn = document.getElementById('swal-custom-load');
          const retranscribeBtn = document.getElementById('swal-custom-retranscribe');
          
          if (loadBtn) {
            loadBtn.addEventListener('click', () => {
              Swal.close();
              onLoadTranscript?.(existingHistory.transcript, video.title, video.duration || '00:00', existingHistory.id, video.channelTitle, video.publishedAt, video.id);
            });
          }
          
          if (retranscribeBtn) {
            retranscribeBtn.addEventListener('click', () => {
              Swal.close();
              startTranscriptionProcess();
            });
          }
        }
      });
    } else {
      Swal.fire({
        html: `
          <div style="display: flex; flex-direction: column; padding: 16px 20px; min-width: 320px; max-width: 420px; gap: 16px;">
            <div style="display: flex; align-items: center; width: 100%; gap: 16px;">
              <div style="flex-shrink: 0; width: 40px; height: 40px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg style="width: 22px; height: 22px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
              </div>
              <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
                <span style="font-weight: 600; color: white; font-size: 16px; line-height: 1.3;">${appLang === 'bn' ? 'ট্রান্সক্রিপশন শুরু করুন' : 'Start Transcription'}</span>
                <span style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; line-height: 1.4;">${appLang === 'bn' ? 'আপনি কি এই ভিডিওটির অডিও ট্রান্সক্রাইব করতে চান?' : 'Do you want to transcribe the audio of this video?'}</span>
              </div>
            </div>
            <div style="display: flex; gap: 12px; width: 100%; margin-top: 4px;">
              <button id="swal-custom-start" style="flex: 1; background-color: white; color: #3b82f6; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'শুরু করুন' : 'Start'}</button>
              <button id="swal-custom-cancel-start" style="flex: 1; background-color: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'বাতিল' : 'Cancel'}</button>
            </div>
          </div>
        `,
        toast: false,
        position: 'center',
        showConfirmButton: false,
        showCloseButton: false,
        background: '#3b82f6',
        padding: 0,
        customClass: {
          container: 'custom-centered-modal-container',
          popup: 'custom-centered-modal-popup',
          htmlContainer: 'custom-centered-modal-html-container'
        },
        didOpen: () => {
          const startBtn = document.getElementById('swal-custom-start');
          const cancelBtn = document.getElementById('swal-custom-cancel-start');
          
          if (startBtn) {
            startBtn.addEventListener('click', () => {
              Swal.close();
              startTranscriptionProcess();
            });
          }
          
          if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
              Swal.close();
            });
          }
        }
      });
    }
  };

  return {
    handleCopyLink,
    handleTranscriptionClick
  };
};
