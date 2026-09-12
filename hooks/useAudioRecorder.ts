import { useState, useRef } from 'react';

export const useAudioRecorder = (
  appLang: 'en' | 'bn',
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  onRecordingComplete: (file: File) => void
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordIntervalRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      let options: MediaRecorderOptions = { audioBitsPerSecond: 16000 };
      let ext = 'webm';
      let mime = 'audio/webm';
      
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
        mime = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
        mime = 'audio/mp4';
        ext = 'mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        const file = new File([blob], `Recording_${new Date().toLocaleTimeString().replace(/:/g, '-')}.${ext}`, { type: mime });
        onRecordingComplete(file);
        setIsRecording(false);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (e) {
      console.error("Mic Access Error", e);
      addToast(appLang === 'bn' ? "মাইক্রোফোন এক্সেস পাওয়া যায়নি" : "Microphone access denied", 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
  };

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording
  };
};
