import { create } from 'zustand';

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  appLang: 'bn' | 'en';
  setAppLang: (lang: 'bn' | 'en') => void;
  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;
  transcriptionMode: 'normal' | 'pro';
  setTranscriptionMode: (mode: 'normal' | 'pro') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: localStorage.getItem('app-theme') || 'default',
  setTheme: (theme) => {
    localStorage.setItem('app-theme', theme);
    set({ theme });
  },
  
  appLang: (localStorage.getItem('app-lang') as 'bn' | 'en') || 'bn',
  setAppLang: (appLang) => {
    localStorage.setItem('app-lang', appLang);
    set({ appLang });
  },
  
  fontSize: parseInt(localStorage.getItem('app-font-size') || '16'),
  setFontSize: (size) => set((state) => {
    const newSize = typeof size === 'function' ? size(state.fontSize) : size;
    localStorage.setItem('app-font-size', newSize.toString());
    return { fontSize: newSize };
  }),
  
  transcriptionMode: (localStorage.getItem('app-transcription-mode') as 'normal' | 'pro') || 'pro',
  setTranscriptionMode: (transcriptionMode) => {
    localStorage.setItem('app-transcription-mode', transcriptionMode);
    set({ transcriptionMode });
  }
}));
