import React from 'react';
import { SummaryModal } from '../../../components/modals/SummaryModal';
import { ReportModal } from '../../../components/modals/ReportModal';
import { FullscreenAnalysis } from '../../../components/modals/FullscreenAnalysis';
import { SpeakerProfileSidebar } from '../../../components/modals/SpeakerProfileSidebar';

import { FileMeta, HistoryItem } from '../../../types';

export interface TranscriptModalsProps {
  isSummaryOpen: boolean;
  setIsSummaryOpen: (isOpen: boolean) => void;
  isReportOpen: boolean;
  setIsReportOpen: (isOpen: boolean) => void;
  isAnalysisOpen: boolean;
  setIsAnalysisOpen: (isOpen: boolean) => void;
  isSpeakerProfileOpen: boolean;
  closeProfile: () => void;
  speakerName: string;
  speakerProfile: any;
  isSpeakerLoading: boolean;
  speakerError: string | null;
  refreshProfile: (speakerId: string) => void;
  updateCustomNote: (note: any) => void;
  transcript: string;
  activeColors: any;
  isDark: boolean;
  appLang: 'bn' | 'en';
  searchTerm: string;
  matchCount: number;
  fileMeta: FileMeta | null;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onSeek: (time: number) => void;
  onModelUpdate: (models: any) => void;
  setIsAiLoading: (isLoading: boolean) => void;
  history: HistoryItem[];
  FormattedTranscript: React.FC<any>;
  currentMatchIndex: number;
  sensitiveMatches: any[];
  openProfile: (speakerId: string) => void;
  setTranscript: (transcript: string) => void;
  setStatus: (status: string) => void;
}

export const TranscriptModals: React.FC<TranscriptModalsProps> = ({
  isSummaryOpen,
  setIsSummaryOpen,
  isReportOpen,
  setIsReportOpen,
  isAnalysisOpen,
  setIsAnalysisOpen,
  isSpeakerProfileOpen,
  closeProfile,
  speakerName,
  speakerProfile,
  isSpeakerLoading,
  speakerError,
  refreshProfile,
  updateCustomNote,
  transcript,
  activeColors,
  isDark,
  appLang,
  searchTerm,
  matchCount,
  fileMeta,
  addToast,
  onSeek,
  onModelUpdate,
  setIsAiLoading,
  history,
  FormattedTranscript,
  currentMatchIndex,
  sensitiveMatches,
  openProfile,
  setTranscript,
  setStatus
}) => {
  return (
    <>
      <SummaryModal 
        isOpen={isSummaryOpen} 
        onClose={() => setIsSummaryOpen(false)} 
        transcript={transcript} 
        activeColors={activeColors} 
        isDark={isDark} 
        appLang={appLang}
        searchTerm={searchTerm}
        matchCount={matchCount}
        fileMeta={fileMeta}
        addToast={addToast}
        onSeek={onSeek}
        onModelUpdate={onModelUpdate}
        setIsAiLoading={setIsAiLoading}
      />
      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        transcript={transcript} 
        activeColors={activeColors} 
        isDark={isDark} 
        appLang={appLang} 
        fileMeta={fileMeta}
        searchTerm={searchTerm}
        addToast={addToast}
        onModelUpdate={onModelUpdate}
        setIsAiLoading={setIsAiLoading}
      />
      <FullscreenAnalysis 
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        history={history}
        transcript={transcript}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        renderFormattedTranscript={(text: string) => (
          <FormattedTranscript 
            text={text} 
            searchTerm={searchTerm} 
            isDark={isDark} 
            currentMatchIndex={currentMatchIndex} 
            sensitiveMatches={sensitiveMatches} 
            onSeek={onSeek} 
            onSpeakerClick={openProfile} 
          />
        )}
        loadHistoryItem={(h) => {
          setTranscript(h.transcript);
          setStatus('completed');
          setIsAnalysisOpen(false);
          addToast(appLang === 'bn' ? "হিস্টোরি লোড হয়েছে" : "History loaded", 'info');
        }}
      />
      <SpeakerProfileSidebar 
        isOpen={isSpeakerProfileOpen}
        onClose={closeProfile}
        speakerName={speakerName}
        profile={speakerProfile}
        isLoading={isSpeakerLoading}
        error={speakerError || ''}
        onRefresh={() => refreshProfile(speakerName)}
        onUpdateCustomNote={updateCustomNote}
        onSeek={onSeek}
      />
    </>
  );
};
