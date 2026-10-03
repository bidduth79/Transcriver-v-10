import { useState, useRef } from 'react';

// ============================================================================
// 🎙️ মাইক্রোফোন অপশন নিয়ন্ত্রণ (Microphone Feature Toggle)
// ----------------------------------------------------------------------------
// ডিফল্টভাবে মাইক্রোফোন বন্ধ থাকে। Settings থেকে অন বা অফ করা যায়।
export const isMicrophoneEnabled = (): boolean => {
  return localStorage.getItem('feature_microphone_enabled') === 'true';
};

export const setMicrophoneEnabled = (enabled: boolean) => {
  localStorage.setItem('feature_microphone_enabled', enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('microphone_feature_toggle'));
};
// ============================================================================

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
    // মাইক্রোফোন ব্যাকএন্ড স্থগিত থাকলে নোটিফিকেশন প্রদর্শন ও প্রসেস বন্ধ
    if (!isMicrophoneEnabled()) {
      addToast(
        appLang === 'bn' 
          ? "মাইক্রোফোন রেকর্ডিং অপশনটি সেটিংস থেকে বন্ধ রাখা হয়েছে।" 
          : "Microphone recording is disabled in Settings.", 
        'info'
      );
      return;
    }

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
