import { useState, useRef, useEffect } from 'react';
import { getApiUrl } from '../../../services/api.ts';

export const useYouTubeInput = (
  appLang: string,
  onSuccess: (blob: Blob, fileName: string, mode: 'download' | 'transcribe') => void,
  showFormats: boolean
) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<'download' | 'transcribe' | null>(null);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState<string | null>(null);
  const [quality, setQuality] = useState(() => {
    return localStorage.getItem('youtubeInputQuality') || 'audio';
  }); 
  
  const timerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem('youtubeInputQuality', quality);
  }, [quality]);

  useEffect(() => {
    if (loading) {
      setElapsedSeconds(0);
      setTotalTimeTaken(null);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setLoadingMode(null);
    setError(appLang === 'bn' ? 'কনভার্সন বাতিল করা হয়েছে' : 'Conversion cancelled');
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  };

  const processYouTube = async (mode: 'download' | 'transcribe') => {
    const isValid = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('facebook.com') || url.includes('fb.watch');
    
    if (!url || !isValid) {
      setError(appLang === 'bn' ? 'সঠিক ইউটিউব বা ফেসবুক লিংক দিন' : 'Invalid Video URL');
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    setLoadingMode(mode);
    setError('');
    setTotalTimeTaken(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const apiUrl = getApiUrl('youtube.php');
      
      const bodyPayload = { 
          url, 
          quality: showFormats ? quality : 'audio' 
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal
      });

      if (response.status === 429) {
        throw new Error(appLang === 'bn' ? "ইউটিউব থেকে ব্লক করা হয়েছে (Rate Limit)। কিছুক্ষণ পর আবার চেষ্টা করুন।" : "Rate limit exceeded. Please try again later.");
      }

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("Server Raw Response:", text);
        throw new Error(appLang === 'bn' ? "সার্ভার এরর (JSON Parse Failed)" : "Server returned invalid data");
      }

      if (result.error) {
        const errStr = result.error.toLowerCase();
        if (errStr.includes('bot') || errStr.includes('sign in') || errStr.includes('429') || errStr.includes('too many requests')) {
          throw new Error(appLang === 'bn' ? "ইউটিউব থেকে ব্লক করা হয়েছে (Rate Limit)। কিছুক্ষণ পর আবার চেষ্টা করুন।" : "Rate limit exceeded. Please try again later.");
        }
        throw new Error(result.error);
      }

      if (result.base64 && result.filename) {
        const byteCharacters = atob(result.base64);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        
        
        let mimeType = 'audio/mp3';
        const ext = result.format?.toLowerCase() || 'mp3';
        
        if (ext === 'm4a') mimeType = 'audio/mp4';
        else if (ext === 'wav') mimeType = 'audio/wav';
        else if (ext === 'opus' || ext === 'ogg') mimeType = 'audio/ogg';
        else if (ext === 'webm') mimeType = 'video/webm';
        else if (ext === 'mp4') mimeType = 'video/mp4';
        else if (ext === 'aac') mimeType = 'audio/aac';

        const blob = new Blob([byteArray], { type: mimeType });
        
        const actualElapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        const finalTime = formatTime(actualElapsedSeconds);
        setTotalTimeTaken(finalTime); 
        
        onSuccess(blob, result.filename, mode);
        setUrl('');
      } else {
        throw new Error('Invalid response structure');
      }

    } catch (e: any) {
      if (e.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
      }
      console.error(e);
      let msg = e.message || (appLang === 'bn' ? 'প্রসেসিং এরর হয়েছে' : 'Processing error');
      
      if (msg.includes('Failed to fetch')) {
        msg = appLang === 'bn' 
            ? 'সার্ভার কানেকশন সমস্যা (CORS/Timeout)। XAMPP চালু আছে কিনা দেখুন।' 
            : 'Connection Failed (CORS/Timeout). Check if XAMPP is running.';
      }
      
      setError(msg);
      setTotalTimeTaken(null);
    } finally {
      setLoading(false);
      setLoadingMode(null);
      abortControllerRef.current = null;
    }
  };

  return {
    url,
    setUrl,
    loading,
    loadingMode,
    error,
    elapsedSeconds,
    totalTimeTaken,
    quality,
    setQuality,
    handleCancel,
    processYouTube,
    formatTime
  };
};
