import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, CheckCircle2, Copy } from 'lucide-react';
import { toBengaliNumber } from '../utils/formatters';
import { copyToClipboard } from '../../../utils/clipboard';

interface YouTubeLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  appLang: 'en' | 'bn';
  downloadedLinks: { url: string; title: string; timestamp: string }[];
  visitedLinks: Set<string>;
  markLinkVisited: (url: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const YouTubeLinkModal: React.FC<YouTubeLinkModalProps> = ({
  isOpen,
  onClose,
  isDark,
  appLang,
  downloadedLinks,
  visitedLinks,
  markLinkVisited,
  addToast
}) => {
  // Filter for today's links
  const today = new Date();
  const todayStr = today.toDateString();
  
  const todaysLinks = downloadedLinks.filter(link => {
    const linkDate = new Date(link.timestamp);
    return linkDate.toDateString() === todayStr;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group by hour
  const groupedLinks: Record<string, typeof downloadedLinks> = {};
  
  const formatDate = (date: Date, lang: 'en' | 'bn') => {
    if (lang === 'bn') {
      const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      return `${toBengaliNumber(date.getDate())} ${months[date.getMonth()]} ${toBengaliNumber(date.getFullYear())}`;
    }
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  
  todaysLinks.forEach(link => {
    const date = new Date(link.timestamp);
    const hour = date.getHours();
    
    const formatHour = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      if (appLang === 'bn') {
        const bnAmpm = h >= 12 ? 'পিএম' : 'এএম';
        return `${toBengaliNumber(h12)}:০০ ${bnAmpm}`;
      }
      return `${h12}:00 ${ampm}`;
    };
    
    const dateStr = formatDate(date, appLang);
    const groupKey = `${dateStr}, ${formatHour(hour)} - ${formatHour((hour + 1) % 24)}`;
    
    if (!groupedLinks[groupKey]) {
      groupedLinks[groupKey] = [];
    }
    groupedLinks[groupKey].push(link);
  });

  // Sort groups by hour (descending - latest first)
  const sortedGroups = Object.entries(groupedLinks).sort((a, b) => {
    const timeA = new Date(a[1][0].timestamp).getTime();
    const timeB = new Date(b[1][0].timestamp).getTime();
    return timeB - timeA;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh] ${
              isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'
            }`}
          >
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <LinkIcon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {appLang === 'bn' ? 'আজকের ডাউনলোড করা লিংকসমূহ' : 'Today\'s Downloaded Links'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  {appLang === 'bn' ? toBengaliNumber(todaysLinks.length) : todaysLinks.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 relative">
              {sortedGroups.length === 0 ? (
                <div className="text-center py-12">
                  <LinkIcon className={`w-12 h-12 mx-auto mb-3 opacity-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    {appLang === 'bn' ? 'আজকের কোনো লিংক পাওয়া যায়নি' : 'No links found for today'}
                  </p>
                </div>
              ) : (
                sortedGroups.map(([groupKey, links]) => (
                  <div key={groupKey} className="space-y-3">
                    <div className={`sticky top-0 z-10 py-2 px-3 -mx-2 rounded-lg backdrop-blur-md font-medium text-sm border-b ${
                      isDark 
                        ? 'bg-gray-900/90 border-gray-800 text-gray-300' 
                        : 'bg-white/90 border-gray-100 text-gray-600'
                    }`}>
                      {groupKey}
                    </div>
                    <div className="space-y-3">
                      {links.map((link, idx) => {
                        const isVisited = visitedLinks.has(link.url);
                        return (
                        <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} ${isVisited ? 'opacity-70' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate mb-1 ${isVisited ? (isDark ? 'text-gray-400' : 'text-gray-500') : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>
                              <span className="mr-2 opacity-50">{appLang === 'bn' ? toBengaliNumber(idx + 1) : idx + 1}.</span>
                              {link.title}
                            </h4>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={() => markLinkVisited(link.url)}
                              className={`text-xs truncate block hover:underline ${isVisited ? (isDark ? 'text-purple-400' : 'text-purple-600') : (isDark ? 'text-blue-400' : 'text-blue-600')}`}
                            >
                              {link.url}
                            </a>
                          </div>
                          <button
                            onClick={async () => {
                              const success = await copyToClipboard(link.url);
                              if (success) {
                                markLinkVisited(link.url);
                                addToast(appLang === 'bn' ? 'লিংক কপি করা হয়েছে' : 'Link copied', 'success');
                              } else {
                                addToast(appLang === 'bn' ? 'লিংক কপি করতে সমস্যা হয়েছে' : 'Failed to copy link', 'error');
                              }
                            }}
                            className={`p-2 rounded-lg transition-colors shrink-0 flex items-center gap-2 ${isVisited ? (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200')}`}
                            title={appLang === 'bn' ? 'কপি করুন' : 'Copy'}
                          >
                            {isVisited ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span className="text-xs font-medium hidden sm:block">{isVisited ? (appLang === 'bn' ? 'কপিড' : 'Copied') : (appLang === 'bn' ? 'কপি' : 'Copy')}</span>
                          </button>
                        </div>
                      )})}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
