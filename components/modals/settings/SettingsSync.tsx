import React, { useState, useEffect } from 'react';
import { syncAllLocalToCloud, checkCloudConnection } from '../../../services/api';
import { isLocalServerEnabled, setLocalServerEnabled } from '../../../utils/config';

interface SettingsSyncProps {
    isDark: boolean;
    activeColors: any;
    appLang: 'bn' | 'en';
    addToast: (m: string, t: any) => void;
}

export const SettingsSync: React.FC<SettingsSyncProps> = ({ isDark, activeColors, appLang, addToast }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncStatus, setSyncStatus] = useState('Idle');
    const [cloudConnection, setCloudConnection] = useState<string>('Checking...');
    const [xamppEnabled, setXamppEnabled] = useState(isLocalServerEnabled());

    useEffect(() => {
        let mounted = true;
        checkCloudConnection().then(res => {
            if(mounted) {
                setCloudConnection(res.status === 'online' ? 'Online & Authenticated' : res.message);
            }
        }).catch(() => {
            if(mounted) setCloudConnection('Connection Check Failed');
        });
        return () => { mounted = false; };
    }, []);

    const handleToggleXampp = () => {
        const nextState = !xamppEnabled;
        setLocalServerEnabled(nextState);
        setXamppEnabled(nextState);
        addToast(
            nextState 
                ? (appLang === 'bn' ? '🖥️ লোকাল জেম্প সার্ভার সিঙ্ক চালু করা হয়েছে' : '🖥️ Local XAMPP Server sync enabled')
                : (appLang === 'bn' ? '🖥️ লোকাল জেম্প সার্ভার সিঙ্ক বন্ধ করা হয়েছে' : '🖥️ Local XAMPP Server sync disabled'),
            nextState ? 'success' : 'info'
        );
    };

    const handleStartSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncStatus('Starting Master Sync...');
        
        try {
            await syncAllLocalToCloud((msg, pct) => {
                setSyncStatus(msg);
                setSyncProgress(pct);
            });
            addToast(appLang === 'bn' ? 'সকল ডাটাবেইজ সিনক্রোনাইজ সম্পন্ন হয়েছে' : 'All Databases Synced Successfully', 'success');
        } catch (e: any) {
            setSyncStatus('Failed: ' + e.message);
            addToast(appLang === 'bn' ? 'অপারেশন ব্যর্থ হয়েছে' : 'Operation Failed', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Firebase Status */}
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className="text-xs font-black uppercase tracking-widest mb-3 opacity-60">
                        {appLang === 'bn' ? 'ফায়ারবেস ক্লাউড স্ট্যাটাস' : 'Firebase Cloud Status'}
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${cloudConnection.includes('Online') ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></div>
                        <span className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{cloudConnection}</span>
                    </div>
                </div>

                {/* Local XAMPP Toggle Card */}
                <div className={`p-6 rounded-3xl border flex items-center justify-between gap-3 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">
                            {appLang === 'bn' ? 'লোকাল জেম্প সার্ভার (XAMPP)' : 'Local XAMPP Server'}
                        </h3>
                        <p className="text-[10px] opacity-60">
                            {xamppEnabled ? '127.0.0.1/licell_api সক্রিয়' : (appLang === 'bn' ? 'আপতত সম্পূর্ণ বন্ধ (OFF)' : 'Completely Paused')}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleXampp}
                        className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95 ${
                            xamppEnabled 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                    >
                        {xamppEnabled ? '✓ ON' : '✕ OFF'}
                    </button>
                </div>
            </div>

            {/* Sync Action Area */}
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isSyncing ? 'bg-indigo-600 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {isSyncing ? (
                        <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    ) : (
                        <svg className="w-10 h-10 text-slate-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    )}
                </div>
                
                {isSyncing ? (
                    <div className="w-full max-w-sm space-y-2">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{syncStatus}</p>
                    </div>
                ) : (
                    <div className="flex justify-center w-full max-w-md mx-auto">
                        <button 
                            onClick={() => handleStartSync()}
                            className={`p-6 rounded-3xl border flex flex-col items-center gap-3 w-full transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer ${isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-xl'}`}
                        >
                            <div className={`w-12 h-12 rounded-full ${activeColors.primary} text-white flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </div>
                            <div className="text-center">
                                <span className="block text-sm font-black uppercase tracking-widest mb-1">{appLang === 'bn' ? 'ম্যানুয়াল ডাটাবেস সিঙ্ক' : 'MANUAL DATABASE SYNC'}</span>
                                <span className="block text-[10px] opacity-60 font-bold max-w-[280px] mx-auto">
                                    {xamppEnabled ? 'Local XAMPP &harr; IndexedDB &harr; Firebase' : 'IndexedDB (Local Storage) &harr; Firebase Cloud'}
                                </span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
