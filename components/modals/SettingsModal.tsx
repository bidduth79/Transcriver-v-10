
import React, { useState, useEffect, useRef } from 'react';
import { 
    getAllApiKeys, 
    addUserApiKey, 
    deleteApiKey, 
    setActiveApiKey, 
    getActiveKeyId, 
    UserApiKey 
} from '../../services/ApiKeyManager';
import { syncAllLocalToCloud, restoreAllCloudToLocal, checkCloudConnection } from '../../services/api';
import { STORES } from '../../services/db';
import { getSensitiveKeywords, setSensitiveKeywords } from '../../utils/sensitiveKeywords';
import { QuotaMonitor } from './QuotaMonitor';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeColors: any;
  appLang: 'bn' | 'en';
  addToast: (m: string, t: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDark, activeColors, appLang, addToast }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'quota' | 'sync' | 'keywords'>('keys');
  
  // API Key Management State
  const [keyList, setKeyList] = useState<UserApiKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [isAddingKey, setIsAddingKey] = useState(false);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('Idle');
  const [syncMode, setSyncMode] = useState<'up' | 'down'>('up');
  const [cloudConnection, setCloudConnection] = useState<string>('Checking...');

  // Keywords State
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  
  // Window State
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [size, setSize] = useState({ width: 700, height: 600 });
  const isResizing = useRef(false);

  const refreshKeys = async () => {
      try {
          const keys = await getAllApiKeys();
          // Safety check: ensure keys have required properties
          const validKeys = (keys || []).filter(k => k && k.id);
          setKeyList(validKeys); 
          setActiveKeyId(getActiveKeyId());
      } catch (e) {
          console.error("Failed to refresh keys", e);
          setKeyList([]);
      }
  };

  useEffect(() => {
    let mounted = true;
    if (isOpen) {
        refreshKeys();
        setKeywords(getSensitiveKeywords());
        setIsMinimized(false); 
        checkCloudConnection().then(res => {
            if(mounted) {
                setCloudConnection(res.status === 'online' ? 'Online & Authenticated' : res.message);
            }
        }).catch(() => {
            if(mounted) setCloudConnection('Connection Check Failed');
        });

        const handleKeysUpdate = () => {
            if (mounted) refreshKeys();
        };
        window.addEventListener(`store-updated-${STORES.API_KEYS}`, handleKeysUpdate);

        return () => { 
            mounted = false; 
            window.removeEventListener(`store-updated-${STORES.API_KEYS}`, handleKeysUpdate);
        };
    }
    return () => { mounted = false; };
  }, [isOpen, activeTab]);

  const handleAddKey = async () => {
      if (!newKeyInput.trim()) {
          addToast(appLang === 'bn' ? 'দয়া করে এপিআই কি দিন' : 'Please enter API Key', 'error');
          return;
      }
      setIsAddingKey(true);
      try {
          await addUserApiKey(newKeyInput, newKeyLabel || `Key ${keyList.length + 1}`);
          setNewKeyInput('');
          setNewKeyLabel('');
          await refreshKeys();
          addToast(appLang === 'bn' ? 'কি যুক্ত করা হয়েছে' : 'Key added successfully', 'success');
      } catch (e) {
          console.error(e);
          addToast('Failed to add key', 'error');
      } finally {
          setIsAddingKey(false);
      }
  };

  const handleSelectKey = (id: string) => {
      setActiveApiKey(id);
      setActiveKeyId(id);
      addToast(appLang === 'bn' ? 'এপিআই কি সিলেক্ট করা হয়েছে' : 'API Key Selected', 'success');
  };

  const handleDeleteKey = async (id: string) => {
      if (confirm(appLang === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) {
          await deleteApiKey(id);
          await refreshKeys();
          addToast(appLang === 'bn' ? 'কি ডিলিট করা হয়েছে' : 'Key deleted', 'warning');
      }
  };

  // Keywords Logic
  const handleAddKeyword = () => {
    if (!newKeywordInput.trim()) return;
    const inputs = newKeywordInput.split(',').map(s => s.trim()).filter(s => s);
    const newKeywords = Array.from(new Set([...keywords, ...inputs]));
    setKeywords(newKeywords);
    setSensitiveKeywords(newKeywords);
    setNewKeywordInput('');
    addToast(appLang === 'bn' ? 'শব্দ যুক্ত করা হয়েছে' : 'Keywords added', 'success');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    const newKeywords = keywords.filter(kw => kw !== kwToRemove);
    setKeywords(newKeywords);
    setSensitiveKeywords(newKeywords);
    addToast(appLang === 'bn' ? 'শব্দ মুছে ফেলা হয়েছে' : 'Keyword removed', 'warning');
  };

  // Sync Logic
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

  // --- Resizing Logic ---
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const modalElement = document.getElementById('settings-modal-container');
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      setSize({
        width: Math.max(400, e.clientX - rect.left),
        height: Math.max(400, e.clientY - rect.top)
      });
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResizing);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized Floating Widget */}
      <div className={`fixed bottom-24 right-20 z-[120] animate-in slide-in-from-bottom-10 fade-in duration-300 ${isMinimized ? 'block' : 'hidden'}`}>
         <div 
           onClick={() => setIsMinimized(false)}
           className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border cursor-pointer hover:scale-105 transition-transform ${isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
         >
            <div className={`w-3 h-3 rounded-full ${activeColors.primary}`}></div>
            <span className="text-xs font-bold uppercase tracking-widest">{appLang === 'bn' ? 'সেটিংস' : 'Settings'}</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
         </div>
      </div>

      {/* Full Modal */}
      <div className={`fixed inset-0 z-[110] flex items-center justify-center p-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300 ${isMinimized ? 'hidden' : 'flex'}`}>
      <div 
        id="settings-modal-container"
        className={`rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        style={{ 
            width: isMaximized ? '100vw' : `${size.width}px`, 
            height: isMaximized ? '100vh' : `${size.height}px`,
            maxWidth: isMaximized ? '100vw' : '95vw', 
            maxHeight: isMaximized ? '100vh' : '95vh',
            borderRadius: isMaximized ? '0' : '3rem'
        }}
      >
        <header className="px-10 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0 cursor-move">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight font-stylish-bn">সিস্টেম সেটিংস</h2>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">MANUAL CONFIGURATION</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(true)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white group">
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"/></svg>
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white group">
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4M4 20v4m0 0h4M20 20v4m0 0h-4"/></svg>
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white rounded-full transition-all text-white/60 group">
                <svg className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className={`flex items-center px-10 pt-6 gap-6 border-b shrink-0 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <button 
                onClick={() => setActiveTab('keys')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'keys' ? `border-b-4 ${activeColors.border} ${activeColors.text}` : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
                {appLang === 'bn' ? 'এপিআই কি ম্যানেজমেন্ট' : 'API KEY MANAGEMENT'}
            </button>
            <button 
                onClick={() => setActiveTab('quota')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'quota' ? `border-b-4 ${activeColors.border} ${activeColors.text}` : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
                {appLang === 'bn' ? 'কোটা মনিটর' : 'QUOTA MONITOR'}
            </button>
            <button 
                onClick={() => setActiveTab('keywords')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'keywords' ? `border-b-4 ${activeColors.border} ${activeColors.text}` : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
                {appLang === 'bn' ? 'সংবেদনশীল শব্দ' : 'SENSITIVE KEYWORDS'}
            </button>
            <button 
                onClick={() => setActiveTab('sync')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sync' ? `border-b-4 ${activeColors.border} ${activeColors.text}` : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
                {appLang === 'bn' ? 'ক্লাউড সিঙ্ক' : 'CLOUD SYNC'}
            </button>
        </div>

        <div className="flex-1 p-10 overflow-hidden flex flex-col">
          {activeTab === 'keys' && (
            <div className="flex flex-col h-full space-y-6">
                
                {/* Input Area */}
                <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-60">{appLang === 'bn' ? 'নতুন কি যুক্ত করুন' : 'Add New Key'}</h3>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            placeholder="Enter Gemini API Key (starts with AIza...)" 
                            value={newKeyInput}
                            onChange={e => setNewKeyInput(e.target.value)}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-600 text-white focus:ring-indigo-500/50' : 'bg-white border-slate-300 text-slate-800 focus:ring-indigo-500/20'}`}
                        />
                        <input 
                            type="text" 
                            placeholder="Label (Optional)" 
                            value={newKeyLabel}
                            onChange={e => setNewKeyLabel(e.target.value)}
                            className={`w-40 px-4 py-3 rounded-xl text-sm font-bold border outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-600 text-white focus:ring-indigo-500/50' : 'bg-white border-slate-300 text-slate-800 focus:ring-indigo-500/20'}`}
                        />
                        <button 
                            onClick={handleAddKey}
                            disabled={isAddingKey || !newKeyInput}
                            className={`px-6 py-3 ${activeColors.primary} text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50`}
                        >
                            {isAddingKey ? 'ADDING...' : (appLang === 'bn' ? 'যুক্ত করুন' : 'ADD')}
                        </button>
                    </div>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {keyList.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <p className="text-sm font-black uppercase tracking-widest">No Keys Found</p>
                            <p className="text-xs mt-2">Add a key above to start</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {keyList.map((k) => (
                                <div 
                                    key={k.id} 
                                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                                        activeKeyId === k.id 
                                        ? (isDark ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200') 
                                        : (isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50')
                                    }`}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div 
                                            onClick={() => handleSelectKey(k.id)}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${activeKeyId === k.id ? 'border-indigo-500 bg-indigo-500' : 'border-slate-400 opacity-50 hover:opacity-100'}`}
                                        >
                                            {activeKeyId === k.id && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-xs font-black uppercase tracking-wider truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{k.label}</p>
                                                {activeKeyId === k.id && <span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>}
                                            </div>
                                            {/* Safety Check: ensure key exists before slicing */}
                                            <p className="text-[10px] font-mono opacity-40 mt-1 truncate">****{(k.key || '').slice(-8)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteKey(k.id)}
                                        className="p-2.5 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                        title="Delete Key"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          )}
          
          {activeTab === 'quota' && (
            <QuotaMonitor 
              isDark={isDark} 
              appLang={appLang} 
              activeColors={activeColors} 
            />
          )}

          {activeTab === 'keywords' && (
            <div className="flex flex-col h-full space-y-6">
                {/* Input Area */}
                <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-60">
                        {appLang === 'bn' ? 'নতুন সংবেদনশীল শব্দ যুক্ত করুন (কমা দিয়ে আলাদা করুন)' : 'Add New Sensitive Keywords (comma separated)'}
                    </h3>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            placeholder={appLang === 'bn' ? "শব্দ লিখুন..." : "Enter keywords..."}
                            value={newKeywordInput}
                            onChange={e => setNewKeywordInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' ? handleAddKeyword() : null}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-600 text-white focus:ring-indigo-500/50' : 'bg-white border-slate-300 text-slate-800 focus:ring-indigo-500/20'}`}
                        />
                        <button 
                            onClick={handleAddKeyword}
                            disabled={!newKeywordInput.trim()}
                            className={`px-6 py-3 ${activeColors.primary} text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50`}
                        >
                            {appLang === 'bn' ? 'যুক্ত করুন' : 'ADD'}
                        </button>
                    </div>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {keywords.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <p className="text-sm font-black uppercase tracking-widest">{appLang === 'bn' ? 'কোনো শব্দ পাওয়া যায়নি' : 'No Keywords Found'}</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {keywords.map((kw, index) => (
                                <div 
                                    key={`kw-${index}`} 
                                    className={`px-4 py-2 rounded-xl border flex items-center gap-3 transition-all ${
                                        isDark ? 'bg-slate-900 border-slate-700 hover:border-red-500/50' : 'bg-white border-slate-200 hover:border-red-500/50'
                                    }`}
                                >
                                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{kw}</span>
                                    <button 
                                        onClick={() => handleRemoveKeyword(kw)}
                                        className="text-slate-400 hover:text-red-500 transition-all rounded-full p-1"
                                        title={appLang === 'bn' ? 'মুছে ফেলুন' : 'Remove Keyword'}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'sync' && (
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
                              {/* Master Sync Button */}
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
          )}
        </div>

        {!isMaximized && (
            <div 
            onMouseDown={startResizing}
            className="absolute bottom-2 right-2 w-10 h-10 cursor-nwse-resize flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity z-[200]"
            >
            <svg className="w-6 h-6 text-slate-400 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 22h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm8-8h-2v-2h2v2zm-12 8h-2v-2h2v2z"/>
            </svg>
            </div>
        )}
      </div>
      </div>
    </>
  );
};
