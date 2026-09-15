import React from 'react';
import { 
  Youtube, Wifi, List, Link as LinkIcon, LayoutGrid, Download, Play, Square, 
  CheckCircle2, Trash2, Filter, Sparkles, Clock, Search, CheckSquare, Bot, 
  RefreshCw, Headphones, Volume2, Settings, Loader2 
} from 'lucide-react';
import { YouTubeChannel, YouTubeApiKey, YouTubeVideo, QueueState } from '../../../types/youtube';
import { MonitorFilterMenu } from './MonitorFilterMenu';
import { ChannelSettings } from './ChannelSettings';
import { MonitorSettings } from './MonitorSettings';
import { ApiSettings } from './ApiSettings';
import { MonitorVoiceSettings } from './MonitorVoiceSettings';
import { MonitorAutomationActions } from './MonitorAutomationActions';
import { MonitorStatusFilters } from './MonitorStatusFilters';
import { MonitorSelectActions } from './MonitorSelectActions';
import { YouTubeMonitorHeaderControlsProps } from '../types';


export const YouTubeMonitorHeaderControls: React.FC<YouTubeMonitorHeaderControlsProps> = ({
  isDark, appLang, queueState, isMobileMenuOpen,
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
  editApiValue, setEditApiValue, handleSaveApiKey, removeApiKey,
  handleBulkDownload, handleBulkMarkRead, handleBulkStart, handleBulkStop, 
  handleBulkClearDownload, handleBulkDelete
}) => {
  return (
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

      <MonitorSelectActions 
        isDark={isDark}
        appLang={appLang}
        isSelectMode={isSelectMode}
        selectedIds={selectedIds}
        handleBulkDownload={handleBulkDownload}
        handleBulkStart={handleBulkStart}
        handleBulkStop={handleBulkStop}
        handleBulkClearDownload={handleBulkClearDownload}
        handleBulkMarkRead={handleBulkMarkRead}
        handleBulkDelete={handleBulkDelete}
      />

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
      
      <MonitorStatusFilters 
        isDark={isDark}
        appLang={appLang}
        monitorFilter={monitorFilter}
        setMonitorFilter={setMonitorFilter}
      />
      
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
      
      <MonitorAutomationActions 
        isDark={isDark}
        appLang={appLang}
        queueState={queueState}
        toggleAutoProcess={toggleAutoProcess}
        toggleAutoDownload={toggleAutoDownload}
        fetchVideos={fetchVideos}
        isFetching={isFetching}
      />

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

      <MonitorVoiceSettings 
        isDark={isDark}
        appLang={appLang}
        showVoiceSettings={showVoiceSettings}
        setShowVoiceSettings={setShowVoiceSettings}
        setShowApiSettings={setShowApiSettings}
        setShowMonitorSettings={setShowMonitorSettings}
        setShowChannelSettings={setShowChannelSettings}
        setShowFilterMenu={setShowFilterMenu}
        isVoiceEnabled={isVoiceEnabled}
        toggleVoice={toggleVoice}
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        selectVoice={selectVoice}
        announce={announce}
        isSpeaking={isSpeaking}
      />

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
  );
};
