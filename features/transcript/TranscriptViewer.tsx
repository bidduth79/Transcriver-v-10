import React, { useRef } from 'react';
import { useTranscriptFormatter } from './hooks/useTranscriptFormatter.tsx';

// Robust Regex Escaping
export const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const renderFormattedTranscriptInternal = (
  text: string,
  searchTerm: string,
  isDark: boolean,
  currentMatchIndex: number,
  sensitiveMatches: string[] = [],
  onSeek?: (timeStr: string) => void,
  onSpeakerClick?: (name: string) => void
) => {
  if (!text) return null;
  const matchIndexRef = { current: 0 };
  
  // Create a temporary hook instance just for this function
  const { formatText } = useTranscriptFormatter(searchTerm, isDark, currentMatchIndex, sensitiveMatches);

  return text.split('\n').map((line: string, i: number) => {
    // Extract timestamp if it exists at the beginning of the line
    const timestampMatch = line.match(/^(\[(?:\d{1,2}:)?\d{1,2}:\d{2}\])\s*(.*)/);
    
    let timestamp = '';
    let content = line;
    
    if (timestampMatch) {
      timestamp = timestampMatch[1];
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
      <div key={i} className="mb-2 min-h-[1.5em] leading-relaxed flex items-start group">
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
              const cleanName = textInside.replace(/:$/, '').trim();
              const isProper = cleanName.split(/\s+/).length <= 4 && isProperName(cleanName);
              
              if (isProper && onSpeakerClick) {
                return (
                  <button 
                    key={j} 
                    onClick={(e) => { e.stopPropagation(); onSpeakerClick(cleanName); }}
                    className={`hover:underline cursor-pointer transition-colors font-bold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-700 hover:text-indigo-600'}`}
                    title={`View profile: ${cleanName}`}
                  >
                    {textInside}
                  </button>
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
  onSpeakerClick
}: any) => {
  const matchIndexRef = useRef(0);
  const { formatText } = useTranscriptFormatter(searchTerm, isDark, currentMatchIndex, sensitiveMatches);

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

    return (
      <div className="space-y-4">
        {transcriptSegments.map((seg: any, idx: number) => {
          const isActive = audioCurrentTime >= seg.start && audioCurrentTime < seg.end;
          const hasSearchMatch = searchTerm && searchTerm.trim() && seg.text.toLowerCase().includes(searchTerm.toLowerCase());
          const hasSensitiveMatch = sensitiveMatches.some(m => seg.text.toLowerCase().includes(m.toLowerCase()));
          
          const progress = isActive 
            ? Math.min(100, Math.max(0, ((audioCurrentTime - seg.start) / (seg.end - seg.start)) * 100))
            : 0;

          return (
            <div
              key={idx}
              id={isActive ? 'active-transcript-segment' : undefined}
              onClick={() => onSeek && onSeek(`[${Math.floor(seg.start / 60).toString().padStart(2, '0')}:${(seg.start % 60).toString().padStart(2, '0')}]`)}
              className={`transition-all duration-500 rounded-xl p-4 border-l-4 cursor-pointer group/seg relative overflow-hidden ${
                isActive
                  ? (isDark ? 'bg-indigo-500/25 border-indigo-400 shadow-2xl scale-[1.02] z-10 ring-1 ring-indigo-500/40' : 'bg-yellow-100/90 border-yellow-500 shadow-xl scale-[1.02] z-10 ring-1 ring-yellow-400/40')
                  : hasSearchMatch
                    ? (isDark ? 'bg-red-500/10 border-red-500/50 opacity-100' : 'bg-red-50 border-red-400 opacity-100')
                    : `border-transparent opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 ${isKaraokeEnabled ? 'blur-[0.5px]' : ''}`
              } ${hasSensitiveMatch && !isActive ? 'ring-1 ring-red-500/20' : ''}`}
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
                    const cleanName = textInside.replace(/:$/, '').trim();
                    const isProper = cleanName.split(/\s+/).length <= 4 && isProperName(cleanName);
                    
                    if (isProper && onSpeakerClick) {
                      return (
                        <button 
                          key={j} 
                          onClick={(e) => { e.stopPropagation(); onSpeakerClick(cleanName); }}
                          className={`hover:underline cursor-pointer transition-colors font-bold ${isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-800 hover:text-indigo-600'}`}
                          title={`View profile: ${cleanName}`}
                        >
                          {textInside}
                        </button>
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
        : renderFormattedTranscriptInternal(transcript, searchTerm, isDark, currentMatchIndex, sensitiveMatches, onSeek, onSpeakerClick)
      }
    </>
  );
};
