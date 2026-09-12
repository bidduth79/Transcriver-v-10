import React from 'react';
import { YouTubeVideo } from '../../../types/youtube';
import { Play, Pause, Square, Trash2, X, DownloadCloud, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { copyToClipboard } from '../../../utils/clipboard';

interface YouTubeDownloadQueueProps {
  queue: YouTubeVideo[];
  appLang: 'en' | 'bn';
  onPause: (id: string) => void;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onUpdateVideo: (id: string, updates: Partial<YouTubeVideo>) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  isDark?: boolean;
}

export const YouTubeDownloadQueue: React.FC<YouTubeDownloadQueueProps> = ({
  queue,
  appLang,
  onPause,
  onStart,
  onStop,
  onRetry,
  onDelete,
  onClear,
  onUpdateVideo,
  addToast,
  isDark = false
}) => {
  const downloadingVideos = queue.filter(v => v.status !== 'downloaded');

  if (downloadingVideos.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl shadow-sm border mb-6 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'}`}
    >
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'}`}>
        <div className={`flex items-center gap-2 font-semibold font-stylish-bn ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
          <DownloadCloud className="w-5 h-5" />
          <span>{appLang === 'bn' ? 'ডাউনলোড কিউ' : 'Download Queue'} ({downloadingVideos.length})</span>
        </div>
        <button 
          onClick={onClear}
          className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer ${isDark ? 'text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40' : 'text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100'}`}
        >
          {appLang === 'bn' ? 'সম্পন্নগুলো ক্লিয়ার করুন' : 'Clear Completed'}
        </button>
      </div>
      
      <div className="max-h-64 overflow-y-auto p-2 space-y-2">
        <AnimatePresence>
          {downloadingVideos.map((video, idx) => (
            <motion.div 
              key={`${video.id}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={`flex items-center gap-4 p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
            >
              <img src={video.thumbnailUrl} alt={video.title} className="w-16 h-10 object-cover rounded" />
              
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`} title={video.title}>{video.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs truncate max-w-[120px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{video.channelTitle}</span>
                  {video.format && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                      {video.format.label}
                    </span>
                  )}
                  {video.duration && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                      {video.duration}
                    </span>
                  )}
                  <span className={`text-xs font-semibold ml-auto ${
                    video.status === 'completed' ? (isDark ? 'text-green-400' : 'text-green-600') :
                    video.status === 'error' ? (isDark ? 'text-red-400' : 'text-red-600') :
                    video.status === 'failed' ? (isDark ? 'text-red-500' : 'text-red-700') :
                    video.status === 'transcribing' ? (isDark ? 'text-indigo-400' : 'text-indigo-600') :
                    video.status === 'waiting' ? (isDark ? 'text-yellow-400' : 'text-yellow-600') :
                    (isDark ? 'text-blue-400' : 'text-blue-600')
                  }`}>
                    {video.status === 'downloading' ? `${video.progress || 0}%` : 
                     video.status === 'completed' ? (appLang === 'bn' ? 'সম্পন্ন' : 'Completed') :
                     video.status === 'transcribing' ? (appLang === 'bn' ? 'ট্রান্সক্রাইবিং' : 'Transcribing') :
                     video.status === 'error' ? (appLang === 'bn' ? 'ত্রুটি' : 'Error') :
                     video.status === 'failed' ? (appLang === 'bn' ? 'ব্যর্থ' : 'Failed') :
                     video.status === 'waiting' ? (appLang === 'bn' ? 'অপেক্ষমান' : 'Waiting') :
                     (appLang === 'bn' ? 'প্রস্তুত' : 'Ready')}
                  </span>
                </div>
                {/* Progress bar */}
                <div className={`w-full rounded-full h-1.5 mt-1.5 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      video.status === 'downloading' ? 'bg-blue-500' : 
                      video.status === 'completed' ? 'bg-green-500' :
                      video.status === 'error' ? 'bg-red-500' :
                      video.status === 'failed' ? 'bg-red-700' :
                      video.status === 'transcribing' ? 'bg-indigo-500' :
                      video.status === 'waiting' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${video.status === 'completed' ? 100 : (video.progress || 0)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')} 
                  className={`p-1.5 rounded cursor-pointer group ${isDark ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`} 
                  title={appLang === 'bn' ? 'নতুন ট্যাবে খুলুন' : 'Open in New Tab'}
                >
                  <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
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
                  className={`p-1.5 rounded cursor-pointer group ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`} 
                  title={appLang === 'bn' ? 'লিংক কপি করুন' : 'Copy Link'}
                >
                  <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
                {(video.status === 'pending' || video.status === 'waiting' || video.status === 'downloading' || video.status === 'transcribing' || video.status === 'error' || video.status === 'failed') && (
                  <>
                    {(video.status === 'error' || video.status === 'failed') ? (
                      <button 
                        onClick={() => onRetry(video.id)} 
                        className={`p-1.5 rounded-lg transition-all cursor-pointer group ${isDark ? 'text-indigo-400 hover:bg-indigo-900/30' : 'text-indigo-600 hover:bg-indigo-50'}`} 
                        title={appLang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                    ) : video.status === 'downloading' || video.status === 'transcribing' ? (
                      <button onClick={() => onPause(video.id)} className={`p-1.5 rounded cursor-pointer group ${isDark ? 'text-amber-400 hover:bg-amber-900/30' : 'text-amber-600 hover:bg-amber-50'}`} title="Pause">
                        <Pause className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    ) : (
                      <button onClick={() => onStart(video.id)} className={`p-1.5 rounded cursor-pointer group ${isDark ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-50'}`} title="Start">
                        <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                    {(video.status !== 'error' && video.status !== 'failed') && (
                      <button onClick={() => onStop(video.id)} className={`p-1.5 rounded cursor-pointer group ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`} title="Stop">
                        <Square className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                    {(video.status === 'error' || video.status === 'downloading' || video.status === 'waiting' || video.status === 'pending') && (
                      <button 
                        onClick={() => onUpdateVideo(video.id, { status: 'failed', error: 'Skipped by user' })} 
                        className={`p-1.5 rounded cursor-pointer group ${isDark ? 'text-orange-400 hover:bg-orange-900/30' : 'text-orange-600 hover:bg-orange-50'}`} 
                        title={appLang === 'bn' ? 'এড়িয়ে যান' : 'Skip'}
                      >
                        <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                  </>
                )}
                <button onClick={() => onDelete(video.id)} className={`p-1.5 rounded cursor-pointer group ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`} title="Remove">
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
