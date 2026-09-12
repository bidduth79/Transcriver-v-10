
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  t: any;
  status: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  isInformationOpen: boolean;
  setIsInformationOpen: (v: boolean) => void;
  isActivityLogOpen?: boolean;
  setIsActivityLogOpen?: (v: boolean) => void;
  isDark: boolean;
  setTheme: (f: (p: any) => any) => void;
  appLang: string;
  setAppLang: (f: (p: any) => any) => void;
  activeColors: any;
  setActiveTool?: (tool: string) => void;
  setIsReportOpen?: (v: boolean) => void;
  setIsSettingsOpen?: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  t, status, isSidebarOpen, setIsSidebarOpen, 
  isInformationOpen, setIsInformationOpen,
  isActivityLogOpen, setIsActivityLogOpen,
  isDark, setTheme,
  appLang, setAppLang, activeColors, setActiveTool, setIsReportOpen, setIsSettingsOpen 
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleToolClick = (toolId: string) => {
    if (setActiveTool) setActiveTool(toolId);
    setShowToolsMenu(false);
  };

  return (
    <header className="px-4 md:px-8 py-4 md:py-5 bg-slate-950 border-b border-white/10 flex items-center justify-between z-40 shadow-sm shrink-0">
      <div className="flex items-center space-x-3 md:space-x-4">
        <button 
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2 md:p-2.5 rounded-xl transition-all border border-white/10 group cursor-pointer ${isSidebarOpen ? activeColors.primary + ' text-white border-white/20' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
          title={t.openMenu}
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <div className="bg-white p-2 md:p-2.5 rounded-xl shadow-lg shadow-black/20 group cursor-default hidden sm:block">
          <svg className={`w-5 h-5 md:w-6 md:h-6 ${activeColors.text} transition-all duration-500 group-hover:scale-125 group-hover:rotate-12`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-tight">LI CELL <span className={`${isDark ? 'text-indigo-400' : activeColors.text} hidden sm:inline`}>{t.studio}</span></h1>
          <p className="text-[8px] md:text-[9px] text-white/50 font-black uppercase tracking-widest leading-none mt-0.5 md:mt-1 hidden sm:block">{t.subTitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Mobile Menu Toggle Button */}
        <button 
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`md:hidden p-2 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white group cursor-pointer ${isMobileMenuOpen ? 'bg-white/20 text-white ring-2 ring-indigo-500/50' : ''}`}
          title="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Action Buttons Container */}
        <div className={`${isMobileMenuOpen ? 'absolute top-[70px] right-4 w-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[70] grid grid-cols-4 gap-2 p-3 animate-in fade-in slide-in-from-top-2' : 'hidden md:flex items-center space-x-2 md:space-x-3'}`}>
          {/* Full Screen Button */}
          <button 
            type="button"
            onClick={toggleFullScreen}
            className={`p-2 md:p-2.5 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white group cursor-pointer flex justify-center items-center`}
            title={isFullScreen ? (appLang === 'bn' ? 'ছোট স্ক্রিন' : 'Exit Full Screen') : (appLang === 'bn' ? 'ফুল স্ক্রিন' : 'Full Screen')}
          >
            {isFullScreen ? (
              <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 9L4 4m0 0l5 0m-5 0l0 5M15 9l5-5m0 0l-5 0m5 0l0 5M9 15l-5 5m0 0l5 0m-5 0l0-5M15 15l5 5m0 0l-5 0m5 0l0-5" />
              </svg>
            ) : (
              <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Tools Menu Button */}
          <div className="relative flex justify-center items-center">
            <button 
              type="button"
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className={`p-2 md:p-2.5 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white group cursor-pointer ${showToolsMenu ? 'bg-white/20 text-white ring-2 ring-indigo-500/50' : ''}`}
              title={appLang === 'bn' ? 'টুলস' : 'Tools'}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            </button>

            {/* Tools Dropdown - Dynamic Theme */}
            {showToolsMenu && (
              <div className={`absolute top-full right-0 mt-2 w-56 border rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 bg-slate-900 border-white/10`}>
                <div className="p-1 space-y-1">
                  <button onClick={() => handleToolClick('youtube')} className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all group text-white/90 hover:bg-white/10 hover:text-white`}>
                    <div className="w-6 h-6 bg-red-600/20 text-red-500 rounded-lg flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wide">{appLang === 'bn' ? 'ইউটিউব ডাউনলোড' : 'YouTube DL'}</span>
                  </button>
                  <button onClick={() => handleToolClick('facebook')} className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all group text-white/90 hover:bg-white/10 hover:text-white`}>
                    <div className="w-6 h-6 bg-blue-600/20 text-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wide">{appLang === 'bn' ? 'ফেসবুক ডাউনলোড' : 'Facebook DL'}</span>
                  </button>
                  <button onClick={() => handleToolClick('converter')} className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all group text-white/90 hover:bg-white/10 hover:text-white`}>
                    <div className="w-6 h-6 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wide">{appLang === 'bn' ? 'কনভার্টার' : 'Converter'}</span>
                  </button>
                  <button onClick={() => handleToolClick('video_cut')} className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all group text-white/90 hover:bg-white/10 hover:text-white`}>
                    <div className="w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wide">{appLang === 'bn' ? 'ভিডিও এডিটর' : 'Video Editor'}</span>
                  </button>
                  <button onClick={() => handleToolClick('audio_cut')} className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all group text-white/90 hover:bg-white/10 hover:text-white`}>
                    <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wide">{appLang === 'bn' ? 'অডিও এডিটর' : 'Audio Editor'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Activity Log Button */}
          <button 
            type="button"
            onClick={() => setIsActivityLogOpen && setIsActivityLogOpen(true)}
            className={`p-2 md:p-2.5 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white group cursor-pointer flex justify-center items-center ${isActivityLogOpen ? 'ring-2 ring-indigo-400/50 text-white bg-white/20 border-indigo-400/30' : ''}`}
            title={appLang === 'bn' ? 'অ্যাক্টিভিটি লগ' : 'Activity Logs'}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </button>

          {/* YouTube Monitor Button (New) */}
          <button 
            type="button"
            onClick={() => setActiveTool && setActiveTool('youtube_monitor')}
            className="p-2 md:p-2.5 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white group cursor-pointer flex justify-center items-center"
            title={appLang === 'bn' ? 'ইউটিউব মনিটর' : 'YouTube Monitor'}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-500 group-hover:scale-110 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
          </button>

          {/* Report Button (New) */}
          {setIsReportOpen && (
            <button 
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="p-2 md:p-2.5 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white group cursor-pointer flex justify-center items-center"
              title={appLang === 'bn' ? 'রিপোর্ট' : 'Report'}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}

          <button 
            type="button"
            onClick={() => setIsInformationOpen(!isInformationOpen)} 
            className={`p-2 md:p-2.5 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white group cursor-pointer flex justify-center items-center ${isInformationOpen ? 'ring-2 ring-indigo-400/50 text-white bg-white/20 border-indigo-400/30' : ''}`} 
            title="Information"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button type="button" onClick={() => setTheme(prev => prev === 'default' ? 'soft-dark' : 'default')} className={`p-2 md:p-2.5 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white group cursor-pointer flex justify-center items-center`} title={t.toggleTheme}>
            {isDark ? (
              <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-400 transition-all duration-500 group-hover:scale-125 group-hover:rotate-[30deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 md:w-6 md:h-6 transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12 group-hover:text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Settings Button */}
          {setIsSettingsOpen && (
            <button 
              type="button" 
              onClick={() => setIsSettingsOpen(true)} 
              className={`p-2 md:p-2.5 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white group cursor-pointer flex justify-center items-center`} 
              title={appLang === 'bn' ? 'সেটিংস' : 'Settings'}
            >
              <svg className="w-5 h-5 md:w-6 h-6 transition-all duration-500 group-hover:scale-125 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          
          <button type="button" onClick={() => setAppLang(prev => prev === 'bn' ? 'en' : 'bn')} className={`flex items-center justify-center gap-2 bg-black/20 backdrop-blur-md border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl hover:bg-black/30 group transition-all active:scale-95 mr-0 md:mr-2 cursor-pointer col-span-2 md:col-span-1`}>
            <div className={`${activeColors.primary} w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center text-[9px] md:text-[10px] font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>{appLang === 'bn' ? "EN" : "ব"}</div>
            <span className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-wider transition-colors group-hover:text-white/100 text-white/80 hidden sm:inline">{appLang === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>
          
          <div className="flex-col items-end mr-4 text-right hidden lg:flex cursor-default group">
            <span className="text-[10px] font-bold text-white/60 uppercase leading-none mb-1 tracking-wider group-hover:text-white/90 transition-colors">{t.systemStatus}</span>
            <span className={`text-[11px] font-black leading-none transition-transform group-hover:scale-105 ${status === 'processing' ? 'text-amber-400' : 'text-green-400'}`}>{status === 'processing' ? t.busy : t.online}</span>
          </div>
          
          <button type="button" onClick={() => window.location.reload()} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white border border-transparent hover:border-white/20 group hidden sm:flex justify-center items-center cursor-pointer" title="Refresh">
            <svg className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180 group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
};
