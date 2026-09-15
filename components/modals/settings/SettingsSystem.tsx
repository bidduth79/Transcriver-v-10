import React, { useState, useEffect } from 'react';

interface SettingsSystemProps {
    isDark: boolean;
    activeColors: any;
    appLang: 'bn' | 'en';
    addToast: (m: string, t: any) => void;
}

export const SettingsSystem: React.FC<SettingsSystemProps> = ({ isDark, activeColors, appLang, addToast }) => {
    const [downloadPath, setDownloadPath] = useState('');

    useEffect(() => {
        setDownloadPath(localStorage.getItem('customDownloadPath') || '');
    }, []);

    return (
        <div className="flex flex-col h-full space-y-6">
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
                        className={`px-6 py-3 ${activeColors.primary} text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all`}
                    >
                        {appLang === 'bn' ? 'সেভ করুন' : 'SAVE'}
                    </button>
                </div>
            </div>
        </div>
    );
};
