import React from 'react';
import { YouTubeInput } from '../tools/YouTubeInput.tsx';

export const AudioVideoInput = ({
  t,
  isRecording,
  activeColors,
  getHeaderTitle,
  cardBg,
  cardBorder,
  activeTab,
  setActiveTab,
  fileInputRef,
  onStartRecording,
  handleFileChange,
  handleYouTubeSuccess,
  isDark,
  appLang,
  recordingTime,
  onStopRecording,
  formatTime
}: any) => {
  return (
    <div className="px-6 pt-6 shrink-0 mt-8 md:mt-0">
      <div className="flex items-center gap-3 bg-slate-950 px-5 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.4)] border border-white/10 mb-4 h-[52px]">
        <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : (activeColors?.primary || 'bg-indigo-600')} shadow-[0_0_12px_rgba(255,255,255,0.4)] shrink-0`}></div>
        <span className="text-[12px] font-black uppercase tracking-[0.15em] text-white truncate">
          {getHeaderTitle()}
        </span>
      </div>
      
      <div className={`${cardBg} p-1 rounded-3xl border ${cardBorder} shadow-[0_25px_50px_rgba(0,0,0,0.2)] overflow-hidden transition-all hover:translate-y-[-2px]`}>
        
        {!isRecording ? (
          <div className={`rounded-2xl p-4 flex flex-col gap-4 transition-all duration-300`}>
            
            {/* Input Type Selector Icons */}
            <div className="flex justify-center gap-3 mb-2">
                <button 
                  onClick={() => { setActiveTab('upload'); fileInputRef.current?.click(); }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group cursor-pointer ${activeTab === 'upload' ? activeColors.primary + ' text-white ring-2 ring-offset-2 ring-indigo-200' : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-white hover:bg-slate-50 text-slate-400')}`}
                  title="Upload File"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                </button>

                <button 
                  onClick={() => { setActiveTab('folder'); document.getElementById('folderInput')?.click(); }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group cursor-pointer ${activeTab === 'folder' ? 'bg-emerald-600 text-white ring-2 ring-offset-2 ring-emerald-200' : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-white hover:bg-slate-50 text-slate-400')}`}
                  title={appLang === 'bn' ? 'একাধিক ফাইল আপলোড' : 'Multiple File Upload'}
                >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                </button>
                
                <button 
                  onClick={() => { setActiveTab('record'); onStartRecording(); }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group cursor-pointer ${activeTab === 'record' ? 'bg-red-500 text-white ring-2 ring-offset-2 ring-red-200' : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-white hover:bg-slate-50 text-slate-400')}`}
                  title="Record Audio"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>

                <button 
                  onClick={() => setActiveTab('youtube')}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group cursor-pointer ${activeTab === 'youtube' ? 'bg-red-600 text-white ring-2 ring-offset-2 ring-red-200' : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-white hover:bg-slate-50 text-slate-400')}`}
                  title="YouTube Link"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </button>

                <button 
                  onClick={() => setActiveTab('facebook')}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group cursor-pointer ${activeTab === 'facebook' ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-200' : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-white hover:bg-slate-50 text-slate-400')}`}
                  title="Facebook Link"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>
            </div>

            {/* Hidden Input for File Upload */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/*,video/*,.opus" />
            <input 
              type="file" 
              id="folderInput" 
              onChange={handleFileChange} 
              className="hidden" 
              multiple
              accept="audio/*,video/*,.opus"
            />

            {/* Contextual Area based on Selection */}
            {activeTab === 'upload' && (
                <p className="text-[10px] text-center font-bold opacity-40 uppercase tracking-widest">{t.clickToUpload} (MP3, WAV, MP4, OPUS)</p>
            )}
            
            {activeTab === 'folder' && (
                <p className="text-[10px] text-center font-bold opacity-40 uppercase tracking-widest">{appLang === 'bn' ? 'একাধিক ফাইল আপলোড করতে ক্লিক করুন (MP3, WAV, MP4, OPUS)' : 'Click to upload multiple files (MP3, WAV, MP4, OPUS)'}</p>
            )}

            {(activeTab === 'youtube' || activeTab === 'facebook') && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <YouTubeInput 
                        onSuccess={handleYouTubeSuccess}
                        isDark={isDark}
                        activeColors={activeColors}
                        appLang={appLang}
                        platform={activeTab}
                        onFolderOpen={() => fileInputRef.current?.click()}
                        showFormats={true} 
                    />
                </div>
            )}

          </div>
        ) : (
          // Active Recording Mode
          <div className={`border-[4px] border-dashed border-red-500/30 bg-red-500/5 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300`}>
             <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-red-500 animate-ping absolute inset-0 opacity-20"></div>
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/40 relative z-10">
                   <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </div>
             </div>
             <div className="text-3xl font-black text-red-500 tabular-nums tracking-tight mb-6">
                {formatTime(recordingTime)}
             </div>
             <button 
               onClick={onStopRecording}
               className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center gap-2"
             >
               <div className="w-2 h-2 bg-white rounded-sm"></div>
               {appLang === 'bn' ? "বন্ধ করুন" : "STOP"}
             </button>
          </div>
        )}

      </div>
    </div>
  );
};
