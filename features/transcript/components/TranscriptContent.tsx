import React from 'react';
import { TranscriptViewer } from '../TranscriptViewer';

export const TranscriptContent = ({
  fontSize,
  isDark,
  t,
  activeTranscriptSourceMeta,
  appLang,
  transcriptSegments,
  audioCurrentTime,
  searchTerm,
  currentMatchIndex,
  isSynced,
  isKaraokeEnabled,
  transcript,
  sensitiveMatches,
  onSeek,
  openProfile,
  onRenameSpeaker,
  transcriptEndRef
}) => {
  return (
    <div style={{ fontSize: `${fontSize}px` }} className={`font-sans leading-relaxed text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
        {/* HEADER SECTION */}
        <div className={`mb-8 pb-6 border-b text-center ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <h1 className={`text-2xl md:text-3xl font-black mb-3 leading-tight break-words text-balance mx-auto max-w-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {activeTranscriptSourceMeta?.name?.replace(/\.[^/.]+$/, "")?.replace(/_/g, ' ')?.replace(/#/g, '')?.replace(/\s+/g, ' ')?.trim() || t.transcript}
          </h1>
          <div className={`flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {activeTranscriptSourceMeta?.channelName && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                <span>{activeTranscriptSourceMeta.channelName}</span>
              </div>
            )}
            {activeTranscriptSourceMeta?.date && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>{new Date(activeTranscriptSourceMeta.date).toLocaleDateString(appLang === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            {activeTranscriptSourceMeta?.duration && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>{activeTranscriptSourceMeta.duration}</span>
              </div>
            )}
          </div>
        </div>

        {/* 
           CRITICAL FIX: 
           Check if transcriptSegments has items. If not (meaning timestamps missing or parsing failed),
           fallback to renderFormattedTranscriptInternal instead of showing a blank synced view.
        */}
        <TranscriptViewer
          transcriptSegments={transcriptSegments}
          audioCurrentTime={audioCurrentTime}
          fontSize={fontSize}
          isDark={isDark}
          searchTerm={searchTerm}
          currentMatchIndex={currentMatchIndex}
          isSynced={isSynced}
          isKaraokeEnabled={isKaraokeEnabled}
          transcript={transcript}
          sensitiveMatches={sensitiveMatches}
          onSeek={onSeek}
          onSpeakerClick={openProfile}
          onRenameSpeaker={onRenameSpeaker}
        />
        <div ref={transcriptEndRef} />
    </div>
  );
};
