import React from 'react';

interface TranscriptErrorViewProps {
  errorMessage: string;
  isDark: boolean;
  setStatus: (status: any) => void;
}

export const TranscriptErrorView: React.FC<TranscriptErrorViewProps> = ({
  errorMessage,
  isDark,
  setStatus
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 text-center animate-in fade-in duration-500 z-10">
      <div className="w-20 h-20 md:w-24 md:h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20 backdrop-blur-md">
        <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-xl md:text-2xl font-black text-red-500 uppercase tracking-widest mb-4">এরর হয়েছে!</h3>
      <p className={`text-xs md:text-sm font-bold max-w-md leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{errorMessage}</p>
      <button onClick={() => setStatus('idle')} className="mt-8 px-8 md:px-10 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl cursor-pointer">
        নতুন করে চেষ্টা করুন
      </button>
    </div>
  );
};
