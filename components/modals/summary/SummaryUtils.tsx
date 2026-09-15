import React from 'react';

export const getSentimentLabel = (s: string, appLang: 'bn' | 'en') => {
  if (s === 'positive') return appLang === 'bn' ? 'ইতিবাচক' : 'Positive';
  if (s === 'negative') return appLang === 'bn' ? 'নেতিবাচক' : 'Negative';
  if (s === 'pending') return appLang === 'bn' ? 'বিশ্লেষণ হয়নি' : 'Not Analyzed';
  return appLang === 'bn' ? 'নিউট্রাল' : 'Neutral';
};

export const highlightText = (text: string, term: string) => {
  if (!term) return text;
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === term.toLowerCase() ? 
      <span key={i} className="bg-amber-500/40 text-amber-200 font-black px-1.5 py-0.5 rounded-md border border-amber-500/30">{part}</span> : 
      part
  );
};
