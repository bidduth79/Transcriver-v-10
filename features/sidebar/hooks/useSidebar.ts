import { useState, useEffect } from 'react';
import { getSensitiveKeywords } from '../../../utils/sensitiveKeywords';

export const useSidebar = (appLang: string, handleFileChange: any, audioRef: any) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [playbackRate, setPlaybackRate] = useState(1);
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

  const getSensitiveMatches = (text: string) => {
    if (!text) return [];
    const lower = text.toLowerCase();
    return sensitiveKeywords.filter(kw => kw && kw.trim().length > 0 && lower.includes(kw.toLowerCase())).sort((a, b) => b.length - a.length);
  };


  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleYouTubeSuccess = (blob: Blob, fileName: string, mode: string) => {
      if (mode === 'transcribe') {
          const file = new File([blob], fileName, { type: blob.type || 'audio/mp3' });
          handleFileChange({ target: { files: [file] } }, true);
      }
  };

  const changePlaybackRate = (rate: number) => {
    if (audioRef.current) {
        audioRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime += seconds;
    }
  };

  const getHeaderTitle = (isRecording: boolean, t: any) => {
      if (isRecording) return appLang === 'bn' ? "রেকর্ডিং চলছে..." : "Recording...";
      if (activeTab === 'youtube') return 'YOUTUBE LINK';
      if (activeTab === 'facebook') return 'FACEBOOK LINK';
      return t.audioVideoFile;
  };

  return {
    activeTab,
    setActiveTab,
    playbackRate,
    getSensitiveMatches,
    formatTime,
    handleYouTubeSuccess,
    changePlaybackRate,
    skipTime,
    getHeaderTitle
  };
};
