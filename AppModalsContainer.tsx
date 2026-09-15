import React from 'react';
import { InformationModal } from './components/modals/InformationModal';
import { ToolsModal } from './components/modals/ToolsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ActivityLogsModal } from './components/modals/ActivityLogsModal';
import { TranscriberReportModal } from './components/reports/TranscriberReportModal';
import { SuccessModal } from './components/modals/SuccessModal'; 
import { BatchSummaryModal } from './components/modals/BatchSummaryModal';

interface AppModalsContainerProps {
  isInformationOpen: boolean;
  setIsInformationOpen: (v: boolean) => void;
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  isToolsMinimized: boolean;
  setIsToolsMinimized: (v: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  isActivityLogOpen: boolean;
  setIsActivityLogOpen: (v: boolean) => void;
  isReportOpen: boolean;
  setIsReportOpen: (v: boolean) => void;
  showSuccessModal: boolean;
  setShowSuccessModal: (v: boolean) => void;
  isBatchSummaryOpen: boolean;
  setIsBatchSummaryOpen: (v: boolean) => void;
  processedCount: number;
  failedFiles: any[];
  retryFailedFiles: () => void;
  elapsedSeconds: number;
  isDark: boolean;
  activeColors: any;
  appLang: 'bn' | 'en';
  addToast: (msg: string, type: any) => void;
  handleFileChange: (e: any, fromModal?: boolean) => void;
}

export const AppModalsContainer: React.FC<AppModalsContainerProps> = ({
  isInformationOpen, setIsInformationOpen,
  activeTool, setActiveTool,
  isToolsMinimized, setIsToolsMinimized,
  isSettingsOpen, setIsSettingsOpen,
  isActivityLogOpen, setIsActivityLogOpen,
  isReportOpen, setIsReportOpen,
  showSuccessModal, setShowSuccessModal,
  isBatchSummaryOpen, setIsBatchSummaryOpen,
  processedCount, failedFiles, retryFailedFiles,
  elapsedSeconds,
  isDark, activeColors, appLang, addToast,
  handleFileChange
}) => {
  return (
    <>
      <InformationModal 
        isOpen={isInformationOpen}
        onClose={() => setIsInformationOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        addToast={addToast}
      />

      <ToolsModal 
        activeTool={activeTool === 'youtube_monitor' ? null : activeTool}
        onClose={() => setActiveTool(null)}
        isMinimized={isToolsMinimized}
        setIsMinimized={setIsToolsMinimized}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        addToast={addToast}
        onFileSelect={(f) => handleFileChange({ target: { files: [f] } }, true)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        addToast={addToast}
      />

      <ActivityLogsModal 
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
      />

      <TranscriberReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
      />

      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        elapsedSeconds={elapsedSeconds} 
        appLang={appLang} 
      />

      <BatchSummaryModal 
        isOpen={isBatchSummaryOpen}
        onClose={() => setIsBatchSummaryOpen(false)}
        processedCount={processedCount}
        failedFiles={failedFiles}
        onRetryFailed={retryFailedFiles}
        appLang={appLang}
        isDark={isDark}
        activeColors={activeColors}
      />
    </>
  );
};
