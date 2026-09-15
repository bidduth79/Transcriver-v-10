import React from 'react';

export const FileInfoSection = ({
  fileUrl,
  isRecording,
  t,
  resetAll,
  cardBg,
  cardBorder,
  isDark,
  subTextColor,
  fileMeta,
  activeColors,
  audioRef,
  handleTimeUpdate,
  skipTime,
  playbackRate,
  changePlaybackRate,
  processTranscription,
  setIsSidebarOpen,
  status
}: any) => {
  if (!fileUrl || isRecording) return null;

  return (
    <div className="px-6 py-6 animate-in fade-in slide-in-from-top-2 shrink-0">
      <div className="flex items-center gap-3 bg-slate-950 px-5 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.4)] border border-white/10 mb-4 h-[52px]">
        <div className={`w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.4)] shrink-0 animate-pulse`}></div>
        <span className="text-[12px] font-black uppercase tracking-[0.15em] text-white truncate">{t.fileInfo}</span>
        <button onClick={resetAll} className="ml-auto text-red-400 hover:text-red-500 transition-all shrink-0 p-1 group cursor-pointer"><svg className="w-4 h-4 transition-transform group-hover:scale-150 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div className={`${cardBg} p-5 rounded-3xl border ${cardBorder} shadow-[0_25px_50px_rgba(0,0,0,0.2)] space-y-4 hover:translate-y-[-2px] transition-all`}>
        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} p-4 rounded-2xl border text-xs font-bold ${subTextColor} space-y-3`}>
          <div className="flex justify-between items-center gap-4">
            <span className="opacity-60 shrink-0">{t.nameLabel}</span> 
            <span className={`${isDark ? 'text-white' : 'text-slate-900'} truncate font-black ${isDark ? 'bg-slate-700' : 'bg-white/5'} px-2 py-1 rounded-lg flex-1 text-right`}>{fileMeta?.name}</span>
          </div>
          <div className="flex justify-between items-center"><span className="opacity-60">{t.sizeLabel}</span> <span className={isDark ? 'text-white' : 'text-slate-900'}>{fileMeta?.size}</span></div>
          <div className="flex justify-between items-center"><span className="opacity-60">{t.durationLabel}</span> <span className={`${isDark ? 'text-indigo-300' : (activeColors?.text || 'text-indigo-600')} font-black`}>{fileMeta?.duration}</span></div>
        </div>
        
        {/* Audio Player with Seek & Speed Control */}
        <div className="space-y-2">
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} src={fileUrl} controls className="w-full h-10 bg-slate-50 rounded-lg p-1" />
            
            <div className="flex items-center justify-between gap-2 px-1">
                {/* SEEK BUTTONS */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => skipTime(-5)} 
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer group ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        title="Rewind 5s"
                    >
                        <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12.5 8l-5 4 5 4M7.5 8l-5 4 5 4" /></svg>
                        -5s
                    </button>
                    <button 
                        onClick={() => skipTime(5)} 
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer group ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        title="Forward 5s"
                    >
                        +5s
                        <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.5 8l5 4-5 4M16.5 8l5 4-5 4" /></svg>
                    </button>
                </div>

                {/* SPEED CONTROL */}
                <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                    {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                        <button 
                            key={rate}
                            onClick={() => changePlaybackRate(rate)}
                            className={`px-1.5 py-1 rounded text-[9px] font-black transition-all cursor-pointer ${
                                playbackRate === rate 
                                ? (activeColors?.primary || 'bg-indigo-500') + ' text-white scale-110 shadow-sm' 
                                : (isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-200/50 hover:bg-slate-200 text-slate-500')
                            }`}
                        >
                            {rate}x
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <button onClick={() => { processTranscription(); setIsSidebarOpen(false); }} disabled={status === 'processing'} className={`w-full py-4 ${activeColors?.primary || 'bg-indigo-600'} text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95 group cursor-pointer disabled:cursor-not-allowed`}>
          {status === 'processing' ? t.processingTranscribe : <><svg className="w-4 h-4 transition-transform group-hover:rotate-12 group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{t.startTranscribe}</>}
        </button>
      </div>
    </div>
  );
};
