import { useState, useEffect } from 'react';
import { translations } from '../translations';

export const useAppTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'default');
  const [appLang, setAppLang] = useState<'bn' | 'en'>(() => (localStorage.getItem('app-lang') as 'bn' | 'en') || 'bn');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('app-font-size') || '16'));
  const [transcriptionMode, setTranscriptionMode] = useState<'normal' | 'pro'>(() => (localStorage.getItem('app-transcription-mode') as 'normal' | 'pro') || 'pro');

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-lang', appLang);
  }, [appLang]);

  useEffect(() => {
    localStorage.setItem('app-font-size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('app-transcription-mode', transcriptionMode);
  }, [transcriptionMode]);

  const isDark = theme === 'soft-dark';
  const t = translations[appLang];

  const activeColors = isDark ? {
    primary: 'bg-indigo-600',
    text: 'text-indigo-400',
    border: 'border-indigo-500/50',
    soft: 'bg-indigo-900/20',
    ring: 'ring-indigo-500'
  } : {
    primary: 'bg-indigo-600',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    soft: 'bg-indigo-50',
    ring: 'ring-indigo-200'
  };

  const mainBgColor = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const textColor = isDark ? 'text-white' : 'text-slate-800';
  const cardBg = isDark ? 'bg-slate-800 backdrop-blur-md' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-700' : 'border-slate-100';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';

  return {
    theme,
    setTheme,
    appLang,
    setAppLang,
    fontSize,
    setFontSize,
    isDark,
    t,
    activeColors,
    mainBgColor,
    textColor,
    cardBg,
    cardBorder,
    subTextColor,
    transcriptionMode,
    setTranscriptionMode
  };
};
