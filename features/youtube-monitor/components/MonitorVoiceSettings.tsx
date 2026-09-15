import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play } from 'lucide-react';

interface MonitorVoiceSettingsProps {
  isDark: boolean;
  appLang: 'en' | 'bn';
  showVoiceSettings: boolean;
  setShowVoiceSettings: (val: boolean) => void;
  setShowApiSettings: (val: boolean) => void;
  setShowMonitorSettings: (val: boolean) => void;
  setShowChannelSettings: (val: boolean) => void;
  setShowFilterMenu: (val: boolean) => void;
  isVoiceEnabled: boolean;
  toggleVoice: (val: boolean) => void;
  voices: {voiceURI: string, name: string, lang: string}[];
  selectedVoiceURI: string;
  selectVoice: (val: string) => void;
  announce: (text: string) => void;
  isSpeaking: boolean;
}

export const MonitorVoiceSettings: React.FC<MonitorVoiceSettingsProps> = ({
  isDark,
  appLang,
  showVoiceSettings,
  setShowVoiceSettings,
  setShowApiSettings,
  setShowMonitorSettings,
  setShowChannelSettings,
  setShowFilterMenu,
  isVoiceEnabled,
  toggleVoice,
  voices,
  selectedVoiceURI,
  selectVoice,
  announce,
  isSpeaking
}) => {
  return (
    <div className="relative">
      <button 
        onClick={() => {
          setShowVoiceSettings(!showVoiceSettings);
          setShowApiSettings(false);
          setShowMonitorSettings(false);
          setShowChannelSettings(false);
          setShowFilterMenu(false);
        }} 
        className={`p-2 border rounded-lg transition-colors cursor-pointer group ${
          showVoiceSettings 
            ? (isDark ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600') 
            : (isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600')
        }`}
        title={appLang === 'bn' ? 'ভয়েস অ্যাসিস্ট্যান্ট' : 'Voice Assistant'}
      >
        <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
      
      <AnimatePresence>
        {showVoiceSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border z-50 overflow-hidden ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Voice Assistant (Jarvis Mode)</h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Announce upcoming event names automatically</p>
                </div>
                <button
                  onClick={() => toggleVoice(!isVoiceEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isVoiceEnabled ? 'bg-blue-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isVoiceEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Select Voice Model</label>
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{voices.length} voices found</span>
              </div>
              <select
                value={selectedVoiceURI}
                onChange={(e) => selectVoice(e.target.value)}
                disabled={!isVoiceEnabled}
                className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDark 
                    ? 'bg-gray-900 border-gray-700 text-gray-200 disabled:opacity-50' 
                    : 'bg-white border-gray-300 text-gray-900 disabled:opacity-50'
                }`}
              >
                {voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>

              <button
                onClick={() => announce(appLang === 'bn' ? 'এটি একটি পরীক্ষামূলক ঘোষণা' : 'This is a test announcement.')}
                disabled={!isVoiceEnabled || isSpeaking}
                className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  isVoiceEnabled && !isSpeaking
                    ? (isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white')
                    : (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                }`}
              >
                {isSpeaking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {appLang === 'bn' ? 'ভয়েস টেস্ট চলছে...' : 'Testing Voice...'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    {appLang === 'bn' ? 'ভয়েস টেস্ট করুন' : 'Test Voice'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
