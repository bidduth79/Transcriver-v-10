import { useState, useEffect, useRef } from 'react';

export const useTranscriptSearch = (transcript: string) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const transcriptSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchTerm || !transcript) {
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }
    try {
      // Escape special characters for regex
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      const matches = transcript.match(regex);
      setMatchCount(matches ? matches.length : 0);
      // Reset index to 0 whenever the search term changes
      setCurrentMatchIndex(0);
    } catch (e) {
      console.error("Regex error:", e);
      setMatchCount(0);
    }
  }, [searchTerm, transcript]);

  const goToNextMatch = () => {
    if (matchCount > 0) {
      setCurrentMatchIndex(prev => (prev + 1) % matchCount);
    }
  };

  const goToPrevMatch = () => {
    if (matchCount > 0) {
      setCurrentMatchIndex(prev => (prev - 1 + matchCount) % matchCount);
    }
  };

  return {
    searchTerm, setSearchTerm,
    currentMatchIndex, setCurrentMatchIndex,
    matchCount, setMatchCount,
    transcriptSearchInputRef,
    goToNextMatch, goToPrevMatch
  };
};
