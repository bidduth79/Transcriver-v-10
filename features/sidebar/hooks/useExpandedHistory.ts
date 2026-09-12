import { useState, useRef, useCallback, useEffect } from 'react';
import { getSensitiveKeywords } from '../../../utils/sensitiveKeywords';

export const useExpandedHistory = (filteredHistory: any[]) => {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [historyLimit, setHistoryLimit] = useState(20);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const [sensitiveKeywords, setSensitiveKeywordsList] = useState<string[]>([]);

  useEffect(() => {
    // Load initial keywords
    setSensitiveKeywordsList(getSensitiveKeywords());

    // Listen for updates
    const handleUpdate = () => {
      setSensitiveKeywordsList(getSensitiveKeywords());
    };
    window.addEventListener('sensitive-keywords-updated', handleUpdate);
    return () => window.removeEventListener('sensitive-keywords-updated', handleUpdate);
  }, []);

  const bottomRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (node) {
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (historyLimit >= filteredHistory.length) return;
          
          setIsHistoryLoading(true);
          setTimeout(() => {
            setHistoryLimit((prev: number) => {
              if (prev >= filteredHistory.length) return prev;
              return prev + 20;
            });
            setIsHistoryLoading(false);
          }, 800);
        }
      });
      observer.current.observe(node);
    }
  }, [filteredHistory.length, historyLimit]);

  const displayedHistory = filteredHistory.slice(0, historyLimit);

  const getSensitiveMatches = (text: string) => {
    if (!text) return [];
    const lower = text.toLowerCase();
    return sensitiveKeywords.filter(kw => kw && kw.trim().length > 0 && lower.includes(kw.toLowerCase())).sort((a, b) => b.length - a.length);
  };

  const formatProcessingTime = (timeStr: string) => {
    if (!timeStr) return timeStr;
    
    if (timeStr.endsWith('s') && !timeStr.includes('m') && !timeStr.includes(':')) {
      const totalSecs = parseInt(timeStr.replace('s', ''), 10);
      if (!isNaN(totalSecs)) {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        if (mins > 0) {
          return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        } else {
          return `${secs}s`;
        }
      }
    }

    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10);
        const secs = parseInt(parts[1], 10);
        if (!isNaN(mins) && !isNaN(secs)) {
          if (mins > 0) {
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
          } else {
            return `${secs}s`;
          }
        }
      }
    }
    
    return timeStr;
  };

  return {
    hoveredCardId,
    setHoveredCardId,
    historyLimit,
    isHistoryLoading,
    bottomRef,
    displayedHistory,
    getSensitiveMatches,
    formatProcessingTime
  };
};
