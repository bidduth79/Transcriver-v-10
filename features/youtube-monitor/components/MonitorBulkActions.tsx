import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Download, Play, Pause, RefreshCw, Trash2 } from 'lucide-react';
import { YouTubeVideo } from '../../../types/youtube';

interface MonitorBulkActionsProps {
  isSelectMode: boolean;
  selectedIds: string[];
  recentVideos: YouTubeVideo[];
  oldVideos: YouTubeVideo[];
  appLang: 'en' | 'bn';
  handleSelectAll: (videos: YouTubeVideo[]) => void;
  handleClearSelection: () => void;
  handleBulkDownload: () => void;
  handleBulkMarkRead: () => void;
  handleBulkStart: () => void;
  handleBulkStop: () => void;
  handleBulkClearDownload: () => void;
  handleBulkDelete: () => void;
}

export const MonitorBulkActions: React.FC<MonitorBulkActionsProps> = ({
  isSelectMode,
  selectedIds,
  recentVideos,
  oldVideos,
  appLang,
  handleSelectAll,
  handleClearSelection,
  handleBulkDownload,
  handleBulkMarkRead,
  handleBulkStart,
  handleBulkStop,
  handleBulkClearDownload,
  handleBulkDelete
}) => {
  const allVideos = [...recentVideos, ...oldVideos];
  const isAllSelected = selectedIds.length > 0 && selectedIds.length === allVideos.length;

  return (
    <AnimatePresence>
      {isSelectMode && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center justify-between overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => isAllSelected ? handleClearSelection() : handleSelectAll(allVideos)}
              className="text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" /> {isAllSelected ? (appLang === 'bn' ? 'সবগুলো ডি-সিলেক্ট' : 'Deselect All') : (appLang === 'bn' ? 'সবগুলো সিলেক্ট' : 'Select All')}
            </button>
            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              {selectedIds.length} {appLang === 'bn' ? 'টি সিলেক্ট করা হয়েছে' : 'Selected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleBulkDownload}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer group"
            >
              <Download className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> {appLang === 'bn' ? 'ডাউনলোড' : 'Download'}
            </button>
            <button 
              onClick={handleBulkMarkRead}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer group"
            >
              <CheckSquare className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> {appLang === 'bn' ? 'পঠিত মার্ক' : 'Mark Read'}
            </button>
            <button 
              onClick={handleBulkStart}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer group"
            >
              <Play className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> {appLang === 'bn' ? 'স্টার্ট' : 'Start'}
            </button>
            <button 
              onClick={handleBulkStop}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer group"
            >
              <Pause className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> {appLang === 'bn' ? 'স্টপ' : 'Stop'}
            </button>
            <button 
              onClick={handleBulkClearDownload}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer group"
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> {appLang === 'bn' ? 'ডাউনলোড ক্লিয়ার' : 'Clear Download'}
            </button>
            <button 
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer group"
            >
              <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> {appLang === 'bn' ? 'ডিলিট' : 'Delete'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
