import { useState, useRef, useMemo, useEffect } from 'react';
import { getSensitiveKeywords } from '../../../utils/sensitiveKeywords';

export const useTranscriptScroll = (
  matchCount: number,
  searchTerm: string,
  currentMatchIndex: number,
  isSynced: boolean,
  isKaraokeEnabled: boolean,
  status: string,
  transcript: string,
  audioCurrentTime: number
) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [localScrollPercent, setLocalScrollPercent] = useState(0);
  
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const programmaticScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUserInteraction = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000);
  };

  const setProgrammaticScroll = () => {
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }
    // Smooth scrolling takes some time, ignore scroll events for 1 second
    programmaticScrollTimeoutRef.current = setTimeout(() => {
      programmaticScrollTimeoutRef.current = null;
    }, 1000);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const percent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      // Only update state if it changed significantly to avoid too many re-renders
      setLocalScrollPercent(prev => Math.abs(prev - percent) > 1 ? percent : prev);
      
      if (!programmaticScrollTimeoutRef.current) {
        // This was a user scroll
        handleUserInteraction();
      }
    }
  };

  const scrollToTop = () => {
    setProgrammaticScroll();
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const scrollToBottom = () => {
    setProgrammaticScroll();
    scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  // Sync scroll to audio
  useEffect(() => {
    if (!isUserScrolling && isSynced && isKaraokeEnabled && (status === 'completed' || status === 'processing')) {
      const activeEl = document.getElementById('active-transcript-segment');
      if (activeEl) {
        setProgrammaticScroll();
        const container = scrollContainerRef.current;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const activeRect = activeEl.getBoundingClientRect();
          // Calculate how far the active element is from the top of the container's scrollable area
          const relativeTop = activeRect.top - containerRect.top + container.scrollTop;
          
          container.scrollTo({
            top: relativeTop - containerRect.height / 2 + activeRect.height / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [Math.floor(audioCurrentTime), isSynced, status, isKaraokeEnabled, transcript, isUserScrolling]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
    };
  }, []);

  // Sync scroll to Search Match
  useEffect(() => {
    if (matchCount > 0 && searchTerm) {
      const activeId = `match-${currentMatchIndex}`;
      const element = document.getElementById(activeId);
      if (element) {
        setProgrammaticScroll();
        const container = scrollContainerRef.current;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const activeRect = element.getBoundingClientRect();
          const relativeTop = activeRect.top - containerRect.top + container.scrollTop;
          
          container.scrollTo({
            top: relativeTop - containerRect.height / 2 + activeRect.height / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentMatchIndex, matchCount, searchTerm]);

  return {
    scrollContainerRef,
    transcriptEndRef,
    localScrollPercent,
    handleScroll,
    handleUserInteraction,
    scrollToTop,
    scrollToBottom
  };
};

export const useTranscriptSync = (
  fileUrl: string | null,
  transcript: string,
  activeTranscriptSourceMeta: any,
  fileMeta: any,
  status: string
) => {
  const isSynced = useMemo(() => {
    if (!fileUrl || !transcript || !activeTranscriptSourceMeta) return false;
    return fileMeta?.name === activeTranscriptSourceMeta?.name;
  }, [fileUrl, transcript, activeTranscriptSourceMeta, fileMeta]);

  const [isKaraokeEnabled, setIsKaraokeEnabled] = useState(false);

  useEffect(() => {
    if (status === 'processing') {
      setIsKaraokeEnabled(false);
    }
  }, [isSynced, status]);

  const transcriptSegments = useMemo(() => {
    if (!transcript || !isSynced) return [];

    const toSeconds = (h: string | undefined, m: string, s: string) => {
      const hours = h ? parseInt(h) : 0;
      const minutes = parseInt(m);
      const seconds = parseInt(s);
      return hours * 3600 + minutes * 60 + seconds;
    };

    const parts = transcript.split(/(?:\[|\b)((?:\d{1,2}:)?\d{1,2}:\d{2})(?:\]|\b)/);
    const finalSegments: any[] = [];
    let lastTime = 0;

    if (parts[0] && parts[0].trim()) {
      finalSegments.push({
         start: 0,
         end: Infinity,
         text: parts[0].trim(),
         originalText: parts[0]
      });
    }

    for (let i = 1; i < parts.length; i += 2) {
      const timeStr = parts[i];
      const textStr = parts[i + 1] || "";

      let time = lastTime;
      if (timeStr) {
        const timeMatch = timeStr.match(/(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          time = toSeconds(timeMatch[1], timeMatch[2], timeMatch[3]);
          lastTime = time;
        }
      }

      if (textStr.trim()) {
        finalSegments.push({
           start: time,
           end: Infinity,
           text: textStr.trim(),
           originalText: textStr
        });
      }
    }

    for (let i = 0; i < finalSegments.length; i++) {
        let nextTime = Infinity;
        for (let j = i + 1; j < finalSegments.length; j++) {
            if (finalSegments[j].start > finalSegments[i].start) {
                nextTime = finalSegments[j].start;
                break;
            }
        }
        finalSegments[i].end = nextTime;
    }
    
    return finalSegments;
  }, [transcript, isSynced]);

  return { isSynced, isKaraokeEnabled, setIsKaraokeEnabled, transcriptSegments };
};

export const useLogoAnimation = () => {
  const [logoOffset, setLogoOffset] = useState({ x: 0, y: 0 });
  const logoContainerRef = useRef<HTMLDivElement>(null);

  const handleLogoMouseMove = (e: any) => {
    if (!logoContainerRef.current) return;
    const rect = logoContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    const maxDistance = 180;
    const maxPush = 80;

    if (distance < maxDistance && distance > 0) {
      const force = Math.pow((maxDistance - distance) / maxDistance, 0.8); 
      const pushX = (distX / distance) * -maxPush * force;
      const pushY = (distY / distance) * -maxPush * force;
      setLogoOffset({ x: pushX, y: pushY });
    } else {
      setLogoOffset({ x: 0, y: 0 });
    }
  };

  const handleLogoMouseLeave = () => {
    setLogoOffset({ x: 0, y: 0 });
  };

  return { logoOffset, logoContainerRef, handleLogoMouseMove, handleLogoMouseLeave };
};

export const useSensitiveKeywords = (transcript: string) => {
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

  const sensitiveMatches = useMemo(() => {
    if (!transcript || sensitiveKeywords.length === 0) return [];
    const lower = transcript.toLowerCase();
    return sensitiveKeywords.filter(kw => kw && kw.trim().length > 0 && lower.includes(kw.toLowerCase())).sort((a, b) => b.length - a.length);
  }, [transcript, sensitiveKeywords]);

  const sensitiveWordCounts = useMemo(() => {
    if (!transcript || sensitiveMatches.length === 0) return [];
    
    return sensitiveMatches.map(kw => {
      // Escape for regex and count all case-insensitive occurrences
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      const count = (transcript.match(regex) || []).length;
      return { word: kw, count };
    });
  }, [transcript, sensitiveMatches]);

  const isSensitive = sensitiveMatches.length > 0;

  return { sensitiveMatches, sensitiveWordCounts, isSensitive };
};
