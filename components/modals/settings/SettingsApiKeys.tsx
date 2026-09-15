import React, { useState, useEffect } from 'react';
import { 
    getAllApiKeys, 
    addUserApiKey, 
    deleteApiKey, 
    setActiveApiKey, 
    getActiveKeyId, 
    UserApiKey 
} from '../../../services/ApiKeyManager';
import { STORES } from '../../../services/db';

interface SettingsApiKeysProps {
    isDark: boolean;
    activeColors: any;
    appLang: 'bn' | 'en';
    addToast: (m: string, t: any) => void;
}

export const SettingsApiKeys: React.FC<SettingsApiKeysProps> = ({ isDark, activeColors, appLang, addToast }) => {
    const [keyList, setKeyList] = useState<UserApiKey[]>([]);
    const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
    const [newKeyInput, setNewKeyInput] = useState('');
    const [newKeyLabel, setNewKeyLabel] = useState('');
    const [isAddingKey, setIsAddingKey] = useState(false);

    const refreshKeys = async () => {
        try {
            const keys = await getAllApiKeys();
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
        refreshKeys();

        const handleKeysUpdate = () => {
            if (mounted) refreshKeys();
        };
        window.addEventListener(`store-updated-${STORES.API_KEYS}`, handleKeysUpdate);

        return () => { 
            mounted = false; 
            window.removeEventListener(`store-updated-${STORES.API_KEYS}`, handleKeysUpdate);
        };
    }, []);

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
        if (window.confirm(appLang === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) {
            await deleteApiKey(id);
            await refreshKeys();
            addToast(appLang === 'bn' ? 'কি ডিলিট করা হয়েছে' : 'Key deleted', 'warning');
        }
    };

    return (
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
    );
};
