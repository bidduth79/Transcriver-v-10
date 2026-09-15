import React from 'react';
import { Download, Play, Square, CheckCircle2, CheckSquare, Trash2 } from 'lucide-react';

interface MonitorSelectActionsProps {
  isDark: boolean;
  appLang: 'en' | 'bn';
  isSelectMode: boolean;
  selectedIds: string[];
  handleBulkDownload: () => void;
  handleBulkStart: () => void;
  handleBulkStop: () => void;
  handleBulkClearDownload: () => void;
  handleBulkMarkRead: () => void;
  handleBulkDelete: () => void;
}

export const MonitorSelectActions: React.FC<MonitorSelectActionsProps> = ({
  isDark,
  appLang,
  isSelectMode,
  selectedIds,
  handleBulkDownload,
  handleBulkStart,
  handleBulkStop,
  handleBulkClearDownload,
  handleBulkMarkRead,
  handleBulkDelete
}) => {
  if (!isSelectMode || selectedIds.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg border animate-in fade-in slide-in-from-right-4 ${isDark ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100'}`}>
      <span className={`text-xs font-bold mr-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{selectedIds.length} {appLang === 'bn' ? 'সিলেক্ট করা হয়েছে' : 'Selected'}</span>
      <button 
        onClick={handleBulkDownload}
        className={`p-1.5 rounded-md transition-colors group ${isDark ? 'text-blue-400 hover:bg-blue-900/50' : 'text-blue-600 hover:bg-blue-100'}`}
        title={appLang === 'bn' ? 'ডাউনলোড করুন' : 'Download Selected'}
      >
        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
      <button 
        onClick={handleBulkStart}
        className={`p-1.5 rounded-md transition-colors group ${isDark ? 'text-green-400 hover:bg-green-900/50' : 'text-green-600 hover:bg-green-100'}`}
        title={appLang === 'bn' ? 'স্টার্ট করুন' : 'Start Selected'}
      >
        <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
      <button 
        onClick={handleBulkStop}
        className={`p-1.5 rounded-md transition-colors group ${isDark ? 'text-yellow-400 hover:bg-yellow-900/50' : 'text-yellow-600 hover:bg-yellow-100'}`}
        title={appLang === 'bn' ? 'স্টপ করুন' : 'Stop Selected'}
      >
        <Square className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
      <button 
        onClick={handleBulkClearDownload}
        className={`p-1.5 rounded-md transition-colors group ${isDark ? 'text-indigo-400 hover:bg-indigo-900/50' : 'text-indigo-600 hover:bg-indigo-100'}`}
        title={appLang === 'bn' ? 'ক্লিয়ার করুন' : 'Clear Completed'}
      >
        <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
      <button 
        onClick={handleBulkMarkRead}
        className={`p-1.5 rounded-md transition-colors group ${isDark ? 'text-purple-400 hover:bg-purple-900/50' : 'text-purple-600 hover:bg-purple-100'}`}
        title={appLang === 'bn' ? 'পঠিত হিসেবে মার্ক করুন' : 'Mark as Read'}
      >
        <CheckSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
      <button 
        onClick={handleBulkDelete}
        className={`p-1.5 rounded-md transition-colors group ${isDark ? 'text-red-400 hover:bg-red-900/50' : 'text-red-600 hover:bg-red-100'}`}
        title={appLang === 'bn' ? 'ডিলিট করুন' : 'Delete Selected'}
      >
        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};
