import React, { useState, useEffect } from 'react';
import { isMicrophoneEnabled, setMicrophoneEnabled } from '../../../hooks/useAudioRecorder';
import { isLocalServerEnabled, setLocalServerEnabled } from '../../../utils/config';

interface SettingsSystemProps {
    isDark: boolean;
    activeColors: any;
    appLang: 'bn' | 'en';
    addToast: (m: string, t: any) => void;
}

export const SettingsSystem: React.FC<SettingsSystemProps> = ({ isDark, activeColors, appLang, addToast }) => {
    const [downloadPath, setDownloadPath] = useState('');
    const [micEnabled, setMicEnabled] = useState(isMicrophoneEnabled());
    const [xamppEnabled, setXamppEnabled] = useState(isLocalServerEnabled());

    useEffect(() => {
        setDownloadPath(localStorage.getItem('customDownloadPath') || '');
    }, []);

    const handleToggleMicrophone = () => {
        const nextState = !micEnabled;
        setMicrophoneEnabled(nextState);
        setMicEnabled(nextState);
        addToast(
            nextState 
                ? (appLang === 'bn' ? '🎙️ মাইক্রোফোন অপশন চালু করা হয়েছে' : '🎙️ Microphone option enabled')
                : (appLang === 'bn' ? '🎙️ মাইক্রোফোন অপশন বন্ধ করা হয়েছে' : '🎙️ Microphone option disabled'),
            nextState ? 'success' : 'info'
        );
    };

    const handleToggleXampp = () => {
        const nextState = !xamppEnabled;
        setLocalServerEnabled(nextState);
        setXamppEnabled(nextState);
        addToast(
            nextState 
                ? (appLang === 'bn' ? '🖥️ লোকাল জেম্প সার্ভার চালু করা হয়েছে' : '🖥️ Local XAMPP Server enabled')
                : (appLang === 'bn' ? '🖥️ লোকাল জেম্প সার্ভার বন্ধ করা হয়েছে' : '🖥️ Local XAMPP Server disabled'),
            nextState ? 'success' : 'info'
        );
    };

    return (
        <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2">
            {/* 1. Microphone Toggle */}
            <div className={`p-6 rounded-3xl border flex items-center justify-between gap-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col gap-1 max-w-md">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🎙️</span>
                        <h3 className="text-sm font-black uppercase tracking-wider">
                            {appLang === 'bn' ? 'মাইক্রোফোন রেকর্ডিং অপশন' : 'Live Microphone Recording'}
                        </h3>
                    </div>
                    <p className="text-xs opacity-60">
                        {appLang === 'bn' 
                            ? 'সাইডবারে সরাসরি মাইক্রোফোন দিয়ে লাইভ কথা রেকর্ড করার বাটনটি চালু বা বন্ধ রাখুন।' 
                            : 'Show or hide the live microphone recording button in the left sidebar.'}
                    </p>
                </div>
                <button
                    onClick={handleToggleMicrophone}
                    className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95 ${
                        micEnabled 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/30' 
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                >
                    {micEnabled 
                        ? (appLang === 'bn' ? '✓ চালু আছে (ON)' : '✓ ENABLED') 
                        : (appLang === 'bn' ? '✕ আপতত বন্ধ (OFF)' : '✕ DISABLED')}
                </button>
            </div>

            {/* 2. Local XAMPP Server Toggle */}
            <div className={`p-6 rounded-3xl border flex items-center justify-between gap-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col gap-1 max-w-md">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🖥️</span>
                        <h3 className="text-sm font-black uppercase tracking-wider">
                            {appLang === 'bn' ? 'লোকাল জেম্প সার্ভার (XAMPP - 127.0.0.1)' : 'Local XAMPP Server (127.0.0.1)'}
                        </h3>
                    </div>
                    <p className="text-xs opacity-60">
                        {appLang === 'bn' 
                            ? 'আপনার পিসির লোকাল Apache/PHP (127.0.0.1/licell_api) সিঙ্ক বন্ধ বা চালু রাখুন। বন্ধ থাকলে কোনো নেটওয়ার্ক কল হবে না।' 
                            : 'Enable or disable sync with local Apache/PHP server. When disabled, zero network calls are made to 127.0.0.1.'}
                    </p>
                </div>
                <button
                    onClick={handleToggleXampp}
                    className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95 ${
                        xamppEnabled 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/30' 
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                >
                    {xamppEnabled 
                        ? (appLang === 'bn' ? '✓ চালু আছে (ON)' : '✓ ENABLED') 
                        : (appLang === 'bn' ? '✕ আপতত বন্ধ (OFF)' : '✕ DISABLED')}
                </button>
            </div>

            {/* 3. Download Path */}
            <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-xs font-black uppercase tracking-widest opacity-60">
                    {appLang === 'bn' ? 'ডাউনলোড পাথ (ফোল্ডার লোকেশন)' : 'Download Path (Folder Location)'}
                </h3>
                <p className="text-[10px] opacity-60">
                    {appLang === 'bn' ? 'এখানে কোনো পাথ না দিলে ডিফল্টভাবে প্রজেক্টের "downloads" ফোল্ডারে সেভ হবে।' : 'If left empty, files will be saved in the project\'s "downloads" folder by default.'}
                </p>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        placeholder={appLang === 'bn' ? "যেমন: E:\\MyDownloads" : "e.g. E:\\MyDownloads"}
                        value={downloadPath}
                        onChange={e => setDownloadPath(e.target.value)}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-600 text-white focus:ring-indigo-500/50' : 'bg-white border-slate-300 text-slate-800 focus:ring-indigo-500/20'}`}
                    />
                    <button 
                        onClick={() => {
                            localStorage.setItem('customDownloadPath', downloadPath.trim());
                            addToast(appLang === 'bn' ? 'ডাউনলোড পাথ সেভ হয়েছে' : 'Download path saved', 'success');
                        }}
                        className={`px-6 py-3 ${activeColors.primary} text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer`}
                    >
                        {appLang === 'bn' ? 'সেভ করুন' : 'SAVE'}
                    </button>
                </div>
            </div>
        </div>
    );
};
