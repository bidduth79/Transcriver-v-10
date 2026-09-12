import React from 'react';
import { FailedFile } from '../../hooks/useBatchProcessor';

interface BatchSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedCount: number;
  failedFiles: FailedFile[];
  onRetryFailed: () => void;
  appLang: 'bn' | 'en';
  isDark: boolean;
  activeColors: any;
}

export const BatchSummaryModal: React.FC<BatchSummaryModalProps> = ({
  isOpen,
  onClose,
  processedCount,
  failedFiles,
  onRetryFailed,
  appLang,
  isDark,
  activeColors
}) => {
  if (!isOpen) return null;

  const totalFiles = processedCount + failedFiles.length;
  const hasFailed = failedFiles.length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 sm:p-8 border-b ${isDark ? 'border-white/10' : 'border-slate-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasFailed ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {hasFailed ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <div>
              <h3 className={`text-xl font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {appLang === 'bn' ? 'ব্যাচ প্রসেসিং রিপোর্ট' : 'Batch Processing Report'}
              </h3>
              <p className={`text-sm mt-1 font-medium ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                {appLang === 'bn' ? `মোট ${totalFiles}টি ফাইল প্রসেস করা হয়েছে` : `Processed ${totalFiles} files in total`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                {appLang === 'bn' ? 'সফল হয়েছে' : 'Succeeded'}
              </p>
              <p className="text-4xl font-black text-emerald-500 tabular-nums">{processedCount}</p>
            </div>
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                {appLang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed'}
              </p>
              <p className={`text-4xl font-black tabular-nums ${hasFailed ? 'text-rose-500' : isDark ? 'text-white/20' : 'text-slate-300'}`}>{failedFiles.length}</p>
            </div>
          </div>

          {hasFailed && (
            <div>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-white/70' : 'text-slate-700'}`}>
                {appLang === 'bn' ? 'ব্যর্থ ফাইলসমূহ' : 'Failed Files'}
              </h4>
              <div className="space-y-3">
                {failedFiles.map((failed, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isDark ? 'bg-rose-500/5 border-rose-500/10' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <div className="truncate">
                        <p className={`text-sm font-bold truncate ${isDark ? 'text-white/90' : 'text-slate-800'}`}>{failed.file.name}</p>
                        <p className={`text-xs truncate ${isDark ? 'text-rose-400/70' : 'text-rose-600/70'}`}>{failed.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`p-6 sm:p-8 border-t ${isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-100 bg-slate-50'} flex gap-4`}>
          {hasFailed ? (
            <>
              <button 
                onClick={onClose}
                className={`flex-1 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all border ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                {appLang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button 
                onClick={() => {
                  onRetryFailed();
                  onClose();
                }}
                className={`flex-1 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] ${activeColors.primary}`}
              >
                {appLang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Failed'}
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] ${activeColors.primary}`}
            >
              {appLang === 'bn' ? 'ঠিক আছে' : 'OK'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
