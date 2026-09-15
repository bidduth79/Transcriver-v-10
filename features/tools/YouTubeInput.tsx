
import { getApiUrl } from '../../services/api';
import { useYouTubeInput } from './hooks/useYouTubeInput';

interface YouTubeInputProps {
  onSuccess: (blob: Blob, fileName: string, mode: 'download' | 'transcribe') => void;
  isDark: boolean;
  activeColors: any;
  appLang: string;
  onFolderOpen?: () => void;
  allowVideo?: boolean;
  showFormats?: boolean; 
  platform?: string;
}

export const YouTubeInput: React.FC<YouTubeInputProps> = ({ 
  onSuccess, isDark, activeColors, appLang,
  onFolderOpen, allowVideo = false, showFormats = true 
}) => {
  const {
    url, setUrl,
    downloadMode, setDownloadMode,
    mediaType, setMediaType,
    bitrate, setBitrate,
    channels, setChannels,
    samplerate, setSamplerate,
    startTime, setStartTime,
    endTime, setEndTime,
    bulkUrls, setBulkUrls,
    bulkQueue, setBulkQueue,
    loading, loadingMode, error,
    elapsedSeconds, totalTimeTaken,
    quality, setQuality,
    handleCancel, processYouTube, formatTime,
    activeItemIndex, activeItemStartTime
  } = useYouTubeInput(appLang, onSuccess, showFormats);

  const detectedPlatform = (downloadMode === 'single' ? url : bulkUrls).includes('facebook.com') || (downloadMode === 'single' ? url : bulkUrls).includes('fb.watch') ? 'facebook' : 'youtube';
  const effectivePlatform = detectedPlatform;

  const placeholderText = appLang === 'bn' 
    ? 'ইউটিউব বা ফেসবুক লিংক পেস্ট করুন' 
    : 'Paste YouTube or Facebook Link';

  const handleItemClick = async () => {
    try {
      const apiUrl = '/api/open-folder';
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: localStorage.getItem('customDownloadPath') || 'downloads' })
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50 border border-slate-100'}`}>
      
      {/* Top Bar: Modes & Folder */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 justify-between items-center">
         <div className="flex flex-wrap gap-3 w-full sm:w-auto">
             <div className="flex bg-slate-200 dark:bg-slate-900 rounded-lg p-1 w-full sm:w-auto">
                <button onClick={() => setDownloadMode('single')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${downloadMode === 'single' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Single</button>
                <button onClick={() => setDownloadMode('bulk')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${downloadMode === 'bulk' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Bulk Queue</button>
             </div>
             {allowVideo && (
             <div className="flex bg-slate-200 dark:bg-slate-900 rounded-lg p-1 w-full sm:w-auto">
                <button onClick={() => setMediaType('audio')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mediaType === 'audio' ? 'bg-white dark:bg-slate-700 shadow text-red-500 dark:text-red-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Audio</button>
                <button onClick={() => setMediaType('video')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mediaType === 'video' ? 'bg-white dark:bg-slate-700 shadow text-red-500 dark:text-red-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Video</button>
             </div>
             )}
         </div>
         <button
            onClick={handleItemClick}
            title={appLang === 'bn' ? 'ডাউনলোড ফোল্ডার খুলুন' : 'Open Download Folder'}
            className={`p-2 rounded-lg transition-all flex items-center gap-2 font-bold text-xs ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
         >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {appLang === 'bn' ? 'ফোল্ডার' : 'Folder'}
         </button>
      </div>

      <div className="relative mb-3 flex flex-col gap-3">
        
        {/* Main Input */}
        {downloadMode === 'single' ? (
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-4 h-4 ${effectivePlatform === 'facebook' ? 'text-blue-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 24 24">
                    {effectivePlatform === 'facebook' 
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
                className={`w-full pl-10 pr-12 py-3 rounded-xl text-xs font-bold border outline-none focus:ring-2 focus:ring-opacity-20 transition-all ${effectivePlatform === 'facebook' ? 'focus:ring-blue-500' : 'focus:ring-red-500'} ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
            </div>
        ) : (
            <textarea 
                value={bulkUrls}
                onChange={e => setBulkUrls(e.target.value)}
                placeholder={appLang === 'bn' ? 'একাধিক লিংক পেস্ট করুন (প্রতি লাইনে একটি)...' : 'Paste multiple URLs (one per line)...'}
                disabled={loading}
                rows={4}
                className={`w-full p-3 rounded-xl text-xs font-bold border outline-none focus:ring-2 focus:ring-opacity-20 transition-all resize-y custom-scrollbar ${effectivePlatform === 'facebook' ? 'focus:ring-blue-500' : 'focus:ring-red-500'} ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
        )}
        
        {/* Advanced Options Grid */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${isDark ? '[&>select]:bg-slate-900 [&>select]:border-slate-700 [&>select]:text-white' : '[&>select]:bg-white [&>select]:border-slate-200 [&>select]:text-slate-800'}`}>
            <select value={quality} onChange={(e) => setQuality(e.target.value)} disabled={loading} className="w-full px-2 py-2 rounded-lg text-xs font-bold border outline-none">
                {mediaType === 'audio' ? (
                    <>
                        <option value="audio">Opus (Smallest)</option>
                        <option value="audio_best">Best Audio</option>
                        <option value="m4a">M4A</option>
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                    </>
                ) : (
                    <>
                        <option value="best">Best Available</option>
                        <option value="1080">1080p FHD</option>
                        <option value="720">720p HD</option>
                        <option value="480">480p SD</option>
                        <option value="360">360p Low</option>
                        <option value="240">240p Mobile</option>
                    </>
                )}
            </select>
            
            {mediaType === 'audio' ? (
                <>
                    <select value={bitrate} onChange={e => setBitrate(e.target.value)} disabled={loading} className="w-full px-2 py-2 rounded-lg text-xs font-bold border outline-none">
                        <option value="16">16 kbps</option>
                        <option value="24">24 kbps</option>
                        <option value="32">32 kbps</option>
                        <option value="48">48 kbps</option>
                        <option value="64">64 kbps</option>
                        <option value="96">96 kbps</option>
                        <option value="128">128 kbps</option>
                    </select>
                    <select value={channels} onChange={e => setChannels(e.target.value)} disabled={loading} className="w-full px-2 py-2 rounded-lg text-xs font-bold border outline-none">
                        <option value="1">Mono (1)</option>
                        <option value="2">Stereo (2)</option>
                    </select>
                    <select value={samplerate} onChange={e => setSamplerate(e.target.value)} disabled={loading} className="w-full px-2 py-2 rounded-lg text-xs font-bold border outline-none">
                        <option value="16000">16 kHz (Speech)</option>
                        <option value="22050">22.05 kHz</option>
                        <option value="44100">44.1 kHz (Music)</option>
                    </select>
                </>
            ) : (
                <>
                    <input type="text" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={loading} placeholder="Start (e.g. 00:01:30)" className={`w-full px-2 py-2 rounded-lg text-xs font-bold border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} />
                    <input type="text" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={loading} placeholder="End (e.g. 00:05:00)" className={`w-full px-2 py-2 rounded-lg text-xs font-bold border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} />
                </>
            )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2">
            <button 
                onClick={() => processYouTube('download')}
                disabled={loading || (downloadMode === 'single' ? !url : !bulkUrls)}
                className={`flex-1 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer group`}
            >
                {loading && loadingMode === 'download' ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-4 h-4 transition-transform group-hover:scale-125 group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                )}
                <span>{appLang === 'bn' ? 'ডাউনলোড' : 'DOWNLOAD'}</span>
            </button>

            {mediaType === 'audio' && (
            <button 
                onClick={() => processYouTube('transcribe')}
                disabled={loading || (downloadMode === 'single' ? !url : !bulkUrls)}
                className={`flex-1 py-3 ${effectivePlatform === 'facebook' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer group`}
            >
                {loading && loadingMode === 'transcribe' ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-4 h-4 transition-transform group-hover:scale-125 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
                <span>{appLang === 'bn' ? 'ট্রান্সক্রাইব' : 'TRANSCRIBE'}</span>
            </button>
            )}
            
            {loading && (
                <button 
                    onClick={handleCancel}
                    className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                    title={appLang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
        </div>
      </div>
      
      {/* Bulk Queue Display */}
      {downloadMode === 'bulk' && bulkQueue.length > 0 && (
          <div className={`mt-4 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 flex justify-between">
                  <span>Queue Status</span>
                  <span onClick={() => setBulkQueue([])} className="cursor-pointer hover:text-red-500 transition-colors">Clear</span>
              </div>
              <div className="space-y-2">
                  {bulkQueue.map((item, i) => (
                      <div key={i} className={`text-xs p-2 rounded border flex flex-col gap-1 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                          <div className="flex items-center gap-2">
                             {item.status === 'pending' && <span className="w-2 h-2 rounded-full bg-slate-400"></span>}
                             {item.status === 'downloading' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
                             {item.status === 'success' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                             {item.status === 'failed' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                             
                             <span className="truncate opacity-70 font-mono text-[10px] flex-1">
                                {item.url}
                                {item.status === 'downloading' && (
                                   <span className="ml-2 text-blue-500 font-bold">
                                      {appLang === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Downloading...'}
                                   </span>
                                )}
                             </span>
                             
                             {(item.timeTaken || (i === activeItemIndex && activeItemStartTime)) && (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : (item.status === 'downloading' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500')}`}>
                                    {item.timeTaken || formatTime(Math.round((Date.now() - activeItemStartTime!) / 1000))}
                                </span>
                             )}
                          </div>
                          {item.status === 'success' && (
                              <div className="text-[10px] text-emerald-500 pl-4 flex items-center justify-between">
                                  <span className="truncate pr-2">{item.filename}</span>
                                  <button 
                                      onClick={handleItemClick}
                                      className="p-1.5 hover:bg-emerald-500/10 rounded transition-colors flex items-center gap-1 shrink-0"
                                      title={appLang === 'bn' ? 'ফোল্ডার ওপেন করুন' : 'Open Folder'}
                                  >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg>
                                      <span className="uppercase font-bold text-[9px]">{appLang === 'bn' ? 'ফোল্ডার' : 'Folder'}</span>
                                  </button>
                              </div>
                          )}
                          {item.status === 'failed' && <div className="text-[10px] text-red-500 pl-4">{item.error}</div>}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3 mt-3">
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
    </div>
  );
};
