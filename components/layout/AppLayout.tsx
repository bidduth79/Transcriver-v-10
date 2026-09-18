import React, { Suspense } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { InteractiveDotBackground } from './Background';
import { Sidebar } from '../../features/sidebar/Sidebar';
import { ExpandedHistory } from '../../features/sidebar/ExpandedHistory';
import { getSidebarProps, getExpandedHistoryProps } from '../../hooks/useAppProps';

interface AppLayoutProps {
  core: any;
  children: React.ReactNode;
  modals: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ core, children, modals }) => {
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
            {children}
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

      {modals}
      
      {core.isHistoryFullscreen && (
        <ExpandedHistory {...getExpandedHistoryProps(core)} />
      )}
    </div>
  );
};
