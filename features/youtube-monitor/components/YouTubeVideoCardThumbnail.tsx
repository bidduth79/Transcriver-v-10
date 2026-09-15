import React from 'react';
import { YouTubeVideo } from '../../../types/youtube';
import { Play, Clock, CheckCircle2, Loader2, RefreshCw, Copy } from 'lucide-react';

interface YouTubeVideoCardThumbnailProps {
  video: YouTubeVideo;
  appLang: 'en' | 'bn';
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onUpdateVideo: (id: string, updates: Partial<YouTubeVideo>) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  isDark?: boolean;
  isVisited: boolean;
  isCompleted: boolean;
  isWaiting: boolean;
  isError: boolean;
}

export const YouTubeVideoCardThumbnail: React.FC<YouTubeVideoCardThumbnailProps> = ({
  video,
  appLang,
  isSelectMode,
  isSelected,
  onToggleSelect,
  onUpdateVideo,
  addToast,
  isDark,
  isVisited,
  isCompleted,
  isWaiting,
  isError
}) => {
  return (
    <>
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
    </>
  );
};
