import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranscriptFormatter } from './hooks/useTranscriptFormatter.tsx';

// Robust Regex Escaping
export const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const FormattedTranscript = ({
  text,
  searchTerm,
  isDark,
  currentMatchIndex,
  sensitiveMatches = [],
  onSeek,
  onSpeakerClick,
  onRenameSpeaker
}: any) => {
  const matchIndexRef = useRef(0);
  
  // Use the hook safely inside this component
  const { formatText } = useTranscriptFormatter(searchTerm, isDark, currentMatchIndex, sensitiveMatches);

  // CRITICAL: Reset match index on every render to ensure consistent IDs (match-0, match-1, etc.)
  matchIndexRef.current = 0;

  if (!text) return null;

  return text.split('\n').map((line: string, i: number) => {
    // Extract timestamp if it exists at the beginning of the line
    const timestampMatch = line.match(/^[\*\_\[\(\s]*((?:\d{1,2}:)?\d{1,2}:\d{2})[\*\_\]\)\s]*\s+(.*)/);
    
    let timestamp = '';
    let content = line;
    
    if (timestampMatch) {
      timestamp = `[${timestampMatch[1]}]`;
      content = timestampMatch[2];
    }

    const isProperName = (name: string) => {
      const genericNames = ['speaker', 'male', 'female', 'unknown', 'host', 'guest', 'interviewer', 'interviewee', 'announcer', 'voice', 'person'];
      const lowerName = name.toLowerCase().replace(/[^a-z]/g, '');
      for (const generic of genericNames) {
        if (lowerName.includes(generic)) return false;
      }
      if (/^\d+$/.test(lowerName)) return false;
      return true;
    };

    const parts = content.split(/(\*\*.*?\*\*)/g);
    return (
      <div key={i} style={{ contentVisibility: 'auto', containIntrinsicSize: '1.5em' }} className="mb-2 min-h-[1.5em] leading-relaxed flex items-start group">
        {timestamp && (
          <span 
            onClick={() => onSeek && onSeek(timestamp)}
            className={`text-[0.7em] font-mono mr-3 select-none px-2 py-0.5 rounded-md transition-colors mt-1 shrink-0 ${
              onSeek ? 'cursor-pointer hover:bg-indigo-500 hover:text-white' : ''
            } ${isDark ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'}`}
          >
            {timestamp}
          </span>
        )}
        <div className="flex-1">
          {parts.map((part: string, j: number) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const textInside = part.slice(2, -2);
              const hasColon = textInside.trim().endsWith(':');
              const cleanName = textInside.replace(/:$/, '').trim();
              const isGeneric = !isProperName(cleanName);
              // It's a speaker if it's a proper name OR if it ends with a colon (like Speaker 1:)
              const isProper = cleanName.split(/\s+/).length <= 4 && (!isGeneric || hasColon);
              
              if (isProper && onSpeakerClick) {
                return (
                  <span key={j} className="inline-flex items-center gap-1 group/speaker">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSpeakerClick(cleanName); }}
                      className={`hover:underline cursor-pointer transition-colors font-bold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-700 hover:text-indigo-600'}`}
                      title={`View profile: ${cleanName}`}
                    >
                      {textInside}
                    </button>
                    {onRenameSpeaker && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRenameSpeaker(cleanName); }}
                        className="opacity-0 group-hover/speaker:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-opacity"
                        title="Rename Speaker Globally"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    )}
                  </span>
                );
              }

              return <strong key={j} className={isDark ? 'text-indigo-400' : 'text-indigo-700'}>{textInside}</strong>;
            }

            const elements = formatText(part, matchIndexRef);

            return <span key={j}>{elements}</span>;
          })}
        </div>
      </div>
    );
  });
};

export const TranscriptViewer = ({
  transcriptSegments,
  audioCurrentTime,
  fontSize,
  isDark,
  searchTerm,
  currentMatchIndex,
  isSynced,
  isKaraokeEnabled,
  transcript,
  sensitiveMatches = [],
  onSeek,
  onSpeakerClick,
  onRenameSpeaker,
  scrollElementRef
}: any) => {
  const matchIndexRef = useRef(0);
  const { formatText } = useTranscriptFormatter(searchTerm, isDark, currentMatchIndex, sensitiveMatches);
  
  const isSearchActive = !!(searchTerm && searchTerm.trim());

  const virtualizer = useVirtualizer({
    count: transcriptSegments?.length || 0,
    getScrollElement: () => scrollElementRef?.current,
    estimateSize: () => 120,
    overscan: 10,
  });

  const renderSyncedTranscript = () => {
    matchIndexRef.current = 0;

    const isProperName = (name: string) => {
      const genericNames = ['speaker', 'male', 'female', 'unknown', 'host', 'guest', 'interviewer', 'interviewee', 'announcer', 'voice', 'person'];
      const lowerName = name.toLowerCase().replace(/[^a-z]/g, '');
      for (const generic of genericNames) {
        if (lowerName.includes(generic)) return false;
      }
      if (/^\d+$/.test(lowerName)) return false;
      return true;
    };

    const itemsToRender = isSearchActive
      ? transcriptSegments.map((seg: any, idx: number) => ({ index: idx, seg }))
      : virtualizer.getVirtualItems().map((v: any) => ({ index: v.index, seg: transcriptSegments[v.index], virtualRow: v }));

    return (
      <div 
        className={isSearchActive ? "space-y-4" : ""}
        style={!isSearchActive ? {
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        } : undefined}
      >
        {itemsToRender.map(({ index: idx, seg, virtualRow }: any) => {
          const isActive = audioCurrentTime >= seg.start && audioCurrentTime < seg.end;
          const hasSearchMatch = searchTerm && searchTerm.trim() && seg.text.toLowerCase().includes(searchTerm.toLowerCase());
          const hasSensitiveMatch = sensitiveMatches.some((m: string) => seg.text.toLowerCase().includes(m.toLowerCase()));
          
          const progress = isActive 
            ? Math.min(100, Math.max(0, ((audioCurrentTime - seg.start) / (seg.end - seg.start)) * 100))
            : 0;

          return (
            <div
              key={idx}
              id={isActive ? 'active-transcript-segment' : undefined}
              ref={virtualRow ? virtualizer.measureElement : undefined}
              data-index={idx}
              style={virtualRow ? {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: '16px' // replace space-y-4
              } : { contentVisibility: 'auto', containIntrinsicSize: '100px' }}
              onClick={() => onSeek && onSeek(`[${Math.floor(seg.start / 60).toString().padStart(2, '0')}:${(seg.start % 60).toString().padStart(2, '0')}]`)}
              className={`transition-all duration-500 rounded-xl p-4 border-l-4 cursor-pointer group/seg relative overflow-hidden ${
                isActive
                  ? (isDark ? 'bg-indigo-500/25 border-indigo-400 shadow-2xl scale-[1.02] z-10 ring-1 ring-indigo-500/40' : 'bg-yellow-100/90 border-yellow-500 shadow-xl scale-[1.02] z-10 ring-1 ring-yellow-400/40')
                  : hasSearchMatch
                    ? (isDark ? 'bg-red-500/10 border-red-500/50 opacity-100' : 'bg-red-50 border-red-400 opacity-100')
                    : `border-transparent ${isKaraokeEnabled ? 'opacity-70' : 'opacity-100'} hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5`
              } ${hasSensitiveMatch && !isActive ? 'ring-1 ring-red-500/20' : ''} ${!virtualRow && !isSearchActive ? 'mb-4' : ''}`}
            >
              {/* Match Indicator */}
              {hasSearchMatch && !isActive && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                </div>
              )}

              {/* Progress Bar Background */}
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5 dark:bg-white/5">
                  <div 
                    className={`h-full transition-all duration-100 ease-linear ${isDark ? 'bg-indigo-400' : 'bg-yellow-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}

              <div style={{ fontSize: `${fontSize}px` }} className="leading-relaxed whitespace-pre-wrap relative">
                <div className={`absolute -left-12 top-0 opacity-0 group-hover/seg:opacity-100 transition-opacity hidden lg:block ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <span className={`text-[0.7em] font-mono mr-3 select-none px-2 py-0.5 rounded-md transition-colors ${
                  isActive 
                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-yellow-500 text-white') 
                    : (isDark ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40')
                }`}>
                  {`[${Math.floor(seg.start / 60).toString().padStart(2, '0')}:${(seg.start % 60).toString().padStart(2, '0')}]`}
                </span>
                {seg.text.split(/(\*\*.*?\*\*)/g).map((part: string, j: number) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    const textInside = part.slice(2, -2);
                    const hasColon = textInside.trim().endsWith(':');
                    const cleanName = textInside.replace(/:$/, '').trim();
                    const isGeneric = !isProperName(cleanName);
                    const isProper = cleanName.split(/\s+/).length <= 4 && (!isGeneric || hasColon);
                    
                    if (isProper && onSpeakerClick) {
                      return (
                        <span key={j} className="inline-flex items-center gap-1 group/speaker">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onSpeakerClick(cleanName); }}
                            className={`hover:underline cursor-pointer transition-colors font-bold ${isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-800 hover:text-indigo-600'}`}
                            title={`View profile: ${cleanName}`}
                          >
                            {textInside}
                          </button>
                          {onRenameSpeaker && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onRenameSpeaker(cleanName); }}
                              className="opacity-0 group-hover/speaker:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-opacity"
                              title="Rename Speaker Globally"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                          )}
                        </span>
                      );
                    }
                    return <strong key={j} className={isDark ? 'text-indigo-300' : 'text-indigo-800'}>{textInside}</strong>;
                  }

                  const elements = formatText(part, matchIndexRef);

                  return (
                    <span key={j} className={isActive ? (isDark ? 'text-white font-medium' : 'text-black font-medium') : ''}>
                      {elements}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {isSynced && isKaraokeEnabled && transcriptSegments.length > 0
        ? renderSyncedTranscript()
        : <FormattedTranscript 
            text={transcript} 
            searchTerm={searchTerm} 
            isDark={isDark} 
            currentMatchIndex={currentMatchIndex} 
            sensitiveMatches={sensitiveMatches} 
            onSeek={onSeek} 
            onSpeakerClick={onSpeakerClick} 
            onRenameSpeaker={onRenameSpeaker} 
          />
      }
    </>
  );
};
