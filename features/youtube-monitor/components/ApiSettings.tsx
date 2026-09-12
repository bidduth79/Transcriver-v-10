import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, X, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { YouTubeApiKey } from '../../../types/youtube';

interface ApiSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  appLang: 'en' | 'bn';
  apiKeys: YouTubeApiKey[];
  newApiLabel: string;
  setNewApiLabel: (val: string) => void;
  newApiKey: string;
  setNewApiKey: (val: string) => void;
  handleAddKey: () => void;
  editingApiKeyId: string | null;
  setEditingApiKeyId: (id: string | null) => void;
  editApiLabel: string;
  setEditApiLabel: (val: string) => void;
  editApiValue: string;
  setEditApiValue: (val: string) => void;
  handleSaveApiKey: (id: string, updates?: Partial<YouTubeApiKey>) => void;
  removeApiKey: (id: string) => void;
  isDark?: boolean;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({
  isOpen,
  onClose,
  appLang,
  apiKeys,
  newApiLabel,
  setNewApiLabel,
  newApiKey,
  setNewApiKey,
  handleAddKey,
  editingApiKeyId,
  setEditingApiKeyId,
  editApiLabel,
  setEditApiLabel,
  editApiValue,
  setEditApiValue,
  handleSaveApiKey,
  removeApiKey,
  isDark
}) => {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const calculateTimeUntilReset = () => {
      const now = new Date();
      const ptString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
      const ptDate = new Date(ptString);
      
      const nextMidnightPT = new Date(ptDate);
      nextMidnightPT.setHours(24, 0, 0, 0);
      
      const diffMs = nextMidnightPT.getTime() - ptDate.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilReset(`${hours}h ${minutes}m`);
    };

    calculateTimeUntilReset();
    const interval = setInterval(calculateTimeUntilReset, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`absolute top-full right-0 mt-2 w-[400px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border overflow-hidden z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
            <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <Key className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
              {appLang === 'bn' ? 'ইউটিউব এপিআই সেটিংস' : 'YouTube API Settings'}
            </h3>
            <button onClick={onClose} className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            
            {/* API Keys Section */}
            <div className="flex flex-col gap-3 mb-4">
              <input
                type="text"
                value={newApiLabel}
                onChange={(e) => setNewApiLabel(e.target.value)}
                placeholder={appLang === 'bn' ? 'লেবেল (যেমন: Key 1)' : 'Label'}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
              <input
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder={appLang === 'bn' ? 'এপিআই কি লিখুন' : 'Enter API Key'}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
              <button
                onClick={handleAddKey}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 cursor-pointer text-sm font-medium group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> {appLang === 'bn' ? 'যোগ করুন' : 'Add API Key'}
              </button>
            </div>
            <div className="space-y-2">
              {apiKeys.map(key => (
                <div key={key.id} className={`p-3 rounded-lg border flex items-center justify-between ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  {editingApiKeyId === key.id ? (
                    <div className="flex-1 flex flex-col gap-2 mr-2">
                      <input 
                        type="text"
                        value={editApiLabel}
                        onChange={(e) => setEditApiLabel(e.target.value)}
                        className={`w-full px-2 py-1 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                      <input 
                        type="text"
                        value={editApiValue}
                        onChange={(e) => setEditApiValue(e.target.value)}
                        className={`w-full px-2 py-1 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveApiKey(key.id)} className="flex-1 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 cursor-pointer">
                          Save
                        </button>
                        <button onClick={() => setEditingApiKeyId(null)} className={`flex-1 py-1 text-xs rounded cursor-pointer ${isDark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex-1 cursor-pointer overflow-hidden"
                      onClick={() => {
                        setEditingApiKeyId(key.id);
                        setEditApiLabel(key.label);
                        setEditApiValue(key.key);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{key.label}</h4>
                        {key.isPrimary && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                            {appLang === 'bn' ? 'প্রাইমারি' : 'Primary'}
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${key.isExhausted ? (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700') : (key.isActive ? (isDark ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'))}`}>
                          {key.isExhausted ? (appLang === 'bn' ? 'কোটা শেষ' : 'Quota Exceeded') : (key.isActive ? (appLang === 'bn' ? 'সক্রিয়' : 'Active') : (appLang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-[10px] font-mono truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                        </p>
                        {key.isExhausted && (
                          <p className={`text-[10px] ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                            {appLang === 'bn' ? 'রিকভার হবে:' : 'Recovers in:'} {timeUntilReset}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {editingApiKeyId !== key.id && (
                    <div className="flex items-center gap-1 ml-2">
                      <button 
                        onClick={() => handleSaveApiKey(key.id, { isPrimary: true })} 
                        className={`p-1.5 rounded-lg cursor-pointer flex-shrink-0 ${key.isPrimary ? (isDark ? 'text-indigo-400 bg-indigo-900/30' : 'text-indigo-600 bg-indigo-50') : (isDark ? 'text-gray-500 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-100')}`}
                        title={appLang === 'bn' ? 'প্রাইমারি হিসেবে সেট করুন' : 'Set as Primary'}
                      >
                        <svg className="w-4 h-4" fill={key.isPrimary ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      </button>
                      {key.isExhausted && (
                        <button 
                          onClick={() => handleSaveApiKey(key.id, { isExhausted: false })} 
                          className={`p-1.5 rounded-lg cursor-pointer flex-shrink-0 ${isDark ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          title={appLang === 'bn' ? 'হেলথ রিস্টোর করুন' : 'Restore Health'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </button>
                      )}
                      <button 
                        onClick={() => handleSaveApiKey(key.id, { isActive: !key.isActive })} 
                        className={`p-1.5 rounded-lg cursor-pointer flex-shrink-0 ${key.isActive ? (isDark ? 'text-amber-400 hover:bg-amber-900/30' : 'text-amber-500 hover:bg-amber-50') : (isDark ? 'text-gray-500 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-100')}`}
                        title={key.isActive ? (appLang === 'bn' ? 'নিষ্ক্রিয় করুন' : 'Disable') : (appLang === 'bn' ? 'সক্রিয় করুন' : 'Enable')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </button>
                      <button onClick={() => removeApiKey(key.id)} className={`p-1.5 rounded-lg cursor-pointer flex-shrink-0 ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
