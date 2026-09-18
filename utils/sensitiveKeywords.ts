import { useAppStore } from '../hooks/useAppStore';

export const getDefaultKeywords = () => [
  'বিজিবি', 'bgb', 'বিডিআর', 'বিডিয়ার', 'bdr', 'dg bgb', 'dg bdr',
  'বিজিবি মহাপরিচালক', 'সীমান্ত', 'বিজিবি সিও', 'বিজিবি অধিনায়ক',
  'বর্ডার গার্ড', 'বর্ডার গার্ড বাংলাদেশ', 'বিএসএফ', 'বিএসএফ ডিজি', 'বিএসএফ মহাপরিচালক',
  'ডিজি বিজিবি', 'মাদক', 'চোরাচালান', 'অস্ত্র', 'গোলাবারুদ', 'পিলখানা', 'পুশইন', 'পুশব্যাক'
];

export const getSensitiveKeywords = () => {
  try {
    const stored = localStorage.getItem('sensitive_keywords');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse sensitive keywords from localStorage", e);
  }
  return getDefaultKeywords();
};

export const setSensitiveKeywords = (keywords: string[]) => {
  localStorage.setItem('sensitive_keywords', JSON.stringify(keywords));
  // Dispatch a custom event to notify components that keywords have changed
  useAppStore.getState().triggerSensitiveKeywordsUpdate();
};
