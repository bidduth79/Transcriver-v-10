import React from 'react';
import { SummaryModal } from '../../../components/modals/SummaryModal';
import { ReportModal } from '../../../components/modals/ReportModal';
import { FullscreenAnalysis } from '../../../components/modals/FullscreenAnalysis';
import { SpeakerProfileSidebar } from '../../../components/modals/SpeakerProfileSidebar';

export const TranscriptModals = ({
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
  renderFormattedTranscriptInternal,
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
        renderFormattedTranscript={(text) => renderFormattedTranscriptInternal(text, searchTerm, isDark, currentMatchIndex, sensitiveMatches, onSeek, openProfile)}
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
        error={speakerError}
        onRefresh={refreshProfile}
        onUpdateCustomNote={updateCustomNote}
        onSeek={onSeek}
      />
    </>
  );
};
