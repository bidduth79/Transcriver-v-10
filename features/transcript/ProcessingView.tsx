
import React from 'react';
import { useProcessingView } from './hooks/useProcessingView';

export const ProcessingView = ({
  t, isDark, textColor, activeColors, progress, currentStage, elapsedSeconds, estimatedSeconds
}: any) => {
  const { formatTime, remainingSeconds, BACKGROUND_IMAGE_URL } = useProcessingView(estimatedSeconds, elapsedSeconds);

  return (
    // Changed to absolute to fit inside the parent container instead of covering the whole screen
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 overflow-hidden animate-in fade-in duration-500">
      
      {/* --- BACKGROUND IMAGE START --- */}
      <img 
          src={BACKGROUND_IMAGE_URL}
          alt="Processing Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-100 pointer-events-none"
      />
      {/* Overlay to ensure text readability - Light glass effect */}
      <div className={`absolute inset-0 backdrop-blur-md pointer-events-none ${isDark ? 'bg-slate-900/60' : 'bg-white/60'}`}></div>
      {/* --- BACKGROUND IMAGE END --- */}

      <div className="relative flex flex-col items-center w-full max-w-2xl z-10">
        
        {/* Floating Central Icon - Reverted to Bolt SVG */}
        <div className="relative mb-12 animate-float group">
           <div className={`w-32 h-32 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex items-center justify-center border relative backdrop-blur-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white/80 border-white/40'}`}>
              <svg className={`w-16 h-16 ${activeColors.text} animate-pulse transition-transform group-hover:scale-110`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              
              {/* Bolt Badge */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
           </div>
        </div>

        {/* Localized Header */}
        <h3 className={`text-5xl font-black tracking-tight mb-10 uppercase font-stylish-bn bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-b from-white to-white/60' : 'bg-gradient-to-b from-slate-900 to-slate-600'}`}>
          {t.processingHeader}
        </h3>

        {/* Progress Bar Pill */}
        <div className="w-full max-w-md mb-6">
           <div className={`h-6 rounded-full p-1 shadow-inner border relative overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out flex items-center justify-center shadow-lg relative"
                style={{ width: `${progress}%` }}
              >
                 {/* Shine effect on bar */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                 <span className="text-[10px] font-black text-white relative z-10">{Math.round(progress)}%</span>
              </div>
           </div>
        </div>

        {/* Current Stage Message */}
        <div className="mb-12">
           <div className={`px-8 py-3 rounded-full shadow-[0_5px_20px_-5px_rgba(0,0,0,0.05)] border flex items-center gap-3 backdrop-blur-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white/80 border-slate-100'}`}>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
              <p className={`text-[14px] font-bold tracking-wide font-stylish-bn ${isDark ? 'text-white' : 'text-slate-700'}`}>
                {currentStage || "প্রসেসিং চলছে . . ."}
              </p>
           </div>
        </div>

        {/* Time Stats Container */}
        <div className="w-full max-w-md bg-slate-950 rounded-[2.5rem] p-10 flex items-center justify-between shadow-2xl relative overflow-hidden group">
           <div className="flex flex-col items-center flex-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">ESTIMATED</span>
              <span className="text-2xl font-black text-white tabular-nums">{formatTime(estimatedSeconds)}</span>
           </div>
           
           <div className="w-px h-12 bg-white/10 mx-4"></div>
           
           <div className="flex flex-col items-center flex-1">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">REMAINING</span>
              <span className="text-2xl font-black text-white tabular-nums">~{formatTime(remainingSeconds)}</span>
           </div>
           
           {/* Ambient glow inside container */}
           <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-all duration-500"></div>
        </div>

        {/* Neural Engine Footer */}
        <div className="mt-10">
           <div className="bg-indigo-600 px-10 py-3 rounded-full flex items-center gap-4 shadow-xl shadow-indigo-200 active:scale-95 transition-all cursor-default border border-white/10">
              <div className="flex gap-1.5">
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">NEURAL ENGINE ACTIVE</span>
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
