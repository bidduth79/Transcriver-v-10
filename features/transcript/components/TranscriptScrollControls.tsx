import React from 'react';

interface TranscriptScrollControlsProps {
  localScrollPercent: number;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  activeColors: any;
}

export const TranscriptScrollControls: React.FC<TranscriptScrollControlsProps> = ({
  localScrollPercent,
  scrollToTop,
  scrollToBottom,
  activeColors
}) => {
  return (
    <div className="absolute right-4 md:right-8 bottom-1/2 translate-y-1/2 flex flex-col items-center z-50 pointer-events-none hidden md:flex">
      <div className={`pointer-events-auto flex flex-col items-center bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-full py-2 px-1 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-500 scale-90 md:scale-100 ${localScrollPercent > 5 && localScrollPercent < 95 ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-4 hover:opacity-100 hover:translate-x-0'}`}>
        <button 
          onClick={scrollToTop} 
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 mb-1 ${localScrollPercent > 5 ? 'opacity-100 scale-100 text-white hover:bg-white/10' : 'opacity-0 scale-50 pointer-events-none'}`}
          title="Scroll to Top"
        >
          <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <div className="flex flex-col items-center py-2 relative">
            <div className="w-0.5 h-16 bg-white/10 rounded-full overflow-hidden relative">
              <div 
                className={`absolute top-0 left-0 w-full transition-all duration-300 ${activeColors.primary}`}
                style={{ height: `${localScrollPercent}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-black text-white mt-2 rotate-90 whitespace-nowrap tabular-nums">{localScrollPercent}%</span>
        </div>
        <button 
          onClick={scrollToBottom} 
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 mt-1 ${localScrollPercent < 95 ? 'opacity-100 scale-100 text-white hover:bg-white/10' : 'opacity-0 scale-50 pointer-events-none'}`}
          title="Scroll to Bottom"
        >
          <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
