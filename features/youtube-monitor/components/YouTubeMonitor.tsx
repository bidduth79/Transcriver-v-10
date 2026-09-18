import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Youtube, Key, Play, Pause, Plus, Trash2, RefreshCw, Loader2, 
  Wifi, Filter, Search, SortDesc, CheckSquare, LayoutGrid, Square, CheckCircle2,
  Calendar, Clock, Download, ChevronDown, Video, Headphones, Settings, Copy, Bot, Volume2, Sparkles, List, Link as LinkIcon
} from 'lucide-react';
import { YouTubeDownloadQueue } from './YouTubeDownloadQueue';
import { ChannelSettings } from './ChannelSettings';
import { ApiSettings } from './ApiSettings';
import { MonitorSettings } from './MonitorSettings';
import { MonitorVideoSection } from './MonitorVideoSection';
import { YouTubeMonitorMainContent } from './YouTubeMonitorMainContent';
import { MonitorBulkActions } from './MonitorBulkActions';
import { MonitorFilterMenu } from './MonitorFilterMenu';
import { YouTubeMonitorHeader } from './YouTubeMonitorHeader';
import { YouTubeLinkModal } from './YouTubeLinkModal';
import { YouTubeReportModal } from './YouTubeReportModal';
import { useYouTubeMonitorOrchestrator } from '../hooks/useYouTubeMonitorOrchestrator';
import { toBengaliNumber } from '../utils/formatters';

interface YouTubeMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeColors: any;
  appLang: 'en' | 'bn';
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onLoadTranscript?: (transcript: string, title: string, duration: string | number, historyId?: string, channelName?: string, date?: string, videoId?: string) => void | Promise<void>;
  onStartTranscription?: (file: Blob, metadata: { name: string, duration: string, size?: string, type?: string, channelName?: string, date?: string }, isAutoProcess?: boolean) => Promise<string | undefined>;
  isAppProcessing?: boolean;
}

export const YouTubeMonitor: React.FC<YouTubeMonitorProps> = ({
  isOpen,
  onClose,
  isDark,
  activeColors,
  appLang,
  addToast,
  onLoadTranscript,
  onStartTranscription,
  isAppProcessing = false
}) => {
  const {
    headerProps, statusBannerProps, mainContentProps, linkModalProps, reportModalProps, refs, showSettings
  } = useYouTubeMonitorOrchestrator(appLang, addToast, isAppProcessing, onStartTranscription, onLoadTranscript);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettings.showFilterMenu && refs.filterRef.current && !refs.filterRef.current.contains(event.target as Node)) {
        showSettings.setShowFilterMenu(false);
      }
      if (showSettings.showChannelSettings && refs.channelRef.current && !refs.channelRef.current.contains(event.target as Node)) {
        showSettings.setShowChannelSettings(false);
      }
      if (showSettings.showMonitorSettings && refs.monitorRef.current && !refs.monitorRef.current.contains(event.target as Node)) {
        showSettings.setShowMonitorSettings(false);
      }
      if (showSettings.showApiSettings && refs.apiRef.current && !refs.apiRef.current.contains(event.target as Node)) {
        showSettings.setShowApiSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings, refs.filterRef, refs.channelRef, refs.monitorRef, refs.apiRef]);

  return (
    <motion.div
      initial={false}
      animate={{ 
        opacity: isOpen ? 1 : 0, 
        y: isOpen ? 0 : 20,
        pointerEvents: isOpen ? 'auto' : 'none',
        zIndex: isOpen ? 50 : -10
      }}
      className={`absolute inset-0 flex flex-col overflow-hidden ${isOpen ? (isDark ? 'bg-gray-900/40 backdrop-blur-sm' : 'bg-[#F8F9FA]/40 backdrop-blur-sm') : ''}`}
    >
          {/* Header */}
        <YouTubeMonitorHeader
          onClose={onClose}
          isDark={isDark}
          {...headerProps}
        />

        {/* Status Banner */}
        <AnimatePresence>
          {(statusBannerProps.queueState.isAutoProcess || statusBannerProps.queueState.isAutoDownload) && (statusBannerProps.countdown !== null || statusBannerProps.currentAction) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`border-b overflow-hidden ${isDark ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100'}`}
            >
              <div className="px-6 py-2 flex items-center justify-center gap-3">
                {statusBannerProps.countdown !== null ? (
                  <>
                    <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      {appLang === 'bn' ? `পরবর্তী ভিডিওর জন্য অপেক্ষা করুন: ${toBengaliNumber(statusBannerProps.countdown)} সেকেন্ড...` : `Waiting for next video: ${statusBannerProps.countdown} seconds...`}
                    </span>
                  </>
                ) : (
                  <>
                    <Bot className={`w-4 h-4 animate-pulse ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      {statusBannerProps.currentAction}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <YouTubeMonitorMainContent
          isDark={isDark}
          {...mainContentProps}
        />

        {/* Link Modal */}
        <YouTubeLinkModal
          isOpen={linkModalProps.isLinkModalOpen}
          onClose={() => linkModalProps.setIsLinkModalOpen(false)}
          isDark={isDark}
          {...linkModalProps}
        />

        {/* Report Modal */}
        {reportModalProps.showReportModal && (
          <YouTubeReportModal
            isOpen={reportModalProps.showReportModal}
            onClose={() => reportModalProps.setShowReportModal(false)}
            isDark={isDark}
            {...reportModalProps}
          />
        )}

        </motion.div>
  );
};

