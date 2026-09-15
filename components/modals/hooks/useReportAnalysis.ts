import { useMemo } from 'react';

export const useReportAnalysis = (transcript: string, searchTerm: string, fileMeta: any) => {
  return useMemo<{ ranges: string[], snippets: string[], matchCount: number } | null>(() => {
    if (!searchTerm || !transcript) return null;
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (lowerSearch === "") return null;

    const lines = transcript.split('\n');
    const turns: { startTime: string, text: string }[] = [];
    let currentTurnText = "";
    let lastKnownTime = "00:00";

    lines.forEach((line) => {
      const timeMatch = line.match(/\[(\d{1,2}:\d{2})\]/);
      if (timeMatch) {
        if (currentTurnText.trim()) turns.push({ startTime: lastKnownTime, text: currentTurnText });
        lastKnownTime = timeMatch[1];
        currentTurnText = line; 
      } else {
        currentTurnText += " " + line;
      }
    });
    if (currentTurnText.trim()) turns.push({ startTime: lastKnownTime, text: currentTurnText });

    const ranges: string[] = [];
    const snippets: string[] = [];
    
    turns.forEach((turn, index) => {
      const cleanText = turn.text
        .replace(/\*\*.*?\*\*/g, '')
        .replace(/\[\d{1,2}:\d{2}\]/g, '')
        .replace(/Speaker \d+\s*:/gi, '')
        .replace(/স্পিকার \d+\s*:/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();

      const turnContent = cleanText;
      const lowerTurnContent = turnContent.toLowerCase();
      const startTime = turn.startTime;
      const endTime = turns[index + 1]?.startTime || fileMeta?.duration || "...";
      
      let pos = lowerTurnContent.indexOf(lowerSearch);
      while (pos !== -1) {
        const beforeMatch = turnContent.substring(0, pos);
        const lastPunc = Math.max(
            beforeMatch.lastIndexOf('।'),
            beforeMatch.lastIndexOf('.'),
            beforeMatch.lastIndexOf('?'),
            beforeMatch.lastIndexOf('!'),
            beforeMatch.lastIndexOf('|')
        );
        const idealStartIdx = lastPunc === -1 ? 0 : lastPunc + 1;

        const afterMatch = turnContent.substring(pos + lowerSearch.length);
        const puncs = ['।', '.', '?', '!', '|'];
        let firstPunc = -1;
        for (const p of puncs) {
            const idx = afterMatch.indexOf(p);
            if (idx !== -1) {
                if (firstPunc === -1 || idx < firstPunc) {
                    firstPunc = idx;
                }
            }
        }
        const idealEndIdx = firstPunc === -1 ? turnContent.length : pos + lowerSearch.length + firstPunc + 1;
        const startIdx = Math.max(idealStartIdx, pos - 150);
        const endIdx = Math.min(idealEndIdx, pos + lowerSearch.length + 150);

        let snip = turnContent.substring(startIdx, endIdx).trim();
        if (startIdx > idealStartIdx) snip = "..." + snip;
        if (endIdx < idealEndIdx) snip = snip + "...";

        if (snip && !snippets.includes(snip)) {
          snippets.push(snip);
          ranges.push(`${startTime}-${endTime}`);
        }
        pos = lowerTurnContent.indexOf(lowerSearch, pos + lowerSearch.length);
      }
    });

    return { ranges, snippets, matchCount: snippets.length };
  }, [transcript, searchTerm, fileMeta]);
};
