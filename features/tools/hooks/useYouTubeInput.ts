import { useState, useRef, useEffect } from 'react';
import { getApiUrl } from '../../../services/api.ts';

export const useYouTubeInput = (
  appLang: string,
  onSuccess: (blob: Blob, fileName: string, mode: 'download' | 'transcribe') => void,
  showFormats: boolean
) => {
  const [url, setUrl] = useState('');
  
  // New States
  const [downloadMode, setDownloadMode] = useState<'single' | 'bulk'>('single');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  
  // Audio Options
  const [bitrate, setBitrate] = useState('24');
  const [channels, setChannels] = useState('1');
  const [samplerate, setSamplerate] = useState('16000');
  
  // Video Options
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Bulk Queue
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkQueue, setBulkQueue] = useState<{url: string, status: 'pending'|'downloading'|'success'|'failed', error: string, filename: string, timeTaken?: string}[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);
  const [activeItemStartTime, setActiveItemStartTime] = useState<number | null>(null);

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
  
  const callApi = async (targetUrl: string, controller: AbortController) => {
      const apiUrl = getApiUrl('youtube.php');
      
      const bodyPayload = { 
          url: targetUrl, 
          quality: showFormats ? quality : 'audio',
          customDownloadPath: localStorage.getItem('customDownloadPath') || '',
          bitrate,
          channels,
          samplerate,
          startTime,
          endTime
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
          throw new Error(appLang === 'bn' ? "ইউটিউব থেকে ব্লক করা হয়েছে (Rate Limit)।" : "Rate limit exceeded.");
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
        return { blob, filename: result.filename, ext };
      } else {
        throw new Error('Invalid response structure');
      }
  };

  const extractUrl = (text: string) => {
      const match = text.match(/(https?:\/\/[^\s]+)/);
      return match ? match[1] : text;
  };

  const processYouTube = async (mode: 'download' | 'transcribe') => {
    if (downloadMode === 'bulk') {
        const lines = bulkUrls.split('\n')
            .map(l => extractUrl(l.trim()))
            .filter(l => l);
            
        if (lines.length === 0) {
            setError(appLang === 'bn' ? 'কোনো লিংক পাওয়া যায়নি' : 'No URLs provided');
            return;
        }
        setLoading(true);
        setLoadingMode(mode);
        setError('');
        setTotalTimeTaken(null);
        const startTimeMs = Date.now();
        
        const controller = new AbortController();
        abortControllerRef.current = controller;
        
        let newQueue = lines.map(l => ({ url: l, status: 'pending' as 'pending', error: '', filename: '', timeTaken: '' }));
        setBulkQueue(newQueue);
        
        for (let i = 0; i < newQueue.length; i++) {
            if (controller.signal.aborted) break;
            
            setActiveItemIndex(i);
            const itemStartTime = Date.now();
            setActiveItemStartTime(itemStartTime);

            setBulkQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'downloading' } : item));
            try {
                const res = await callApi(newQueue[i].url, controller);
                const itemTimeSec = Math.round((Date.now() - itemStartTime) / 1000);
                onSuccess(res.blob, res.filename, mode);
                setBulkQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'success', filename: res.filename, timeTaken: formatTime(itemTimeSec) } : item));
            } catch (e: any) {
                if (e.name === 'AbortError') break;
                const itemTimeSec = Math.round((Date.now() - itemStartTime) / 1000);
                setBulkQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'failed', error: e.message, timeTaken: formatTime(itemTimeSec) } : item));
            }
        }
        
        setActiveItemIndex(-1);
        setActiveItemStartTime(null);
        
        const actualElapsedSeconds = Math.round((Date.now() - startTimeMs) / 1000);
        setTotalTimeTaken(formatTime(actualElapsedSeconds));
        setLoading(false);
        setLoadingMode(null);
        abortControllerRef.current = null;
        return;
    }
  
    // Single Mode
    const cleanUrl = extractUrl(url.trim());
    const isValid = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be') || cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch');
    if (!cleanUrl || !isValid) {
      setError(appLang === 'bn' ? 'সঠিক ইউটিউব বা ফেসবুক লিংক দিন' : 'Invalid Video URL');
      return;
    }

    setLoading(true);
    const startTimeMs = Date.now();
    
    setLoadingMode(mode);
    setError('');
    setTotalTimeTaken(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await callApi(cleanUrl, controller);
      const actualElapsedSeconds = Math.round((Date.now() - startTimeMs) / 1000);
      setTotalTimeTaken(formatTime(actualElapsedSeconds)); 
      
      onSuccess(res.blob, res.filename, mode);
      setUrl('');
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
    url, setUrl,
    downloadMode, setDownloadMode,
    mediaType, setMediaType,
    bitrate, setBitrate,
    channels, setChannels,
    samplerate, setSamplerate,
    startTime, setStartTime,
    endTime, setEndTime,
    bulkUrls, setBulkUrls,
    bulkQueue, setBulkQueue,
    loading, loadingMode, error,
    elapsedSeconds, totalTimeTaken,
    quality, setQuality,
    handleCancel, processYouTube, formatTime,
    activeItemIndex, activeItemStartTime
  };
};
