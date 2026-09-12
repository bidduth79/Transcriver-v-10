import React, { useState, useRef, useEffect } from 'react';
import { useFFmpeg } from '../../../hooks/useFFmpeg';
import { fetchFile } from '@ffmpeg/util';

export const JoinMediaTool = ({ isDark, activeColors, appLang, addToast, currentTab }: any) => {
    const [joinFiles, setJoinFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const joinFileInputRef = useRef<HTMLInputElement>(null);

    const { ffmpeg, isLoaded, loadProgress, loadError, load } = useFFmpeg();

    useEffect(() => {
        load();
    }, [load]);

    const handleJoinFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setJoinFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const removeJoinFile = (index: number) => {
        setJoinFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearJoinFiles = () => {
        setJoinFiles([]);
        if (joinFileInputRef.current) joinFileInputRef.current.value = '';
    };

    const handleDownloadSuccess = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(appLang === 'bn' ? "ডাউনলোড শুরু হয়েছে (ব্রাউজার ফোল্ডার চেক করুন)" : "Download Started (Check browser downloads)", "success");
    };

    const processJoin = async () => {
        if (joinFiles.length < 2) {
            addToast(appLang === 'bn' ? "কমপক্ষে ২টি ফাইল প্রয়োজন" : "Need at least 2 files", 'warning');
            return;
        }
        if (!isLoaded) {
            addToast(appLang === 'bn' ? "FFmpeg লোড হচ্ছে, দয়া করে অপেক্ষা করুন" : "FFmpeg is loading, please wait", 'warning');
            return;
        }

        setIsProcessing(true);

        try {
            let concatText = '';
            for (let i = 0; i < joinFiles.length; i++) {
                const file = joinFiles[i];
                const safeName = `file_${i}_${file.name.replace(/\s+/g, '_')}`;
                await ffmpeg.writeFile(safeName, await fetchFile(file));
                concatText += `file '${safeName}'\n`;
            }

            await ffmpeg.writeFile('concat.txt', concatText);

            const ext = joinFiles[0].name.split('.').pop() || 'mp4';
            const outputName = `Joined_${Date.now()}.${ext}`;

            await ffmpeg.exec([
                '-f', 'concat',
                '-safe', '0',
                '-i', 'concat.txt',
                '-c', 'copy',
                outputName
            ]);

            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([(data as Uint8Array).buffer], { type: joinFiles[0].type });
            
            handleDownloadSuccess(blob, outputName);
            setJoinFiles([]);
        } catch (e: any) {
            console.error(e);
            addToast(appLang === 'bn' ? `জয়েনিং ব্যর্থ: ${e.message}` : `Joining failed: ${e.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

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
        <div className="space-y-6">
            <input type="file" ref={joinFileInputRef} onChange={handleJoinFileChange} className="hidden" multiple accept={currentTab === 'video_cut' ? 'video/*' : 'audio/*'} />
            <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">{appLang === 'bn' ? 'ফাইল লিস্ট' : 'File List'}</label>
                        {joinFiles.length > 0 && (
                            <button 
                                onClick={clearJoinFiles}
                                className="text-[9px] font-bold text-red-500 hover:text-red-600 uppercase flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                CLEAR ALL
                            </button>
                        )}
                    </div>
                    <button onClick={() => joinFileInputRef.current?.click()} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 cursor-pointer">+ {appLang === 'bn' ? 'যোগ করুন' : 'ADD FILES'}</button>
                </div>
                <div className={`min-h-[120px] max-h-[300px] overflow-y-auto custom-scrollbar rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} p-2 space-y-2`}>
                    {joinFiles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 min-h-[120px]"><p className="text-[10px] font-bold uppercase">NO FILES SELECTED</p></div>
                    ) : (
                        joinFiles.map((file, idx) => (
                            <div key={idx} className={`p-3 rounded-xl flex items-center justify-between group ${isDark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0">{idx + 1}</div>
                                    <span className="text-xs font-bold truncate max-w-[200px]">{file.name}</span>
                                </div>
                                <button onClick={() => removeJoinFile(idx)} className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {isProcessing && renderProcessingState(appLang === 'bn' ? 'মার্জ হচ্ছে...' : 'MERGING FILES...')}
            
            <button 
                onClick={processJoin} 
                disabled={isProcessing || joinFiles.length < 2 || !!loadError} 
                className={`w-full py-4 ${loadError ? 'bg-red-500' : activeColors.primary} text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer`}
            >
                <span>{loadError ? (appLang === 'bn' ? 'ইঞ্জিন লোড ব্যর্থ' : 'ENGINE LOAD FAILED') : (!isLoaded ? (appLang === 'bn' ? 'ইঞ্জিন লোড হচ্ছে...' : 'LOADING ENGINE...') : (appLang === 'bn' ? 'মার্জ শুরু করুন' : 'MERGE FILES'))}</span>
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
