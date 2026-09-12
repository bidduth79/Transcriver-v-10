import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Youtube, Wifi, List, Link as LinkIcon, LayoutGrid, Download, Play, Square, 
  CheckCircle2, Trash2, Filter, Sparkles, Clock, Search, CheckSquare, Bot, 
  RefreshCw, Headphones, Volume2, Settings, Loader2, ArrowLeft
} from 'lucide-react';
import { YouTubeChannel, YouTubeApiKey, YouTubeVideo, QueueState } from '../../../types/youtube';
import { getRelativeTime, toBengaliNumber } from '../utils/formatters';
import { MonitorFilterMenu } from './MonitorFilterMenu';
import { ChannelSettings } from './ChannelSettings';
import { MonitorSettings } from './MonitorSettings';
import { ApiSettings } from './ApiSettings';
import { MonitorBulkActions } from './MonitorBulkActions';

interface YouTubeMonitorHeaderProps {
  isDark: boolean;
  appLang: 'en' | 'bn';
  queueState: QueueState;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
  isLinkModalOpen: boolean;
  setIsLinkModalOpen: (val: boolean) => void;
  isSelectMode: boolean;
  setIsSelectMode: (val: boolean) => void;
  clearSelection: () => void;
  selectedIds: string[];
  bulkAction: (action: 'download' | 'start' | 'stop' | 'clear' | 'delete') => void;
  filterRef: React.RefObject<HTMLDivElement>;
  showFilterMenu: boolean;
  setShowFilterMenu: (val: boolean) => void;
  setShowChannelSettings: (val: boolean) => void;
  setShowApiSettings: (val: boolean) => void;
  setShowMonitorSettings: (val: boolean) => void;
  setShowVoiceSettings: (val: boolean) => void;
  selectedChannelFilter: string;
  setSelectedChannelFilter: (val: string) => void;
  selectedDurationFilter: string;
  setSelectedDurationFilter: (val: string) => void;
  selectedDateFilter: string;
  setSelectedDateFilter: (val: string) => void;
  selectedTimeFilter: string;
  setSelectedTimeFilter: (val: string) => void;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (val: string) => void;
  channels: YouTubeChannel[];
  monitorFilter: 'all' | 'unread' | 'archive';
  setMonitorFilter: (val: 'all' | 'unread' | 'archive') => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  channelRef: React.RefObject<HTMLDivElement>;
  showChannelSettings: boolean;
  newChannelTitle: string;
  setNewChannelTitle: (val: string) => void;
  newChannelId: string;
  setNewChannelId: (val: string) => void;
  handleAddChannel: () => void;
  editingChannelId: string | null;
  setEditingChannelId: (val: string | null) => void;
  editChannelTitle: string;
  setEditChannelTitle: (val: string) => void;
  editChannelValue: string;
  setEditChannelValue: (val: string) => void;
  handleSaveChannel: (id: string) => void;
  removeChannel: (id: string) => void;
  handleMarkAllRead: () => void;
  toggleAutoProcess: () => void;
  toggleAutoDownload: () => void;
  fetchVideos: () => void;
  isFetching: boolean;
  monitorRef: React.RefObject<HTMLDivElement>;
  showMonitorSettings: boolean;
  showVoiceSettings: boolean;
  isVoiceEnabled: boolean;
  toggleVoice: (val: boolean) => void;
  voices: {voiceURI: string, name: string, lang: string}[];
  selectedVoiceURI: string;
  selectVoice: (val: string) => void;
  announce: (text: string) => void;
  isSpeaking: boolean;
  apiRef: React.RefObject<HTMLDivElement>;
  showApiSettings: boolean;
  apiKeys: YouTubeApiKey[];
  newApiLabel: string;
  setNewApiLabel: (val: string) => void;
  newApiKey: string;
  setNewApiKey: (val: string) => void;
  handleAddKey: () => void;
  editingApiKeyId: string | null;
  setEditingApiKeyId: (val: string | null) => void;
  editApiLabel: string;
  setEditApiLabel: (val: string) => void;
  editApiValue: string;
  setEditApiValue: (val: string) => void;
  handleSaveApiKey: (id: string, updates?: Partial<YouTubeApiKey>) => void;
  removeApiKey: (id: string) => void;
  recentVideos: YouTubeVideo[];
  oldVideos: YouTubeVideo[];
  handleSelectAll: (videos: YouTubeVideo[]) => void;
  handleBulkDownload: () => void;
  handleBulkMarkRead: () => void;
  handleBulkStart: () => void;
  handleBulkStop: () => void;
  handleBulkClearDownload: () => void;
  handleBulkDelete: () => void;
  onClose: () => void;
}

export const YouTubeMonitorHeader: React.FC<YouTubeMonitorHeaderProps> = ({
  isDark, appLang, queueState, isMobileMenuOpen, setIsMobileMenuOpen,
  isLinkModalOpen, setIsLinkModalOpen, isSelectMode, setIsSelectMode,
  clearSelection, selectedIds, bulkAction, filterRef, showFilterMenu,
  setShowFilterMenu, setShowChannelSettings, setShowApiSettings,
  setShowMonitorSettings, setShowVoiceSettings, selectedChannelFilter,
  setSelectedChannelFilter, selectedDurationFilter, setSelectedDurationFilter,
  selectedDateFilter, setSelectedDateFilter, selectedTimeFilter,
  setSelectedTimeFilter, selectedStatusFilter, setSelectedStatusFilter,
  channels, monitorFilter, setMonitorFilter, searchQuery, setSearchQuery,
  channelRef, showChannelSettings, newChannelTitle, setNewChannelTitle,
  newChannelId, setNewChannelId, handleAddChannel, editingChannelId,
  setEditingChannelId, editChannelTitle, setEditChannelTitle, editChannelValue,
  setEditChannelValue, handleSaveChannel, removeChannel, handleMarkAllRead,
  toggleAutoProcess, toggleAutoDownload, fetchVideos, isFetching, monitorRef,
  showMonitorSettings, showVoiceSettings, isVoiceEnabled, toggleVoice, voices,
  selectedVoiceURI, selectVoice, announce, isSpeaking, apiRef, showApiSettings,
  apiKeys, newApiLabel, setNewApiLabel, newApiKey, setNewApiKey, handleAddKey,
  editingApiKeyId, setEditingApiKeyId, editApiLabel, setEditApiLabel,
  editApiValue, setEditApiValue, handleSaveApiKey, removeApiKey, recentVideos,
  oldVideos, handleSelectAll, handleBulkDownload, handleBulkMarkRead,
  handleBulkStart, handleBulkStop, handleBulkClearDownload, handleBulkDelete,
  onClose
}) => {
  return (
    <header className={`flex flex-col border-b shrink-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex flex-wrap items-center justify-between px-4 md:px-6 py-3 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className={`md:hidden p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`p-2 rounded-full ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
              <Youtube className={`w-6 h-6 ${isDark ? 'text-red-500' : 'text-red-600'}`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold font-stylish-bn ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>ভিডিও মনিটর</h1>
              <p className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Wifi className="w-3 h-3 text-green-500" /> 
                {(() => {
                  const unreadVideos = queueState.queue.filter(v => !v.isRead);
                  if (unreadVideos.length > 0) {
                    const latestVideo = unreadVideos.reduce((latest, current) => 
                      new Date(current.publishedAt).getTime() > new Date(latest.publishedAt).getTime() ? current : latest
                    );
                    return appLang === 'bn' 
                      ? `${getRelativeTime(latestVideo.publishedAt, appLang)} ${toBengaliNumber(unreadVideos.length)}টি নতুন ভিডিও এসেছে`
                      : `${unreadVideos.length} new video${unreadVideos.length > 1 ? 's' : ''} arrived ${getRelativeTime(latestVideo.publishedAt, appLang)}`;
                  }
                  return appLang === 'bn' ? 'কোন নতুন ভিডিও নেই' : 'No new videos';
                })()}
              </p>
            </div>
          </div>
        </div>
          
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`md:hidden p-2 rounded-xl transition-all border ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
        >
          <List className="w-5 h-5" />
        </button>

        <div className={`${isMobileMenuOpen ? 'absolute top-16 right-4 w-[calc(100vw-2rem)] sm:w-80 flex flex-row flex-wrap gap-2 p-3 rounded-2xl shadow-2xl z-[70] border overflow-y-auto max-h-[80vh] ' + (isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200') : 'hidden md:flex items-center gap-3 flex-wrap'}`}>
          <button 
            onClick={() => setIsLinkModalOpen(true)}
              className={`p-2 md:px-4 md:py-2 border rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                isDark 
                  ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <LinkIcon className="w-4 h-4" /> <span className="hidden md:inline">{appLang === 'bn' ? 'লিংক' : 'Links'}</span>
            </button>

            <button 
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                clearSelection();
              }}
              className={`p-2 md:px-4 md:py-2 border rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                isSelectMode 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : isDark 
                    ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> <span className="hidden md:inline">{appLang === 'bn' ? (isSelectMode ? 'সিলেক্ট মুড অফ' : 'সিলেক্ট মুড অন') : (isSelectMode ? 'Select Mode Off' : 'Select Mode On')}</span>
            </button>

            {isSelectMode && selectedIds.length > 0 && (
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
            )}

            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu);
                  setShowChannelSettings(false);
                  setShowApiSettings(false);
                }}
                className={`p-2 border rounded-lg transition-colors cursor-pointer relative group ${
                  showFilterMenu 
                    ? (isDark ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600') 
                    : (isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600')
                }`}
              >
                <Filter className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {(selectedChannelFilter !== 'all' || selectedDurationFilter !== 'all' || selectedDateFilter !== 'all' || selectedTimeFilter !== 'all' || selectedStatusFilter !== 'all') && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <MonitorFilterMenu
                showFilterMenu={showFilterMenu}
                selectedChannelFilter={selectedChannelFilter}
                setSelectedChannelFilter={setSelectedChannelFilter}
                selectedDurationFilter={selectedDurationFilter}
                setSelectedDurationFilter={setSelectedDurationFilter}
                selectedDateFilter={selectedDateFilter}
                setSelectedDateFilter={setSelectedDateFilter}
                selectedTimeFilter={selectedTimeFilter}
                setSelectedTimeFilter={setSelectedTimeFilter}
                selectedStatusFilter={selectedStatusFilter}
                setSelectedStatusFilter={setSelectedStatusFilter}
                channels={channels}
                isDark={isDark}
              />
            </div>
            
            <div className={`flex p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <button 
                onClick={() => setMonitorFilter('all')}
                title={appLang === 'bn' ? 'সব ভিডিও' : 'All Videos'}
                className={`p-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  monitorFilter === 'all' 
                    ? (isDark ? 'bg-gray-700 shadow-sm text-gray-100' : 'bg-white shadow-sm text-gray-900') 
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMonitorFilter('unread')}
                title={appLang === 'bn' ? 'নতুন ভিডিও' : 'New Videos'}
                className={`p-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  monitorFilter === 'unread' 
                    ? (isDark ? 'bg-gray-700 shadow-sm text-gray-100' : 'bg-white shadow-sm text-gray-900') 
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMonitorFilter('archive')}
                title={appLang === 'bn' ? 'পুরাতন ভিডিও' : 'Old Videos'}
                className={`p-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  monitorFilter === 'archive' 
                    ? (isDark ? 'bg-gray-700 shadow-sm text-gray-100' : 'bg-white shadow-sm text-gray-900') 
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
                }`}
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative w-full md:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="ভিডিও খুঁজুন..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 pr-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`} 
              />
            </div>
            
            <div className="relative" ref={channelRef}>
              <button 
                onClick={() => {
                  setShowChannelSettings(!showChannelSettings);
                  setShowApiSettings(false);
                  setShowFilterMenu(false);
                }}
                className={`p-2 border rounded-lg transition-colors cursor-pointer group ${
                  showChannelSettings 
                    ? (isDark ? 'bg-purple-900/30 border-purple-800 text-purple-400' : 'bg-purple-100 border-purple-300 text-purple-700') 
                    : (isDark ? 'border-purple-900/50 hover:bg-purple-900/30 text-purple-400 bg-purple-900/10' : 'border-purple-200 hover:bg-purple-100 text-purple-600 bg-purple-50')
                }`}
                title={appLang === 'bn' ? 'চ্যানেল যোগ করুন' : 'Add Channel'}
              >
                <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              
              <ChannelSettings
                isOpen={showChannelSettings}
                onClose={() => setShowChannelSettings(false)}
                appLang={appLang}
                channels={channels}
                newChannelTitle={newChannelTitle}
                setNewChannelTitle={setNewChannelTitle}
                newChannelId={newChannelId}
                setNewChannelId={setNewChannelId}
                handleAddChannel={handleAddChannel}
                editingChannelId={editingChannelId}
                setEditingChannelId={setEditingChannelId}
                editChannelTitle={editChannelTitle}
                setEditChannelTitle={setEditChannelTitle}
                editChannelValue={editChannelValue}
                setEditChannelValue={setEditChannelValue}
                handleSaveChannel={handleSaveChannel}
                removeChannel={removeChannel}
              />
            </div>
            
            <button 
              onClick={handleMarkAllRead}
              className={`p-2 border rounded-lg transition-colors cursor-pointer group ${
                isDark 
                  ? 'border-green-900/50 hover:bg-green-900/30 text-green-400 bg-green-900/10' 
                  : 'border-green-200 hover:bg-green-100 text-green-600 bg-green-50'
              }`}
              title={appLang === 'bn' ? 'সবগুলো পঠিত মার্ক করুন' : 'Mark All Read'}
            >
              <CheckSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            
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

            <div className="relative" ref={monitorRef}>
              <button 
                onClick={() => {
                  setShowMonitorSettings(!showMonitorSettings);
                  setShowApiSettings(false);
                  setShowChannelSettings(false);
                  setShowFilterMenu(false);
                }} 
                className={`p-2 border rounded-lg transition-colors cursor-pointer group ${
                  showMonitorSettings 
                    ? (isDark ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-600') 
                    : (isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600')
                }`}
                title={appLang === 'bn' ? 'ডাউনলোড সেটিংস' : 'Download Settings'}
              >
                <Headphones className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              
              <MonitorSettings
                isOpen={showMonitorSettings}
                onClose={() => setShowMonitorSettings(false)}
                appLang={appLang}
                isDark={isDark}
              />
            </div>

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

            <div className="relative" ref={apiRef}>
              <button 
                onClick={() => {
                  setShowApiSettings(!showApiSettings);
                  setShowMonitorSettings(false);
                  setShowChannelSettings(false);
                  setShowFilterMenu(false);
                }} 
                className={`p-2 border rounded-lg transition-colors cursor-pointer group ${
                  showApiSettings 
                    ? (isDark ? 'bg-indigo-900/30 border-indigo-800 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600') 
                    : (isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600')
                }`}
                title={appLang === 'bn' ? 'ইউটিউব এপিআই সেটিংস' : 'YouTube API Settings'}
              >
                <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              
              <ApiSettings
                isOpen={showApiSettings}
                onClose={() => setShowApiSettings(false)}
                appLang={appLang}
                apiKeys={apiKeys}
                newApiLabel={newApiLabel}
                setNewApiLabel={setNewApiLabel}
                newApiKey={newApiKey}
                setNewApiKey={setNewApiKey}
                handleAddKey={handleAddKey}
                editingApiKeyId={editingApiKeyId}
                setEditingApiKeyId={setEditingApiKeyId}
                editApiLabel={editApiLabel}
                setEditApiLabel={setEditApiLabel}
                editApiValue={editApiValue}
                setEditApiValue={setEditApiValue}
                handleSaveApiKey={handleSaveApiKey}
                removeApiKey={removeApiKey}
                isDark={isDark}
              />
            </div>
          </div>
      </div>

      {/* Bulk Action Bar */}
      <MonitorBulkActions
        isSelectMode={isSelectMode}
        selectedIds={selectedIds}
        recentVideos={recentVideos}
        oldVideos={oldVideos}
        appLang={appLang}
        handleSelectAll={handleSelectAll}
        handleClearSelection={clearSelection}
        handleBulkDownload={handleBulkDownload}
        handleBulkMarkRead={handleBulkMarkRead}
        handleBulkStart={handleBulkStart}
        handleBulkStop={handleBulkStop}
        handleBulkClearDownload={handleBulkClearDownload}
        handleBulkDelete={handleBulkDelete}
      />
    </header>
  );
};
