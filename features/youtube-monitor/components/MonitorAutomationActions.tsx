import React from 'react';
import { Bot, Download, RefreshCw } from 'lucide-react';
import { QueueState } from '../../../types/youtube';

interface MonitorAutomationActionsProps {
  isDark: boolean;
  appLang: 'en' | 'bn';
  queueState: QueueState;
  toggleAutoProcess: () => void;
  toggleAutoDownload: () => void;
  fetchVideos: () => void;
  isFetching: boolean;
}

export const MonitorAutomationActions: React.FC<MonitorAutomationActionsProps> = ({
  isDark,
  appLang,
  queueState,
  toggleAutoProcess,
  toggleAutoDownload,
  fetchVideos,
  isFetching
}) => {
  return (
    <>
      <button 
        onClick={toggleAutoProcess} 
        className={`p-2 md:px-4 md:py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-sm group ${
          queueState.isAutoProcess 
            ? (isDark ? 'bg-green-600 hover:bg-green-500 text-white ring-2 ring-green-500/50' : 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-500/50')
            : (isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white')
        }`}
        title={appLang === 'bn' ? (queueState.isAutoProcess ? 'অটো পাইলট অন' : 'অটো পাইলট অফ') : (queueState.isAutoProcess ? 'Auto Pilot On' : 'Auto Pilot Off')}
      >
        <Bot className={`w-4 h-4 group-hover:scale-110 transition-transform ${queueState.isAutoProcess ? 'animate-pulse' : ''}`} /> 
        <span className="hidden md:inline">{appLang === 'bn' ? (queueState.isAutoProcess ? 'অটো পাইলট অন' : 'অটো পাইলট অফ') : (queueState.isAutoProcess ? 'Auto Pilot On' : 'Auto Pilot Off')}</span>
      </button>

      <button 
        onClick={toggleAutoDownload} 
        className={`p-2 md:px-4 md:py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-sm group ${
          queueState.isAutoDownload 
            ? (isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/50' : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/50')
            : (isDark ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white')
        }`}
        title={appLang === 'bn' ? (queueState.isAutoDownload ? 'অটো ডাউনলোড অন' : 'অটো ডাউনলোড অফ') : (queueState.isAutoDownload ? 'Auto DL On' : 'Auto DL Off')}
      >
        <Download className={`w-4 h-4 group-hover:scale-110 transition-transform ${queueState.isAutoDownload ? 'animate-bounce' : ''}`} /> 
        <span className="hidden md:inline">{appLang === 'bn' ? (queueState.isAutoDownload ? 'অটো ডাউনলোড অন' : 'অটো ডাউনলোড অফ') : (queueState.isAutoDownload ? 'Auto DL On' : 'Auto DL Off')}</span>
      </button>
      
      <button 
        onClick={fetchVideos} 
        disabled={isFetching}
        className={`p-2 md:px-4 md:py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70 group ${
          isDark ? 'bg-[#E32636] hover:bg-red-600 text-white' : 'bg-[#E32636] hover:bg-red-700 text-white'
        }`}
      >
        <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${isFetching ? 'animate-spin' : ''}`} /> 
        <span className="hidden md:inline">{appLang === 'bn' ? 'আপডেট' : 'Update'}</span>
      </button>
    </>
  );
};
