import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { getSensitiveKeywords } from '../../../utils/sensitiveKeywords';

export const useExpandedHistory = (
  filteredHistory: any[],
  historyLimit: number,
  setHistoryLimit: React.Dispatch<React.SetStateAction<number>>
) => {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const [sensitiveKeywords, setSensitiveKeywordsList] = useState<string[]>([]);

  useEffect(() => {
    setSensitiveKeywordsList(getSensitiveKeywords());
    const handleUpdate = () => setSensitiveKeywordsList(getSensitiveKeywords());
    window.addEventListener('sensitive-keywords-updated', handleUpdate);
    return () => window.removeEventListener('sensitive-keywords-updated', handleUpdate);
  }, []);

  const bottomRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (node) {
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (filteredHistory.length < historyLimit) return;
          
          setIsHistoryLoading(true);
          setTimeout(() => {
            setHistoryLimit((prev: number) => prev + 20);
            setIsHistoryLoading(false);
          }, 800);
        }
      });
      observer.current.observe(node);
    }
  }, [filteredHistory.length, historyLimit, setHistoryLimit]);

  const [sensitiveMatchesMap, setSensitiveMatchesMap] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    const timer = setTimeout(() => {
      const map = new Map<string, string[]>();
      const visibleHistory = filteredHistory.slice(0, historyLimit);
      visibleHistory.forEach(item => {
         if (item.transcript) {
           const lower = item.transcript.toLowerCase();
           const matches = sensitiveKeywords
             .filter(kw => kw && kw.trim().length > 0 && lower.includes(kw.toLowerCase()))
             .sort((a, b) => b.length - a.length);
           map.set(item.id, matches);
         } else {
           map.set(item.id, []);
         }
      });
      setSensitiveMatchesMap(map);
    }, 10);
    return () => clearTimeout(timer);
  }, [filteredHistory, historyLimit, sensitiveKeywords]);

  const getSensitiveMatches = useCallback((id: string) => {
    return sensitiveMatchesMap.get(id) || [];
  }, [sensitiveMatchesMap]);

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
    isHistoryLoading,
    bottomRef,
    getSensitiveMatches,
    formatProcessingTime
  };
};
