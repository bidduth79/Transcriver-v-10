
import React from 'react';
import { useYouTubeInput } from './hooks/useYouTubeInput';

interface YouTubeInputProps {
  onSuccess: (blob: Blob, fileName: string, mode: 'download' | 'transcribe') => void;
  isDark: boolean;
  activeColors: any;
  appLang: string;
  platform?: 'youtube' | 'facebook';
  onFolderOpen?: () => void;
  allowVideo?: boolean;
  showFormats?: boolean; // New prop to control visibility of dropdown
}

export const YouTubeInput: React.FC<YouTubeInputProps> = ({ 
  onSuccess, isDark, activeColors, appLang, platform = 'youtube', 
  onFolderOpen, allowVideo = false, showFormats = true 
}) => {
  const {
    url,
    setUrl,
    loading,
    loadingMode,
    error,
    elapsedSeconds,
    totalTimeTaken,
    quality,
    setQuality,
    handleCancel,
    processYouTube,
    formatTime
  } = useYouTubeInput(appLang, onSuccess, showFormats);

  const placeholderText = platform === 'facebook' 
    ? (appLang === 'bn' ? 'ফেসবুক লিংক পেস্ট করুন' : 'Paste Facebook Link')
    : (appLang === 'bn' ? 'ইউটিউব লিংক পেস্ট করুন' : 'Paste YouTube Link');

  return (
    <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50 border border-slate-100'}`}>
      <div className="relative mb-3 flex flex-col gap-3">
        <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className={`w-4 h-4 ${platform === 'facebook' ? 'text-blue-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 24 24">
                {platform === 'facebook' 
                    ? <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    : <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                }
            </svg>
            </div>
            <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholderText}
            disabled={loading}
            className={`w-full pl-10 pr-12 py-3 rounded-xl text-xs font-bold border outline-none focus:ring-2 focus:ring-opacity-20 transition-all ${platform === 'facebook' ? 'focus:ring-blue-500' : 'focus:ring-red-500'} ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {loading && (
                <button 
                    onClick={handleCancel}
                    className="absolute right-1 top-1.5 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-all z-10 cursor-pointer"
                    title={appLang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2">
            {showFormats && (
                <select 
                    value={quality} 
                    onChange={(e) => setQuality(e.target.value)}
                    disabled={loading}
                    className={`w-28 px-3 py-3 rounded-xl text-xs font-bold outline-none border appearance-none cursor-pointer focus:ring-2 transition-all ${
                        isDark 
                        ? 'bg-slate-900 border-slate-700 text-white focus:ring-slate-500 [&>option]:bg-slate-800 [&>option]:text-white' 
                        : 'bg-white border-slate-200 text-slate-800 focus:ring-indigo-300'
                    }`}
                >
                    <optgroup label="Audio Only">
                        <option value="audio">Opus 16kHz (16 bit, 1 channel)</option>
                        <option value="audio_best">Best Audio</option>
                        <option value="mp3">MP3 128k</option>
                        <option value="64k">MP3 64k</option>
                        <option value="32k">MP3 32k</option>
                        <option value="16k">MP3 16k (Smallest)</option>
                        <option value="m4a">M4A</option>
                        <option value="wav">WAV</option>
                        <option value="opus">Opus HQ</option>
                    </optgroup>
                    {allowVideo && (
                        <optgroup label="Video Quality">
                            <option value="best">Best Available</option>
                            <option value="1080">1080p FHD</option>
                            <option value="720">720p HD</option>
                            <option value="480">480p SD</option>
                            <option value="360">360p Low</option>
                            <option value="240">240p Mobile</option>
                        </optgroup>
                    )}
                </select>
            )}

            {/* Download Only Button */}
            <button 
                onClick={() => processYouTube('download')}
                disabled={loading || !url}
                className={`flex-1 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer group`}
            >
                {loading && loadingMode === 'download' ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-4 h-4 transition-transform group-hover:scale-125 group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                )}
                <span className="hidden sm:inline">{appLang === 'bn' ? 'শুধু ডাউনলোড' : 'DL ONLY'}</span>
            </button>

            {/* Transcribe Button */}
            <button 
                onClick={() => processYouTube('transcribe')}
                disabled={loading || !url}
                className={`flex-1 py-3 ${platform === 'facebook' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer group`}
            >
                {loading && loadingMode === 'transcribe' ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-4 h-4 transition-transform group-hover:scale-125 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
                <span>{appLang === 'bn' ? 'ট্রান্সক্রাইব' : 'TRANSCRIBE'}</span>
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
           <p className="text-[10px] text-red-500 font-bold break-words leading-relaxed whitespace-pre-wrap">{error}</p>
        </div>
      )}
      
      {/* Time Display */}
      {(loading || totalTimeTaken) && (
        <div className="mt-4 flex justify-center animate-in fade-in bg-slate-100 rounded-lg py-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
           <span className={`text-[10px] font-black uppercase tracking-widest ${loading ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
              {loading 
                 ? `${appLang === 'bn' ? 'সময় অতিবাহিত' : 'Time Elapsed'}: ${formatTime(elapsedSeconds)}` 
                 : `${appLang === 'bn' ? 'মোট সময় লেগেছে' : 'Total Time'}: ${totalTimeTaken}`
              }
           </span>
        </div>
      )}

      {!loading && !totalTimeTaken && (
        <p className="text-[9px] text-center mt-2 opacity-40 font-bold uppercase tracking-wide">
          D:/audio • HIGH SPEED
        </p>
      )}
    </div>
  );
};
