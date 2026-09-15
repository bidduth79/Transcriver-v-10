import React, { useState, useEffect } from 'react';
import { syncAllLocalToCloud, checkCloudConnection } from '../../../services/api';

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
        <div className="flex flex-col h-full space-y-6">
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-60">Firebase Connection Status</h3>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${cloudConnection.includes('Online') ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></div>
                    <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{cloudConnection}</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center ${isSyncing ? 'bg-indigo-600 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {isSyncing ? (
                        <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    ) : (
                        <svg className="w-12 h-12 text-slate-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
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
                    <div className="flex justify-center w-full max-w-lg mx-auto">
                        <button 
                            onClick={() => handleStartSync()}
                            className={`p-6 rounded-3xl border flex flex-col items-center gap-3 w-full transition-all hover:scale-[1.02] active:scale-95 group ${isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-xl'}`}
                        >
                            <div className={`w-12 h-12 rounded-full ${activeColors.primary} text-white flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </div>
                            <div className="text-center">
                                <span className="block text-sm font-black uppercase tracking-widest mb-1">{appLang === 'bn' ? 'অটো সিনক্রোনাইজ' : 'AUTO SYNCHRONIZE'}</span>
                                <span className="block text-[10px] opacity-60 font-bold max-w-[250px] mx-auto">Local XAMPP &harr; IndexedDB &harr; Firebase &harr; Supabase</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
