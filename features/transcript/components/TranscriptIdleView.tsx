import React from 'react';

interface TranscriptIdleViewProps {
  t: any;
  fileUrl: string;
  isDark: boolean;
  activeColors: any;
  fileMeta: any;
  setIsSidebarOpen: (open: boolean) => void;
  processTranscription: () => void;
  logoOffset: { x: number; y: number };
  logoContainerRef: React.RefObject<HTMLDivElement | null>;
  handleLogoMouseMove: (e: any) => void;
  handleLogoMouseLeave: () => void;
}

export const TranscriptIdleView: React.FC<TranscriptIdleViewProps> = ({
  t,
  fileUrl,
  isDark,
  activeColors,
  fileMeta,
  setIsSidebarOpen,
  processTranscription,
  logoOffset,
  logoContainerRef,
  handleLogoMouseMove,
  handleLogoMouseLeave
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center select-none p-6 md:p-12 text-center animate-in fade-in duration-500 z-10">
      {!fileUrl ? (
        <div className="relative z-10 flex flex-col items-center">
          
          {/* LOGO AREA */}
          <div 
            className="mb-8 mx-auto relative w-48 h-48 flex items-center justify-center"
            onMouseMove={handleLogoMouseMove}
            onMouseLeave={handleLogoMouseLeave}
            ref={logoContainerRef}
          >
              <div 
                className="transition-transform duration-300 ease-out"
                style={{ transform: `translate(${logoOffset.x}px, ${logoOffset.y}px)` }}
              >
                <div className="animate-float">
                  <img 
                      src="/logo.png" 
                      alt="App Logo" 
                      className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl opacity-90"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%236366f1'/%3E%3Cstop offset='100%25' style='stop-color:%234f46e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' rx='40' fill='url(%23bg)'/%3E%3Crect x='80' y='40' width='40' height='70' rx='20' fill='white'/%3E%3Cpath d='M60 95 Q60 140 100 140 Q140 140 140 95' fill='none' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3Cline x1='100' y1='140' x2='100' y2='165' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3Cline x1='80' y1='165' x2='120' y2='165' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E";
                      }}
                  />
                </div>
              </div>
          </div>
          
          <h3 className={`text-lg md:text-xl font-black uppercase tracking-[0.4em] mb-4 opacity-70 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t.noMedia}</h3>
          <p className={`text-[10px] md:text-xs font-bold max-w-sm leading-relaxed opacity-60 mx-auto ${isDark ? 'text-white' : 'text-slate-700'}`}>{t.noMediaDesc}</p>
          <button onClick={() => setIsSidebarOpen(true)} className={`mt-8 md:mt-10 px-8 md:px-10 py-3 md:py-4 ${activeColors.primary} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-95 transition-all group cursor-pointer`}>
            <svg className="w-4 h-4 mr-2 inline-block transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16m-7 6h7"/>
            </svg>
            {t.openMenu}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center opacity-80 scale-100 md:scale-110 relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 mb-6 animate-bounce">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-xl" onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%236366f1'/%3E%3Cstop offset='100%25' style='stop-color:%234f46e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' rx='40' fill='url(%23bg)'/%3E%3Crect x='80' y='40' width='40' height='70' rx='20' fill='white'/%3E%3Cpath d='M60 95 Q60 140 100 140 Q140 140 140 95' fill='none' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3Cline x1='100' y1='140' x2='100' y2='165' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3Cline x1='80' y1='165' x2='120' y2='165' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E"; }} />
          </div>
          <h3 className={`text-xl md:text-2xl font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t.fileReady}</h3>
          <p className={`text-[10px] md:text-[11px] font-black text-white/80 uppercase tracking-widest bg-black/20 backdrop-blur-md px-3 py-1 rounded-full mb-8 max-w-md truncate shadow-sm border border-white/10`}>{fileMeta.name}</p>
          <button onClick={processTranscription} className={`px-12 md:px-16 py-4 md:py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-full text-xs md:text-sm font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all active:scale-95 border border-white/10 relative overflow-hidden group cursor-pointer`}>
            <span className="relative z-10">{t.startTranscribe}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </div>
      )}
    </div>
  );
};
