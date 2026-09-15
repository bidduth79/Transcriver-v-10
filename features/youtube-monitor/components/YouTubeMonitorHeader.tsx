import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Youtube, Wifi, List, Link as LinkIcon, LayoutGrid, Download, Play, Square, 
  CheckCircle2, Trash2, Filter, Sparkles, Clock, Search, CheckSquare, Bot, 
  RefreshCw, Headphones, Volume2, Settings, Loader2, ArrowLeft
} from 'lucide-react';
import { YouTubeChannel, YouTubeApiKey, YouTubeVideo, QueueState } from '../../../types/youtube';
import { getRelativeTime, toBengaliNumber } from '../utils/formatters';
import { MonitorBulkActions } from './MonitorBulkActions';
import { YouTubeMonitorHeaderControls } from './YouTubeMonitorHeaderControls';
import { YouTubeMonitorHeaderControlsProps } from '../types';

interface YouTubeMonitorHeaderProps extends YouTubeMonitorHeaderControlsProps {
  recentVideos: YouTubeVideo[];
  oldVideos: YouTubeVideo[];
  handleSelectAll: (videos: YouTubeVideo[]) => void;
  onClose: () => void;
}

export const YouTubeMonitorHeader: React.FC<YouTubeMonitorHeaderProps> = ({
  isDark, appLang, queueState, isMobileMenuOpen, setIsMobileMenuOpen,
  isLinkModalOpen, setIsLinkModalOpen, isSelectMode, setIsSelectMode,
  clearSelection, selectedIds, filterRef, showFilterMenu,
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

        <YouTubeMonitorHeaderControls 
          isDark={isDark} appLang={appLang} queueState={queueState} 
          isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
          isLinkModalOpen={isLinkModalOpen} setIsLinkModalOpen={setIsLinkModalOpen} 
          isSelectMode={isSelectMode} 
          setIsSelectMode={setIsSelectMode} clearSelection={clearSelection} 
          selectedIds={selectedIds} filterRef={filterRef} showFilterMenu={showFilterMenu}
          setShowFilterMenu={setShowFilterMenu} setShowChannelSettings={setShowChannelSettings}
          setShowApiSettings={setShowApiSettings} setShowMonitorSettings={setShowMonitorSettings} 
          setShowVoiceSettings={setShowVoiceSettings} selectedChannelFilter={selectedChannelFilter} 
          setSelectedChannelFilter={setSelectedChannelFilter} selectedDurationFilter={selectedDurationFilter}
          setSelectedDurationFilter={setSelectedDurationFilter} selectedDateFilter={selectedDateFilter}
          setSelectedDateFilter={setSelectedDateFilter} selectedTimeFilter={selectedTimeFilter}
          setSelectedTimeFilter={setSelectedTimeFilter} selectedStatusFilter={selectedStatusFilter}
          setSelectedStatusFilter={setSelectedStatusFilter} channels={channels}
          monitorFilter={monitorFilter} setMonitorFilter={setMonitorFilter}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery} channelRef={channelRef}
          showChannelSettings={showChannelSettings} newChannelTitle={newChannelTitle}
          setNewChannelTitle={setNewChannelTitle} newChannelId={newChannelId} 
          setNewChannelId={setNewChannelId} handleAddChannel={handleAddChannel} 
          editingChannelId={editingChannelId} setEditingChannelId={setEditingChannelId}
          editChannelTitle={editChannelTitle} setEditChannelTitle={setEditChannelTitle} 
          editChannelValue={editChannelValue} setEditChannelValue={setEditChannelValue}
          handleSaveChannel={handleSaveChannel} removeChannel={removeChannel} 
          handleMarkAllRead={handleMarkAllRead} toggleAutoProcess={toggleAutoProcess} 
          toggleAutoDownload={toggleAutoDownload} fetchVideos={fetchVideos}
          isFetching={isFetching} monitorRef={monitorRef} showMonitorSettings={showMonitorSettings}
          showVoiceSettings={showVoiceSettings} isVoiceEnabled={isVoiceEnabled} 
          toggleVoice={toggleVoice} voices={voices} selectedVoiceURI={selectedVoiceURI} 
          selectVoice={selectVoice} announce={announce} isSpeaking={isSpeaking}
          apiRef={apiRef} showApiSettings={showApiSettings} apiKeys={apiKeys} 
          newApiLabel={newApiLabel} setNewApiLabel={setNewApiLabel} newApiKey={newApiKey}
          setNewApiKey={setNewApiKey} handleAddKey={handleAddKey} editingApiKeyId={editingApiKeyId}
          setEditingApiKeyId={setEditingApiKeyId} editApiLabel={editApiLabel} 
          setEditApiLabel={setEditApiLabel} editApiValue={editApiValue}
          setEditApiValue={setEditApiValue} handleSaveApiKey={handleSaveApiKey} 
          removeApiKey={removeApiKey} handleBulkDownload={handleBulkDownload}
          handleBulkMarkRead={handleBulkMarkRead} handleBulkStart={handleBulkStart}
          handleBulkStop={handleBulkStop} handleBulkClearDownload={handleBulkClearDownload}
          handleBulkDelete={handleBulkDelete}
        />
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
