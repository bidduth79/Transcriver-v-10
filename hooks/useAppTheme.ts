import { useThemeStore } from './useThemeStore';
import { translations } from '../translations';

export const useAppTheme = () => {
  const theme = useThemeStore(state => state.theme);
  const setTheme = useThemeStore(state => state.setTheme);
  const appLang = useThemeStore(state => state.appLang);
  const setAppLang = useThemeStore(state => state.setAppLang);
  const fontSize = useThemeStore(state => state.fontSize);
  const setFontSize = useThemeStore(state => state.setFontSize);
  const transcriptionMode = useThemeStore(state => state.transcriptionMode);
  const setTranscriptionMode = useThemeStore(state => state.setTranscriptionMode);

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
