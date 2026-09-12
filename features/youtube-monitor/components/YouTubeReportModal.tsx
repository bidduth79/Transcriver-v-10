import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, RefreshCw, Download, FileText, AlertCircle } from 'lucide-react';
import { toBengaliNumber } from '../utils/formatters';

interface YouTubeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  appLang: 'en' | 'bn';
  completedCount: number;
  errorCount: number;
  onRetryErrors: () => void;
}

export const YouTubeReportModal: React.FC<YouTubeReportModalProps> = ({
  isOpen,
  onClose,
  isDark,
  appLang,
  completedCount,
  errorCount,
  onRetryErrors
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
            isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                errorCount > 0 
                  ? (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600')
                  : (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600')
              }`}>
                {errorCount > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {appLang === 'bn' ? 'প্রসেসিং রিপোর্ট' : 'Processing Report'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Success Card */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-green-500/5 border-green-500/10' : 'bg-green-50 border-green-100'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                    {appLang === 'bn' ? 'সফল হয়েছে' : 'Completed'}
                  </span>
                </div>
                <div className={`text-3xl font-bold ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                  {appLang === 'bn' ? toBengaliNumber(completedCount) : completedCount}
                </div>
              </div>

              {/* Error Card */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50 border-red-100'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                    {appLang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed'}
                  </span>
                </div>
                <div className={`text-3xl font-bold ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                  {appLang === 'bn' ? toBengaliNumber(errorCount) : errorCount}
                </div>
              </div>
            </div>

            {errorCount > 0 && (
              <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {appLang === 'bn' 
                  ? 'কিছু ভিডিও প্রসেস করতে সমস্যা হয়েছে। আপনি চাইলে আবার চেষ্টা করতে পারেন।' 
                  : 'Some videos failed to process. You can retry them.'}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t flex gap-3 ${
            isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'
          }`}>
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              {appLang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
            
            {errorCount > 0 && (
              <button
                onClick={() => {
                  onRetryErrors();
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {appLang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry Errors'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
