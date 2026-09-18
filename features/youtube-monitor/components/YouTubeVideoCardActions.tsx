import React from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { YouTubeVideo } from '../../../types/youtube';
import { Download, ChevronDown, Video, Headphones, Copy, CheckCircle2, Bot, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoCardActions } from '../hooks/useVideoCardActions';

interface YouTubeVideoCardActionsProps {
  video: YouTubeVideo;
  appLang: 'en' | 'bn';
  openDownloadId: string | null;
  setOpenDownloadId: (id: string | null) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onMarkAsRead: (id: string) => void;
  onDownload: (video: YouTubeVideo) => void;
  onUpdateVideo: (id: string, updates: Partial<YouTubeVideo>) => void;
  onLoadTranscript?: (transcript: string, title: string, duration: string, historyId?: string, channelName?: string, date?: string, videoId?: string) => void;
  onStartTranscription?: (file: Blob, metadata: { name: string, duration: string, size?: string, type?: string, channelName?: string, date?: string }, isAutoProcess?: boolean) => Promise<string | undefined>;
  isDark?: boolean;
  isVisited: boolean;
  isDownloading: boolean;
  isWaiting: boolean;
  isCompleted: boolean;
  isError: boolean;
  isPending: boolean;
  hasTranscript: boolean;
  currentFormatLabel: string;
  defaultDownloadType: string;
  defaultVideoFormat: string;
  defaultAudioFormat: string;
  handleDownloadClick: () => void;
}

export const YouTubeVideoCardActions: React.FC<YouTubeVideoCardActionsProps> = ({
  video,
  appLang,
  openDownloadId,
  setOpenDownloadId,
  addToast,
  onMarkAsRead,
  onUpdateVideo,
  onLoadTranscript,
  onStartTranscription,
  isDark,
  isVisited,
  isDownloading,
  isWaiting,
  isCompleted,
  isError,
  hasTranscript,
  currentFormatLabel,
  defaultDownloadType,
  defaultVideoFormat,
  defaultAudioFormat,
  handleDownloadClick
}) => {
  const { handleCopyLink, handleTranscriptionClick } = useVideoCardActions({
    video,
    appLang,
    addToast,
    onUpdateVideo,
    onLoadTranscript,
    onStartTranscription
  });

  return (
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
        onClick={handleCopyLink}
        className={`p-2.5 flex items-center justify-center border rounded-lg transition-colors cursor-pointer group ${isDark ? 'text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-gray-200 border-gray-700' : 'text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 border-gray-200'}`}
        title={appLang === 'bn' ? 'লিংক কপি করুন' : 'Copy Link'}
      >
        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>

      {isCompleted && (onLoadTranscript || onStartTranscription) && (
        <button
          onClick={handleTranscriptionClick}
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
                      useAppStore.getState().triggerYtSettingsChanged();
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
                      useAppStore.getState().triggerYtSettingsChanged();
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
  );
};
