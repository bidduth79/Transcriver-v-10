import React from 'react';
import { Calendar } from 'lucide-react';
import { YouTubeVideo } from '../../../types/youtube';
import { YouTubeVideoCard } from './YouTubeVideoCard';

interface MonitorVideoSectionProps {
  groupedVideos: Record<string, YouTubeVideo[]>;
  title: string;
  icon: React.ReactNode;
  appLang: 'en' | 'bn';
  openDownloadId: string | null;
  setOpenDownloadId: (id: string | null) => void;
  formatTime: (dateString: string, appLang?: 'en' | 'bn') => string;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onMarkAsRead: (id: string) => void;
  onUpdateVideo: (id: string, updates: Partial<YouTubeVideo>) => void;
  isSelectMode: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onLoadTranscript?: (transcript: string, title: string, duration: string, historyId?: string, channelName?: string, date?: string, videoId?: string) => void;
  onStartTranscription?: (file: Blob, metadata: { name: string, duration: string, size?: string, type?: string, channelName?: string, date?: string }, isAutoProcess?: boolean) => Promise<string | undefined>;
  queueState: any;
  addVideoToQueue: (video: YouTubeVideo) => void;
  isDark?: boolean;
}

export const MonitorVideoSection: React.FC<MonitorVideoSectionProps> = ({
  groupedVideos,
  title,
  icon,
  appLang,
  openDownloadId,
  setOpenDownloadId,
  formatTime,
  addToast,
  onMarkAsRead,
  onUpdateVideo,
  isSelectMode,
  selectedIds,
  onToggleSelect,
  onLoadTranscript,
  onStartTranscription,
  queueState,
  addVideoToQueue,
  isDark = false
}) => {
  if (Object.keys(groupedVideos).length === 0) return null;

  return (
    <div className="space-y-6">
      <div className={`flex items-center gap-2 px-4 py-2 border rounded-xl shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {icon}
        <h2 className={`text-lg font-bold font-stylish-bn ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h2>
        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
          {Object.values(groupedVideos).flat().length}
        </span>
      </div>

      {Object.entries(groupedVideos).map(([date, videos]) => (
        <div key={date} className="space-y-4">
          <div className={`flex items-center gap-2 text-sm font-medium px-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(videos as YouTubeVideo[]).map((video, idx) => (
              <YouTubeVideoCard
                key={`${video.id}-${idx}`}
                video={video}
                appLang={appLang}
                openDownloadId={openDownloadId}
                setOpenDownloadId={setOpenDownloadId}
                formatTime={formatTime}
                addToast={addToast}
                onMarkAsRead={onMarkAsRead}
                onUpdateVideo={onUpdateVideo}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.includes(video.id)}
                onToggleSelect={() => onToggleSelect(video.id)}
                onLoadTranscript={onLoadTranscript}
                onStartTranscription={onStartTranscription}
                isDark={isDark}
                onDownload={(video) => {
                  const isAnyDownloading = queueState.queue.some((v: any) => v.status === 'downloading');
                  const initialStatus = (isAnyDownloading ? 'waiting' : 'downloading') as 'waiting' | 'downloading';
                  
                  const isCompleted = video.status === 'completed' || video.status === 'downloaded';
                  const existingInQueue = queueState.queue.find((v: any) => v.id === video.id);
                  
                  if (existingInQueue && !isCompleted) {
                    onUpdateVideo(video.id, { status: initialStatus, format: video.format, progress: 0 });
                  } else {
                    let newTitle = video.title;
                    if (isCompleted) {
                       const count = queueState.history.filter((v: any) => v.videoId === video.videoId).length;
                       if (count > 0) {
                          const baseTitle = video.title.replace(/ \d+$/, '');
                          newTitle = `${baseTitle} ${count}`;
                       }
                    }
                    
                    const newVideo = { 
                      ...video, 
                      id: isCompleted ? Date.now().toString() + Math.random().toString(36).substr(2, 9) : video.id,
                      title: newTitle,
                      status: initialStatus, 
                      progress: 0 
                    };
                    addVideoToQueue(newVideo);
                  }
                  addToast(appLang === 'bn' ? (isAnyDownloading ? 'কিউতে যোগ করা হয়েছে (অপেক্ষমান)' : 'ডাউনলোড শুরু হচ্ছে') : (isAnyDownloading ? 'Added to queue (Waiting)' : 'Starting download'), 'success');
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
