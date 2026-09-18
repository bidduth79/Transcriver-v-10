import React, { lazy, Suspense } from 'react';

import { TranscriptOutput } from './features/transcript/TranscriptOutput';
import { AppLayout } from './components/layout/AppLayout';
const AppModalsContainer = lazy(() => import('./AppModalsContainer').then(module => ({ default: module.AppModalsContainer })));
const YouTubeMonitor = lazy(() => import('./features/youtube-monitor/components/YouTubeMonitor').then(module => ({ default: module.YouTubeMonitor })));
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
    <AppLayout 
      core={core}
      modals={
        <Suspense fallback={null}>
          <AppModalsContainer {...getAppModalsProps(core)} />
        </Suspense>
      }
    >
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
      
      <Suspense fallback={null}>
        <YouTubeMonitor {...getYouTubeMonitorProps(core)} />
      </Suspense>
      
      <TranscriptOutput {...getTranscriptOutputProps(core)} />
    </AppLayout>
  );
};

export default App;
