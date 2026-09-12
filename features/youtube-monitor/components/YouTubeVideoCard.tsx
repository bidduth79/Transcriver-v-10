import React from 'react';
import { YouTubeVideo } from '../../../types/youtube';
import { STORES, getFromStore, addToStore, getAllFromStore } from '../../../services/db';
import { getApiUrl } from '../../../services/api';
import { Play, Clock, Download, ChevronDown, Video, Headphones, Copy, CheckCircle2, X, Loader2, Bot, RefreshCw, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import Swal from 'sweetalert2';
import { copyToClipboard } from '../../../utils/clipboard';

// Expose Swal to window for inline onclick handlers in HTML strings
(window as any).Swal = Swal;

import { getRelativeTime } from '../utils/formatters';

interface YouTubeVideoCardProps {
  video: YouTubeVideo;
  appLang: 'en' | 'bn';
  openDownloadId: string | null;
  setOpenDownloadId: (id: string | null) => void;
  formatTime: (dateString: string, appLang?: 'en' | 'bn') => string;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onMarkAsRead: (id: string) => void;
  onDownload: (video: YouTubeVideo) => void;
  onUpdateVideo: (id: string, updates: Partial<YouTubeVideo>) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onLoadTranscript?: (transcript: string, title: string, duration: string, historyId?: string, channelName?: string, date?: string, videoId?: string) => void;
  onStartTranscription?: (file: Blob, metadata: { name: string, duration: string, size?: string, type?: string, channelName?: string, date?: string }, isAutoProcess?: boolean) => Promise<string | undefined>;
  isDark?: boolean;
}

export const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({
  video,
  appLang,
  openDownloadId,
  setOpenDownloadId,
  formatTime,
  addToast,
  onMarkAsRead,
  onDownload,
  onUpdateVideo,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onLoadTranscript,
  onStartTranscription,
  isDark = false
}) => {
  const isVisited = (video.downloaded && video.linkCopied) || video.isRead;
  const isDownloading = video.status === 'downloading';
  const isWaiting = video.status === 'waiting';
  const isCompleted = video.status === 'completed' || video.status === 'downloaded';
  const isError = video.status === 'error' || video.status === 'failed';
  const isPending = video.status === 'pending';

  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = React.useState<any>(null);
  const [hasTranscript, setHasTranscript] = React.useState(false);

  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    const handleSettingsChange = () => forceUpdate();
    window.addEventListener('yt_settings_changed', handleSettingsChange);
    return () => window.removeEventListener('yt_settings_changed', handleSettingsChange);
  }, []);

  React.useEffect(() => {
    const checkTranscript = async () => {
      try {
        const allHistory = (await getAllFromStore(STORES.HISTORY)) as any[];
        const existingHistory = allHistory.find((h: any) => h.fileName === video.title);
        if (existingHistory) {
          setHasTranscript(true);
        }
      } catch (e) {
        console.error("Failed to check transcript history:", e);
      }
    };
    checkTranscript();
  }, [video.title]);

  const defaultDownloadType = (localStorage.getItem('yt_default_download_type') as 'video' | 'audio') || 'audio';
  const defaultVideoFormat = localStorage.getItem('yt_default_video_format') || '720p';
  const defaultAudioFormat = localStorage.getItem('yt_default_audio_format') || 'audio';

  const getFormatLabel = (type: 'video' | 'audio', quality: string) => {
    if (type === 'video') return quality;
    if (quality === 'audio_best') return 'Best';
    if (quality === 'mp3') return 'MP3 128k';
    if (quality === '64k') return 'MP3 64k';
    if (quality === '32k') return 'MP3 32k';
    if (quality === '16k') return 'MP3 16k';
    if (quality === 'm4a') return 'M4A';
    if (quality === 'wav') return 'WAV';
    if (quality === 'opus') return 'Opus HQ';
    if (quality === 'audio') return 'Opus 16kHz (16 bit, 1 channel)';
    return quality;
  };

  const currentFormatLabel = getFormatLabel(defaultDownloadType, defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat);

  const handleDownloadClick = () => {
    const isTranscriptionError = video.error?.includes('Transcription failed') || video.error?.includes('Could not retrieve audio for transcription');
    
    if (isError && isTranscriptionError) {
      onUpdateVideo(video.id, { status: 'transcribing', progress: 0, error: undefined, retryCount: (video.retryCount || 0) + 1 });
      addToast(appLang === 'bn' ? 'ট্রান্সক্রিপশন পুনরায় চেষ্টা হচ্ছে...' : 'Retrying transcription...', 'info');
      return;
    }

    const proceedDownload = () => {
      const formatToUse = { 
        type: defaultDownloadType, 
        quality: defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat, 
        label: currentFormatLabel 
      };
      onDownload({ ...video, format: formatToUse });
      onUpdateVideo(video.id, { downloaded: true });
      setOpenDownloadId(null);
    };

    if (video.downloaded || video.status === 'completed' || video.status === 'downloaded') {
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
                <span style="font-weight: 600; color: white; font-size: 16px; line-height: 1.3;">${appLang === 'bn' ? 'ইতিমধ্যেই ডাউনলোড করা হয়েছে!' : 'Already Downloaded!'}</span>
                <span style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; line-height: 1.4;">${appLang === 'bn' ? 'আপনি কি এটি পুনরায় ডাউনলোড করতে চান?' : 'Do you want to download it again?'}</span>
              </div>
            </div>
            <div style="display: flex; gap: 12px; width: 100%; margin-top: 4px;">
              <button id="swal-custom-confirm" style="flex: 1; background-color: white; color: #3b82f6; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'হ্যাঁ, শুরু করুন' : 'Yes, start'}</button>
              <button id="swal-custom-cancel" style="flex: 1; background-color: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'না, বাতিল' : 'No, cancel'}</button>
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
          const confirmBtn = document.getElementById('swal-custom-confirm');
          const cancelBtn = document.getElementById('swal-custom-cancel');
          
          if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
              Swal.close();
              proceedDownload();
            });
          }
          
          if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
              Swal.close();
            });
          }
        }
      });
    } else {
      proceedDownload();
    }
  };

  return (
    <div 
      onClick={() => isSelectMode && onToggleSelect?.()}
      className={`rounded-xl shadow-sm border flex flex-col relative group hover:shadow-md transition-all ${
      openDownloadId === video.id ? 'z-50' : 'z-10'
    } ${
      isSelectMode ? 'cursor-pointer' : ''
    } ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 
      isDownloading ? (isDark ? 'border-blue-500 ring-1 ring-blue-900 bg-blue-900/20' : 'border-blue-300 ring-1 ring-blue-100') : 
      isWaiting ? (isDark ? 'border-yellow-600 bg-yellow-900/20' : 'border-yellow-300 bg-yellow-50/30') : 
      isCompleted ? (isDark ? 'border-green-600 bg-green-900/20' : 'border-green-300 bg-green-50/30') : 
      isError ? (isDark ? 'border-red-600 bg-red-900/20' : 'border-red-300 bg-red-50/30') : 
      isVisited ? (isDark ? 'border-gray-700 bg-gray-800 opacity-80' : 'border-gray-200 bg-gray-50 opacity-80') : 
      (isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white')
    }`}>
      {isSelectMode && (
        <div className="absolute top-2 right-2 z-20">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : (isDark ? 'bg-gray-800/80 border-gray-500' : 'bg-white/80 border-gray-300')}`}>
            {isSelected && <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>
      )}
      <div className="relative aspect-video cursor-pointer overflow-hidden rounded-t-xl" onClick={(e) => {
        if (isSelectMode) {
          if (onToggleSelect) onToggleSelect();
          return;
        }
        window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
      }}>
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isVisited ? 'grayscale-[30%]' : ''}`} 
        />
        {video.isLive ? (
          <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10 flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
            </span>
            {appLang === 'bn' ? 'লাইভ' : 'LIVE'}
          </div>
        ) : video.duration ? (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
            {video.duration}
          </div>
        ) : null}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/80 flex items-center justify-center backdrop-blur-sm bg-black/20 group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-white ml-1" />
          </div>
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {isCompleted && (
            <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider shadow-sm w-fit">
              <CheckCircle2 className="w-3 h-3" /> {appLang === 'bn' ? 'ডাউনলোড সম্পন্ন' : 'Downloaded'}
            </div>
          )}
          {isWaiting && (
            <div className="bg-yellow-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider shadow-sm w-fit">
              <Clock className="w-3 h-3" /> {appLang === 'bn' ? 'অপেক্ষমান' : 'Waiting'}
            </div>
          )}
          {video.status === 'transcribing' && (
            <div className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider shadow-sm w-fit">
              <Loader2 className="w-3 h-3 animate-spin" /> {appLang === 'bn' ? 'ট্রান্সক্রাইবিং' : 'Transcribing'}
            </div>
          )}
          {isError && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const isTranscriptionError = video.error?.includes('Transcription failed') || video.error?.includes('Could not retrieve audio for transcription');
                
                if (isTranscriptionError) {
                  onUpdateVideo(video.id, { status: 'transcribing', progress: 0, error: undefined, retryCount: (video.retryCount || 0) + 1 });
                  addToast(appLang === 'bn' ? 'ট্রান্সক্রিপশন পুনরায় চেষ্টা হচ্ছে...' : 'Retrying transcription...', 'info');
                } else {
                  onUpdateVideo(video.id, { status: 'downloading', progress: 0, error: undefined, retryCount: (video.retryCount || 0) + 1 });
                  addToast(appLang === 'bn' ? 'পুনরায় ডাউনলোড শুরু হচ্ছে...' : 'Restarting download...', 'info');
                }
              }}
              className="text-red-600 hover:text-red-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider w-fit cursor-pointer transition-colors group"
            >
              <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" /> {(video.error?.includes('Transcription failed') || video.error?.includes('Could not retrieve audio for transcription')) ? (appLang === 'bn' ? 'ট্রান্সক্রাইব এরর (আবার চেষ্টা)' : 'Transcription Error (Retry)') : video.status === 'failed' ? (appLang === 'bn' ? 'ব্যর্থ (আবার চেষ্টা)' : 'Failed (Retry)') : (appLang === 'bn' ? 'আবার চেষ্টা' : 'Retry')}
            </button>
          )}
          {video.linkCopied && (
            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider shadow-sm w-fit">
              <Copy className="w-3 h-3" /> {appLang === 'bn' ? 'লিংক কপিড' : 'URL Copied'}
            </div>
          )}
          {isVisited && (
            <div className="bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider shadow-sm w-fit">
              <CheckCircle2 className="w-3 h-3" /> {appLang === 'bn' ? 'ভিজিটেড' : 'Visited'}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <a 
          href={`https://www.youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-semibold line-clamp-2 mb-3 text-[15px] leading-snug font-stylish-bn hover:text-blue-600 transition-colors ${isVisited ? (isDark ? 'text-gray-400' : 'text-gray-600') : (isDark ? 'text-gray-200' : 'text-gray-900')}`} 
          title={video.title}
        >
          {video.title}
        </a>
        
        <div className="flex items-center justify-between mt-auto mb-4">
          <span className={`text-xs font-semibold px-2 py-1 rounded border truncate max-w-[60%] ${
            isVisited 
              ? (isDark ? 'text-gray-400 bg-gray-800 border-gray-700' : 'text-gray-500 bg-gray-100 border-gray-200') 
              : (isDark ? 'text-red-400 bg-red-900/30 border-red-800' : 'text-red-600 bg-red-50 border-red-100')
          }`}>
            {video.channelTitle}
          </span>
          <span className={`text-xs flex items-center gap-1 font-medium group relative cursor-help ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Clock className="w-3 h-3" /> 
            <span className="grid">
              <span className="col-start-1 row-start-1 transition-opacity duration-300 group-hover:opacity-0 whitespace-nowrap text-right">
                {getRelativeTime(video.publishedAt, appLang)}
              </span>
              <span className="col-start-1 row-start-1 transition-opacity duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap text-right">
                {formatTime(video.publishedAt, appLang)}
              </span>
            </span>
          </span>
        </div>
        
        {/* Progress Bar for downloading */}
        {(isDownloading || isPending || isWaiting) && video.progress !== undefined && (
          <div className={`w-full rounded-full h-1.5 mb-3 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div 
              className={`${isWaiting ? 'bg-yellow-500' : 'bg-blue-500'} h-1.5 rounded-full transition-all duration-300`} 
              style={{ width: `${video.progress}%` }}
            ></div>
          </div>
        )}
        
        <div className="relative flex gap-2">
          <div className="flex flex-1">
            <button 
              onClick={handleDownloadClick}
              disabled={isDownloading || isWaiting}
              className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-medium border border-r-0 rounded-l-lg transition-colors font-stylish-bn cursor-pointer ${
                isDownloading ? (isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200') : 
                isWaiting ? (isDark ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' : 'bg-yellow-50 text-yellow-700 border-yellow-200') :
                isCompleted ? (isDark ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-700 border-green-200') :
                isError ? (isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-200') :
                isVisited ? (isDark ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200') : 
                (isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200')
              }`}
            >
              <Download className="w-4 h-4" /> 
              {isDownloading ? (appLang === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Downloading...') : 
               isWaiting ? (appLang === 'bn' ? 'অপেক্ষমান...' : 'Waiting...') :
               isCompleted ? (appLang === 'bn' ? 'আবার ডাউনলোড' : 'Download Again') :
               isError ? ((video.error?.includes('Transcription failed') || video.error?.includes('Could not retrieve audio for transcription')) ? (appLang === 'bn' ? 'ট্রান্সক্রাইব এরর (আবার চেষ্টা)' : 'Transcription Error (Retry)') : (appLang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry')) :
               `${appLang === 'bn' ? 'ডাউনলোড করুন' : 'Download'} (${currentFormatLabel})`} 
            </button>
            <button 
              onClick={() => setOpenDownloadId(openDownloadId === video.id ? null : video.id)}
              className={`px-2 py-2.5 flex items-center justify-center border rounded-r-lg transition-colors cursor-pointer ${
                isDownloading ? (isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200') : 
                isVisited ? (isDark ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200') : 
                (isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200')
              }`}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${openDownloadId === video.id ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <button
            onClick={async () => {
              const success = await copyToClipboard(`https://www.youtube.com/watch?v=${video.videoId}`);
              if (success) {
                onUpdateVideo(video.id, { linkCopied: true });
                addToast(appLang === 'bn' ? 'লিংক কপি করা হয়েছে' : 'Link copied', 'success');
              } else {
                addToast(appLang === 'bn' ? 'লিংক কপি করতে সমস্যা হয়েছে' : 'Failed to copy link', 'error');
              }
            }}
            className={`p-2.5 flex items-center justify-center border rounded-lg transition-colors cursor-pointer group ${isDark ? 'text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-gray-200 border-gray-700' : 'text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 border-gray-200'}`}
            title={appLang === 'bn' ? 'লিংক কপি করুন' : 'Copy Link'}
          >
            <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          {isCompleted && (onLoadTranscript || onStartTranscription) && (
            <button
              onClick={async () => {
                const allHistory = (await getAllFromStore(STORES.HISTORY)) as any[];
                const existingHistory = allHistory.find((h: any) => h.fileName === video.title);

                const startTranscription = async () => {
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
                          startTranscription();
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
                          startTranscription();
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
              }}
              className={`p-2.5 flex items-center justify-center rounded-lg transition-colors cursor-pointer border group ${
                hasTranscript 
                  ? (isDark ? 'text-green-400 bg-green-900/20 hover:bg-green-900/40 border-green-800' : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200') 
                  : (isDark ? 'text-indigo-400 bg-indigo-900/20 hover:bg-indigo-900/40 border-indigo-800' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200')
              }`}
              title={appLang === 'bn' ? (hasTranscript ? 'ট্রান্সক্রিপ্ট লোড করুন' : 'ট্রান্সক্রিপ্ট শুরু করুন') : (hasTranscript ? 'Load Transcript' : 'Start Transcript')}
            >
              {hasTranscript ? <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" /> : <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            </button>
          )}

          <button
            onClick={() => onMarkAsRead(video.id)}
            className={`p-2.5 flex items-center justify-center border rounded-lg transition-colors cursor-pointer group ${
              isDark 
                ? 'text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-green-400 border-gray-700' 
                : 'text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-green-600 border-gray-200'
            }`}
            title={appLang === 'bn' ? 'মার্ক এস রিড' : 'Mark as Read'}
          >
            <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          
          {/* Download Popover */}
          <AnimatePresence>
            {openDownloadId === video.id && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute bottom-[calc(100%+8px)] left-0 w-full rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border overflow-hidden z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className={`p-3 border-b ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <h4 className={`text-[11px] font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wider font-stylish-bn ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Video className="w-3.5 h-3.5"/> ভিডিও ফরম্যাট
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['1080p', '720p', '480p', '360p', '240p', '144p'].map(q => (
                      <button 
                        key={q}
                        onClick={() => {
                          localStorage.setItem('yt_default_download_type', 'video');
                          localStorage.setItem('yt_default_video_format', q);
                          window.dispatchEvent(new Event('yt_settings_changed'));
                          setOpenDownloadId(null);
                        }}
                        className={`text-xs py-1.5 font-semibold rounded border transition-colors cursor-pointer ${defaultDownloadType === 'video' && defaultVideoFormat === q ? 'bg-blue-600 text-white border-blue-600' : (isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border-blue-800' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100')}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className={`text-[11px] font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wider font-stylish-bn ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Headphones className="w-3.5 h-3.5"/> অডিও ফরম্যাট
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'audio_best', label: 'Best', shortLabel: 'Best' },
                      { id: 'mp3', label: 'MP3 128k', shortLabel: 'MP3 128k' },
                      { id: '64k', label: 'MP3 64k', shortLabel: 'MP3 64k' },
                      { id: '32k', label: 'MP3 32k', shortLabel: 'MP3 32k' },
                      { id: '16k', label: '16k (Small)', shortLabel: 'MP3 16k' },
                      { id: 'm4a', label: 'M4A', shortLabel: 'M4A' },
                      { id: 'wav', label: 'WAV', shortLabel: 'WAV' },
                      { id: 'opus', label: 'Opus HQ', shortLabel: 'Opus HQ' },
                      { id: 'audio', label: 'Opus 16kHz (16 bit, 1 channel)', shortLabel: 'Opus 16k' }
                    ].map(audio => (
                      <button 
                        key={audio.id}
                        onClick={() => {
                          localStorage.setItem('yt_default_download_type', 'audio');
                          localStorage.setItem('yt_default_audio_format', audio.id);
                          window.dispatchEvent(new Event('yt_settings_changed'));
                          setOpenDownloadId(null);
                        }}
                        className={`text-[10px] py-1.5 px-1 font-semibold rounded border text-center transition-colors cursor-pointer ${defaultDownloadType === 'audio' && defaultAudioFormat === audio.id ? 'bg-pink-600 text-white border-pink-600' : (isDark ? 'bg-pink-900/30 text-pink-400 hover:bg-pink-900/50 border-pink-800' : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-100')}`}
                      >
                        {audio.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {confirmModalConfig && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmModalConfig.onConfirm}
          onSecondaryAction={confirmModalConfig.onSecondaryAction}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          cancelText={confirmModalConfig.cancelText}
          secondaryText={confirmModalConfig.secondaryText}
          isDark={false} // Adjust based on context if available
          activeColors={{ primary: 'bg-indigo-600', hover: 'hover:bg-indigo-700' }}
        />
      )}
    </div>
  );
};
