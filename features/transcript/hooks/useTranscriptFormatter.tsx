import React from 'react';

export const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const useTranscriptFormatter = (
  searchTerm: string,
  isDark: boolean,
  currentMatchIndex: number,
  sensitiveMatches: string[] = []
) => {
  const formatText = (text: string, matchIndexRef: { current: number }) => {
    let elements: (string | React.ReactNode)[] = [text];

    // 1. Process Search Term FIRST
    if (searchTerm && searchTerm.trim()) {
      const escapedTerm = escapeRegExp(searchTerm.trim());
      // Use Unicode properly escapes to match letters, combining marks, numbers and zero-width joiners
      // This preserves Bengali complex text layouts perfectly without catching punctuation
      const wordChars = '[\\p{L}\\p{M}\\p{N}\\u200D\\u200C]*';
      const regex = new RegExp(`(${wordChars}(?:${escapedTerm})${wordChars})`, 'giu');
      elements = elements.flatMap((el, elIdx) => {
        if (typeof el !== 'string') return el;
        return el.split(regex).map((sub, subIdx) => {
          if (sub.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
            const currentId = `match-${matchIndexRef.current}`;
            const isCurrent = matchIndexRef.current === currentMatchIndex;
            matchIndexRef.current++;
            return (
              <mark
                key={`search-${elIdx}-${subIdx}`}
                id={currentId}
                className={`${isCurrent ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-black'} font-bold decoration-yellow-600/30 underline decoration-2 underline-offset-4 transition-all duration-300`}
              >
                {sub}
              </mark>
            );
          }
          return sub;
        });
      });
    }

    // 2. Process Sensitive Matches
    if (sensitiveMatches && sensitiveMatches.length > 0) {
      // Capture the whole word using letters/marks to preserve complex text layout
      const wordChars = '[\\p{L}\\p{M}\\p{N}\\u200D\\u200C]*';
      const keywordsPattern = sensitiveMatches.map(escapeRegExp).join('|');
      const sensitiveRegex = new RegExp(`(${wordChars}(?:${keywordsPattern})${wordChars})`, 'giu');
      
      elements = elements.flatMap((el, elIdx) => {
        if (typeof el !== 'string') return el;
        return el.split(sensitiveRegex).map((sub, subIdx) => {
          if (sensitiveMatches.some(m => sub.toLowerCase().includes(m.toLowerCase()))) {
            return (
              <mark
                key={`sens-${elIdx}-${subIdx}`}
                className="bg-red-500/20 text-red-700 dark:text-red-400 font-bold decoration-red-500/30 underline decoration-2 underline-offset-4"
              >
                {sub}
              </mark>
            );
          }
          return sub;
        });
      });
    }

    return elements;
  };

  return { formatText };
};
