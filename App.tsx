import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

// Expose Swal to window for inline onclick handlers in HTML strings
(window as any).Swal = Swal;

import { GoogleGenAI } from "@google/genai";
import { Header } from './components/layout/Header';
import { Sidebar } from './features/sidebar/Sidebar';
import { ExpandedHistory } from './features/sidebar/ExpandedHistory';
import { TranscriptOutput } from './features/transcript/TranscriptOutput';
import { Footer } from './components/layout/Footer';
import { InteractiveDotBackground } from './components/layout/Background';
import { AppModalsContainer } from './AppModalsContainer';
import { YouTubeMonitor } from './features/youtube-monitor/components/YouTubeMonitor';
import { getActiveProvider, incrementTotalCalls, getTotalCalls } from './services/ApiKeyManager';
import { useTranscription } from './hooks/useTranscription';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useHistory } from './hooks/useHistory';
import { useTranscriptSearch } from './hooks/useTranscriptSearch';
import { useTransformTranscript } from './hooks/useTransformTranscript';
import { useApiStats } from './hooks/useApiStats';
import { useAppTheme } from './hooks/useAppTheme';
import { useAppModals } from './hooks/useAppModals';
import { useBatchProcessor } from './hooks/useBatchProcessor';
import { translations } from './translations';
import { useToast } from './hooks/useToast';
import { loadAudioFromStore, playSuccessSound } from './utils/audioUtils';
import { useFileHandler } from './hooks/useFileHandler';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useAppEventListeners } from './hooks/useAppEventListeners';
import { useAppCore } from './hooks/useAppCore';
import { 
  getSidebarProps, 
  getAppModalsProps, 
  getExpandedHistoryProps, 
  getYouTubeMonitorProps, 
  getTranscriptOutputProps 
} from './hooks/useAppProps';

const App: React.FC = () => {
  const core = useAppCore();

  return (
    <div className={`flex h-screen overflow-hidden ${core.mainBgColor} ${core.textColor} font-sans selection:bg-indigo-500/30 ${core.isExtendedPause ? 'shadow-[inset_0_0_80px_rgba(239,68,68,0.6)] animate-pulse transition-all duration-500' : ''}`}>
      <InteractiveDotBackground isDark={core.isDark} />
      <div className="relative flex h-screen w-full">
        {/* Sidebar */}
        <Sidebar {...getSidebarProps(core)} />

        {/* Sidebar Toggle Arrow - Hidden on Mobile to avoid overlay issues */}
        <button
          onClick={() => core.setIsSidebarOpen(!core.isSidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 z-50 w-5 h-24 bg-indigo-600 border border-l-0 border-white/20 rounded-r-lg flex items-center justify-center transition-all duration-500 shadow-xl cursor-pointer hover:bg-indigo-500 group hidden md:flex ${core.isSidebarOpen ? 'left-[400px]' : 'left-0'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          title={core.isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <svg 
            className={`w-3 h-3 text-white transition-transform duration-500 ${core.isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300">
          <Header 
            t={core.t}
            status={core.status}
            isSidebarOpen={core.isSidebarOpen}
            setIsSidebarOpen={core.setIsSidebarOpen}
            isInformationOpen={core.isInformationOpen}
            setIsInformationOpen={core.setIsInformationOpen}
            isActivityLogOpen={core.isActivityLogOpen}
            setIsActivityLogOpen={core.setIsActivityLogOpen}
            isDark={core.isDark}
            setTheme={(v: any) => core.setTheme(typeof v === 'function' ? v(core.theme) : v)}
            appLang={core.appLang}
            setAppLang={(v: any) => core.setAppLang(typeof v === 'function' ? v(core.appLang) : v)}
            activeColors={core.activeColors}
            setActiveTool={(tool: any) => {
              core.setActiveTool((prev: any) => prev === tool ? null : tool);
            }}
            setIsReportOpen={core.setIsReportOpen}
            setIsSettingsOpen={core.setIsSettingsOpen}
            transcriptionMode={core.transcriptionMode}
            setTranscriptionMode={core.setTranscriptionMode}
          />

          <div className="flex-1 flex flex-col relative overflow-hidden">
            {core.isExtendedPause && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
                <div className="text-red-500 text-[12rem] font-black leading-none animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                  {core.batchCountdown}
                </div>
                <div className="text-white text-2xl font-medium mt-8 tracking-wide animate-pulse">
                  {(core.t as any).rateLimitPause || "Waiting for API rate limit..."}
                </div>
              </div>
            )}
            
            <YouTubeMonitor {...getYouTubeMonitorProps(core)} />
            <TranscriptOutput {...getTranscriptOutputProps(core)} />
          </div>
          <Footer 
            isDark={core.isDark} 
            appLang={core.appLang} 
            t={core.t} 
            activeColors={core.activeColors}
            activeApiKeySource={core.activeApiKeySource}
            activeModelName={core.activeModelName}
            totalApiCalls={core.totalApiCalls}
            isAiLoading={core.isAiLoading}
            onKeyUpdate={core.updateApiStats}
            onOpenSettings={() => core.setIsSettingsOpen(true)}
          />
        </div>
      </div>

      <AppModalsContainer {...getAppModalsProps(core)} />
      {core.isHistoryFullscreen && (
        <ExpandedHistory {...getExpandedHistoryProps(core)} />
      )}
    </div>
  );
};

export default App;
