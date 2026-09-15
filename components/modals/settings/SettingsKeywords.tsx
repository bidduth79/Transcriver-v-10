import React, { useState, useEffect } from 'react';
import { getSensitiveKeywords, setSensitiveKeywords } from '../../../utils/sensitiveKeywords';

interface SettingsKeywordsProps {
    isDark: boolean;
    activeColors: any;
    appLang: 'bn' | 'en';
    addToast: (m: string, t: any) => void;
}

export const SettingsKeywords: React.FC<SettingsKeywordsProps> = ({ isDark, activeColors, appLang, addToast }) => {
    const [keywords, setKeywords] = useState<string[]>([]);
    const [newKeywordInput, setNewKeywordInput] = useState('');

    useEffect(() => {
        setKeywords(getSensitiveKeywords());
    }, []);

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

    return (
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
    );
};
