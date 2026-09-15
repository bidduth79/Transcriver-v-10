import { useState, useRef, useEffect } from 'react';

export const useAudioPlayback = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (time: string) => {
    if (!audioRef.current) return;
    const cleanTime = time.replace(/[\[\]]/g, '');
    const parts = cleanTime.split(/[-:]/).map(s => s.trim()).filter(s => s);
    const target = parts.length > 0 ? parts.slice(0, 3).join(':') : "00:00"; 
    
    const tParts = target.split(':').map(Number);
    let seconds = 0;
    if (tParts.length === 1) seconds = tParts[0];
    else if (tParts.length === 2) seconds = tParts[0] * 60 + tParts[1];
    else if (tParts.length === 3) seconds = tParts[0] * 3600 + tParts[1] * 60 + tParts[2];
    
    audioRef.current.currentTime = seconds;
    audioRef.current.play();
  };

  return { audioRef, audioCurrentTime, handleSeek, handleTimeUpdate };
};
