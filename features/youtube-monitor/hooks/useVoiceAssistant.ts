import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceAssistant = () => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voices, setVoices] = useState<{voiceURI: string, name: string, lang: string}[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastAnnouncedRef = useRef<{text: string, time: number} | null>(null);

  useEffect(() => {
    const savedEnabled = localStorage.getItem('jarvis_voice_enabled');
    if (savedEnabled) setIsVoiceEnabled(savedEnabled === 'true');

    const savedVoice = localStorage.getItem('jarvis_voice_uri');
    if (savedVoice) setSelectedVoiceURI(savedVoice);

    const loadVoices = () => {
      if (!window.speechSynthesis) return;
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        const voiceList = availableVoices.map(v => ({
          voiceURI: v.voiceURI,
          name: v.name,
          lang: v.lang
        }));
        setVoices(voiceList);
        
        if (!savedVoice && voiceList.length > 0) {
          // Default to an English voice or the first available
          const defaultVoice = voiceList.find(v => v.lang.startsWith('en')) || voiceList[0];
          setSelectedVoiceURI(defaultVoice.voiceURI);
        }
      }
    };

    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const toggleVoice = (enabled: boolean) => {
    setIsVoiceEnabled(enabled);
    localStorage.setItem('jarvis_voice_enabled', String(enabled));
    if (!enabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const selectVoice = (uri: string) => {
    setSelectedVoiceURI(uri);
    localStorage.setItem('jarvis_voice_uri', uri);
  };

  const announce = useCallback(async (text: string) => {
    if (!isVoiceEnabled || !text || !window.speechSynthesis) return;

    const now = Date.now();
    if (lastAnnouncedRef.current && lastAnnouncedRef.current.text === text && now - lastAnnouncedRef.current.time < 2000) {
      // Prevent double announcement of the same text within 2 seconds
      return;
    }
    lastAnnouncedRef.current = { text, time: now };

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoiceURI) {
        const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === selectedVoiceURI);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      // Slight delay to prevent doubling/glitching on some browsers after cancel()
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  }, [isVoiceEnabled, selectedVoiceURI]);

  return {
    isVoiceEnabled,
    toggleVoice,
    voices,
    selectedVoiceURI,
    selectVoice,
    announce,
    isSpeaking
  };
};
