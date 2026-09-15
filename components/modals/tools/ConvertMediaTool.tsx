import React from 'react';
import { useConvertMediaTool } from './hooks/useConvertMediaTool';

export const ConvertMediaTool = ({ isDark, activeColors, appLang, addToast }: any) => {
    const {
        convertFile,
        targetFormat, setTargetFormat,
        audioBitrate, setAudioBitrate,
        videoQuality, setVideoQuality,
        convertedResult,
        isProcessing,
        convertFileInputRef,
        isLoaded, loadProgress, loadError, load,
        handleConverterFileChange,
        clearConverterFile,
        handleDownloadSuccess,
        processConvert
    } = useConvertMediaTool(appLang, addToast);

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
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
                <h3 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {appLang === 'bn' ? 'মিডিয়া কনভার্টার' : 'Media Converter'}
                </h3>
            </div>

            <div className={`p-8 rounded-3xl border space-y-6 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <input type="file" ref={convertFileInputRef} onChange={handleConverterFileChange} className="hidden" accept="video/*,audio/*" />
                
                <div 
                    onClick={() => convertFileInputRef.current?.click()}
                    className={`border-2 border-dashed relative ${convertFile ? 'border-indigo-500 bg-indigo-500/10' : 'border-current opacity-30 hover:opacity-50'} rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all`}
                >
                    {convertFile ? (
                        <div className="text-center w-full relative">
                            <button 
                                onClick={clearConverterFile}
                                className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-10 cursor-pointer"
                                title="Clear File"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>

                            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white shadow-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                            </div>
                            <p className="font-bold text-sm">{convertFile.name}</p>
                            <p className="text-[10px] opacity-60">{(convertFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <>
                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <span className="text-xs font-black uppercase tracking-widest">{appLang === 'bn' ? 'ফাইল সিলেক্ট করুন' : 'Select File to Convert'}</span>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50 pl-2">{appLang === 'bn' ? 'টার্গেট ফরমেট' : 'Target Format'}</label>
                        <select 
                            value={targetFormat} 
                            onChange={(e) => setTargetFormat(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl text-xs font-bold outline-none border appearance-none cursor-pointer focus:ring-2 transition-all ${
                                isDark 
                                ? 'bg-slate-800 border-slate-600 text-white focus:ring-slate-500' 
                                : 'bg-white border-slate-200 text-slate-800 focus:ring-indigo-300'
                            }`}
                        >
                            <optgroup label="Audio Formats">
                                <option value="mp3">MP3 (Audio)</option>
                                <option value="wav">WAV (Lossless Audio)</option>
                                <option value="ogg">OGG (Audio)</option>
                                <option value="m4a">M4A (AAC Audio)</option>
                            </optgroup>
                            <optgroup label="Video Formats">
                                <option value="mp4">MP4 (Video)</option>
                                <option value="mkv">MKV (Video)</option>
                                <option value="avi">AVI (Video)</option>
                                <option value="webm">WEBM (Video)</option>
                            </optgroup>
                        </select>
                    </div>

                    {['mp3', 'wav', 'ogg', 'm4a', 'aac', 'opus'].includes(targetFormat) ? (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 pl-2">{appLang === 'bn' ? 'অডিও বিটরেট' : 'Audio Bitrate'}</label>
                            <select 
                                value={audioBitrate} 
                                onChange={(e) => setAudioBitrate(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl text-xs font-bold outline-none border appearance-none cursor-pointer focus:ring-2 transition-all ${
                                    isDark 
                                    ? 'bg-slate-800 border-slate-600 text-white focus:ring-slate-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:ring-indigo-300'
                                }`}
                            >
                                <option value="16k">16 kbps (Voice Optimization)</option>
                                <option value="64k">64 kbps (Low)</option>
                                <option value="128k">128 kbps (Standard)</option>
                                <option value="320k">320 kbps (Ultra)</option>
                            </select>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 pl-2">{appLang === 'bn' ? 'ভিডিও কোয়ালিটি' : 'Video Quality'}</label>
                            <select 
                                value={videoQuality} 
                                onChange={(e) => setVideoQuality(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl text-xs font-bold outline-none border appearance-none cursor-pointer focus:ring-2 transition-all ${
                                    isDark 
                                    ? 'bg-slate-800 border-slate-600 text-white focus:ring-slate-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:ring-indigo-300'
                                }`}
                            >
                                <option value="1080p">1080p (FHD)</option>
                                <option value="720p">720p (HD)</option>
                                <option value="480p">480p (SD)</option>
                            </select>
                        </div>
                    )}
                </div>

                {convertedResult && !isProcessing && (
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                            <span className="text-xs font-black uppercase tracking-widest">{appLang === 'bn' ? 'কনভার্শন সফল হয়েছে' : 'CONVERSION SUCCESSFUL'}</span>
                        </div>
                        <button 
                            onClick={() => handleDownloadSuccess(convertedResult.blob, convertedResult.name)}
                            className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            {appLang === 'bn' ? 'ডাউনলোড' : 'DOWNLOAD AGAIN'}
                        </button>
                    </div>
                )}

                {isProcessing && renderProcessingState(appLang === 'bn' ? 'কনভার্ট হচ্ছে...' : 'CONVERTING...')}
                
                <button 
                    onClick={processConvert}
                    disabled={isProcessing || !!loadError}
                    className={`w-full py-4 ${loadError ? 'bg-red-500' : activeColors.primary} text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer`}
                >
                    <span>{loadError ? (appLang === 'bn' ? 'ইঞ্জিন লোড ব্যর্থ' : 'ENGINE LOAD FAILED') : (!isLoaded ? (appLang === 'bn' ? 'ইঞ্জিন লোড হচ্ছে...' : 'LOADING ENGINE...') : (appLang === 'bn' ? 'কনভার্ট করুন' : 'CONVERT NOW'))}</span>
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
        </div>
    );
};
