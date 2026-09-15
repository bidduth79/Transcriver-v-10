import React from 'react';
import { TimeSelector } from './TimeControls';
import { useCutMediaTool } from './hooks/useCutMediaTool';

export const CutMediaTool = ({ isDark, activeColors, appLang, addToast, currentTab, onFileSelect, setIsMinimized }: any) => {
    const {
        cutMode, setCutMode,
        splitCount, setSplitCount,
        splitResults,
        cutFile,
        previewUrl,
        startTime, setStartTime,
        endTime, setEndTime,
        isProcessing, processingStatus,
        cutFileInputRef, mediaRef,
        isLoaded, loadProgress, loadError, load,
        handleCutFileChange, clearCutFile, handleResetTime,
        handleMetadataLoaded, handleDownloadSuccess, handleTranscribePart,
        processCut
    } = useCutMediaTool({ addToast, appLang, onFileSelect, setIsMinimized });

    const renderProcessingState = (status: string) => (
        <div className="w-full flex flex-col gap-3 animate-in fade-in zoom-in duration-300">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative shadow-inner border border-slate-200 dark:border-slate-700">
                <div 
                    className={`h-full ${activeColors.primary} transition-all duration-300 relative w-full`}
                >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-800'} drop-shadow-md`}>
                        {status}
                    </span>
                </div>
            </div>
            <p className="text-center text-[9px] opacity-50 font-bold uppercase animate-pulse">
                {appLang === 'bn' ? 'দয়া করে অপেক্ষা করুন, ব্রাউজারে কাজ চলছে...' : 'Please wait, processing in browser...'}
            </p>
        </div>
    );

    return (
        <div className="space-y-8">
            <input type="file" ref={cutFileInputRef} onChange={handleCutFileChange} className="hidden" accept={currentTab === 'video_cut' ? 'video/*' : 'audio/*'} />
            
            <div 
            onClick={() => cutFileInputRef.current?.click()}
            className={`border-2 border-dashed relative ${cutFile ? 'border-green-500 bg-green-500/10' : 'border-current opacity-30 hover:opacity-50'} rounded-2xl ${cutFile ? 'h-auto py-6' : 'h-32'} flex flex-col items-center justify-center cursor-pointer transition-all`}
            >
                {cutFile ? (
                    <div className="w-full px-6 flex flex-col items-center relative">
                        <button 
                            onClick={clearCutFile}
                            className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-10"
                            title="Clear File"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>

                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2 text-white shadow-lg animate-bounce">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2">Selected: {cutFile.name}</span>
                        <span className="text-[10px] font-bold opacity-60 mb-4">{(cutFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        {previewUrl && (
                            <div className="w-full max-w-lg bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                                {currentTab === 'video_cut' ? (
                                    <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={previewUrl} controls onLoadedMetadata={handleMetadataLoaded} className="w-full max-h-[300px] mx-auto" />
                                ) : (
                                    <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={previewUrl} controls onLoadedMetadata={handleMetadataLoaded} className="w-full mt-4 mb-2 px-4" />
                                )}
                            </div>
                        )}
                        <p className="text-[10px] mt-4 opacity-40 uppercase">Click to change file</p>
                    </div>
                ) : (
                    <span className="text-xs font-black uppercase tracking-widest">
                        {appLang === 'bn' ? 'ফাইল সিলেক্ট করুন' : 'Click to Upload File'}
                    </span>
                )}
            </div>
            
            {cutFile && (
                <div className="flex justify-center gap-4">
                    <button onClick={() => setCutMode('manual')} className={`px-6 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${cutMode === 'manual' ? `${activeColors.border} ${activeColors.text} bg-white/10` : 'border-transparent opacity-50 hover:opacity-100'}`}>{appLang === 'bn' ? 'ম্যানুয়াল ট্রিম' : 'MANUAL TRIM'}</button>
                    <button onClick={() => setCutMode('split')} className={`px-6 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${cutMode === 'split' ? `${activeColors.border} ${activeColors.text} bg-white/10` : 'border-transparent opacity-50 hover:opacity-100'}`}>{appLang === 'bn' ? 'অটো স্প্লিট' : 'AUTO SPLIT'}</button>
                </div>
            )}

            {cutMode === 'manual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative animate-in fade-in slide-in-from-top-2">
                    <TimeSelector label="START TIME" timeStr={startTime} onChange={setStartTime} isDark={isDark} activeColors={activeColors} />
                    <TimeSelector label="END TIME" timeStr={endTime} onChange={setEndTime} isDark={isDark} activeColors={activeColors} />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
                    <button onClick={handleResetTime} className="w-10 h-10 rounded-full bg-slate-200 hover:bg-red-500 text-slate-500 hover:text-white flex items-center justify-center shadow-lg transition-all active:scale-95 border-4 border-white dark:border-slate-800"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                    </div>
                </div>
            )}

            {cutMode === 'split' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-center gap-4">
                        {[2, 3, 4].map(num => (
                            <button key={num} onClick={() => setSplitCount(num)} className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${splitCount === num ? `${activeColors.border} ${activeColors.text} bg-slate-200 dark:bg-slate-700 scale-110 shadow-lg` : 'border-transparent bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                <span className="text-xl font-black">{num}</span>
                                <span className="text-[9px] font-bold uppercase">Parts</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-[10px] opacity-60 uppercase font-bold tracking-widest">{appLang === 'bn' ? `ফাইলটিকে সমান ${splitCount} ভাগে ভাগ করা হবে` : `Split file into ${splitCount} equal parts`}</p>
                </div>
            )}

            {splitResults.length > 0 && (
                <div className="space-y-3 bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 pl-2">Generated Parts</p>
                    {splitResults.map((part, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-6 h-6 rounded-full ${activeColors.primary} flex items-center justify-center text-white text-[10px] font-bold`}>{idx + 1}</div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{part.name}</span>
                                    <span className="text-[9px] opacity-50">{(part.blob.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleDownloadSuccess(part.blob, part.name)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:hover:text-white rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg></button>
                                <button onClick={() => handleTranscribePart(part)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 dark:hover:text-emerald-400 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isProcessing && renderProcessingState(processingStatus || (appLang === 'bn' ? 'প্রসেসিং চলছে...' : 'PROCESSING...'))}
            
            <button 
                onClick={processCut}
                disabled={isProcessing || !!loadError}
                className={`w-full py-4 ${loadError ? 'bg-red-500' : activeColors.primary} text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer`}
            >
                <span>{loadError ? (appLang === 'bn' ? 'ইঞ্জিন লোড ব্যর্থ' : 'ENGINE LOAD FAILED') : (!isLoaded ? (appLang === 'bn' ? 'ইঞ্জিন লোড হচ্ছে...' : 'LOADING ENGINE...') : (appLang === 'bn' ? 'প্রসেস শুরু করুন' : 'START PROCESS'))}</span>
            </button>

            {/* Floating Progress Toast for FFmpeg Download */}
            {!isLoaded && loadProgress > 0 && !loadError && (
                <div className={`fixed top-20 right-6 z-[300] w-80 p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-5 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        <span>{appLang === 'bn' ? 'ইঞ্জিন ডাউনলোড হচ্ছে...' : 'Downloading Engine...'}</span>
                        <span>{loadProgress}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div 
                            className={`h-full ${activeColors.primary} transition-all duration-300`}
                            style={{ width: `${loadProgress}%` }}
                        ></div>
                    </div>
                    <p className={`text-[9px] text-center mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {appLang === 'bn' ? 'এটি শুধু প্রথমবার ডাউনলোড হবে।' : 'This downloads only once.'}
                    </p>
                </div>
            )}

            {loadError && (
                <div className={`fixed top-20 right-6 z-[300] w-80 p-4 rounded-2xl shadow-2xl border border-red-500/50 bg-red-500/10 animate-in slide-in-from-top-5`}>
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{appLang === 'bn' ? 'ইঞ্জিন লোড ব্যর্থ' : 'Engine Load Failed'}</span>
                    </div>
                    <p className="text-[10px] text-red-600/80">{loadError}</p>
                    <button onClick={() => load()} className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all w-full">
                        {appLang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
                    </button>
                </div>
            )}
        </div>
    );
};
