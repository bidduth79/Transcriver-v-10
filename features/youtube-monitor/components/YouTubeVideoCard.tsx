import React from 'react';
import { YouTubeVideo } from '../../../types/youtube';
import { STORES, getFromStore, addToStore, getAllFromStore } from '../../../services/db';
import { getApiUrl } from '../../../services/api';
import { Play, Clock, Download, ChevronDown, Video, Headphones, Copy, CheckCircle2, X, Loader2, Bot, RefreshCw, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import Swal from 'sweetalert2';
import { copyToClipboard } from '../../../utils/clipboard';
import { YouTubeVideoCardThumbnail } from './YouTubeVideoCardThumbnail';
import { YouTubeVideoCardActions } from './YouTubeVideoCardActions';

// Expose Swal to window for inline onclick handlers in HTML strings
(window as any).Swal = Swal;

import { getRelativeTime } from '../utils/formatters';
import { showAlreadyDownloadedAlert } from '../utils/swalAlerts';

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
      showAlreadyDownloadedAlert(appLang, proceedDownload);
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
      <YouTubeVideoCardThumbnail
        video={video}
        appLang={appLang}
        isSelectMode={isSelectMode}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        onUpdateVideo={onUpdateVideo}
        addToast={addToast}
        isDark={isDark}
        isVisited={isVisited}
        isCompleted={isCompleted}
        isWaiting={isWaiting}
        isError={isError}
      />
      
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
        
        <YouTubeVideoCardActions
          video={video}
          appLang={appLang}
          openDownloadId={openDownloadId}
          setOpenDownloadId={setOpenDownloadId}
          addToast={addToast}
          onMarkAsRead={onMarkAsRead}
          onDownload={onDownload}
          onUpdateVideo={onUpdateVideo}
          onLoadTranscript={onLoadTranscript}
          onStartTranscription={onStartTranscription}
          isDark={isDark}
          isVisited={isVisited}
          isDownloading={isDownloading}
          isWaiting={isWaiting}
          isCompleted={isCompleted}
          isError={isError}
          isPending={isPending}
          hasTranscript={hasTranscript}
          currentFormatLabel={currentFormatLabel}
          defaultDownloadType={defaultDownloadType}
          defaultVideoFormat={defaultVideoFormat}
          defaultAudioFormat={defaultAudioFormat}
          handleDownloadClick={handleDownloadClick}
        />
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
