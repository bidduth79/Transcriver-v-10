
import React, { useState, useRef, useEffect } from 'react';
import { QuotaMonitor } from './QuotaMonitor';
import { SettingsApiKeys } from './settings/SettingsApiKeys';
import { SettingsKeywords } from './settings/SettingsKeywords';
import { SettingsSync } from './settings/SettingsSync';
import { SettingsSystem } from './settings/SettingsSystem';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeColors: any;
  appLang: 'bn' | 'en';
  addToast: (m: string, t: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDark, activeColors, appLang, addToast }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'quota' | 'sync' | 'keywords' | 'system'>('keys');
  
  // Window State
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [size, setSize] = useState({ width: 700, height: 600 });
  const isResizing = useRef(false);

  useEffect(() => {
    if (isOpen) {
        setIsMinimized(false); 
    }
  }, [isOpen]);

  // --- Resizing Logic ---
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const modalElement = document.getElementById('settings-modal-container');
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      setSize({
        width: Math.max(400, e.clientX - rect.left),
        height: Math.max(400, e.clientY - rect.top)
      });
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResizing);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized Floating Widget */}
      <div className={`fixed bottom-24 right-20 z-[120] animate-in slide-in-from-bottom-10 fade-in duration-300 ${isMinimized ? 'block' : 'hidden'}`}>
         <div 
           onClick={() => setIsMinimized(false)}
           className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border cursor-pointer hover:scale-105 transition-transform ${isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
         >
            <div className={`w-3 h-3 rounded-full ${activeColors.primary}`}></div>
            <span className="text-xs font-bold uppercase tracking-widest">{appLang === 'bn' ? 'সেটিংস' : 'Settings'}</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
         </div>
      </div>

      {/* Full Modal */}
      <div className={`fixed inset-0 z-[110] flex items-center justify-center p-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300 ${isMinimized ? 'hidden' : 'flex'}`}>
      <div 
        id="settings-modal-container"
        className={`rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        style={{ 
            width: isMaximized ? '100vw' : `${size.width}px`, 
            height: isMaximized ? '100vh' : `${size.height}px`,
            maxWidth: isMaximized ? '100vw' : '95vw', 
            maxHeight: isMaximized ? '100vh' : '95vh',
            borderRadius: isMaximized ? '0' : '3rem'
        }}
      >
        <header className="px-10 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0 cursor-move">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight font-stylish-bn">সিস্টেম সেটিংস</h2>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">MANUAL CONFIGURATION</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(true)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white group">
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"/></svg>
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white group">
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4M4 20v4m0 0h4M20 20v4m0 0h-4"/></svg>
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white rounded-full transition-all text-white/60 group">
                <svg className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className={`flex items-center px-10 pt-6 gap-6 border-b shrink-0 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <button 
                onClick={() => setActiveTab('keys')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'keys' ? `border-b-4 ${activeColors.border} ${activeColors.text}` : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
                {appLang === 'bn' ? 'এপিআই কি ম্যানেজমেন্ট' : 'API KEY MANAGEMENT'}
            </button>
            <button 
                onClick={() => setActiveTab('quota')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'quota' ? `border-b-4 ${activeColors.border} ${activeColors.text}` : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
                {appLang === 'bn' ? 'কোটা মনিটর' : 'QUOTA MONITOR'}
            </button>
            <button 
                onClick={() => setActiveTab('keywords')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'keywords' ? `border-b-4 ${activeColors.border} ${activeColors.text}` : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
                {appLang === 'bn' ? 'সংবেদনশীল শব্দ' : 'SENSITIVE KEYWORDS'}
            </button>
            <button 
                onClick={() => setActiveTab('sync')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sync' ? `border-b-4 ${activeColors.border} ${activeColors.text}` : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
                {appLang === 'bn' ? 'ক্লাউড সিঙ্ক' : 'CLOUD SYNC'}
            </button>
            <button 
                onClick={() => setActiveTab('system')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'system' ? `border-b-4 ${activeColors.border} ${activeColors.text}` : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
                {appLang === 'bn' ? 'সিস্টেম' : 'SYSTEM'}
            </button>
        </div>

        <div className="flex-1 p-10 overflow-hidden flex flex-col">
          {activeTab === 'keys' && (
            <SettingsApiKeys isDark={isDark} activeColors={activeColors} appLang={appLang} addToast={addToast} />
          )}
          
          {activeTab === 'quota' && (
            <QuotaMonitor 
              isDark={isDark} 
              appLang={appLang} 
              activeColors={activeColors} 
            />
          )}

          {activeTab === 'keywords' && (
            <SettingsKeywords isDark={isDark} activeColors={activeColors} appLang={appLang} addToast={addToast} />
          )}

          {activeTab === 'sync' && (
            <SettingsSync isDark={isDark} activeColors={activeColors} appLang={appLang} addToast={addToast} />
          )}

          {activeTab === 'system' && (
            <SettingsSystem isDark={isDark} activeColors={activeColors} appLang={appLang} addToast={addToast} />
          )}
        </div>

        {!isMaximized && (
            <div 
            onMouseDown={startResizing}
            className="absolute bottom-2 right-2 w-10 h-10 cursor-nwse-resize flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity z-[200]"
            >
            <svg className="w-6 h-6 text-slate-400 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 22h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm8-8h-2v-2h2v2zm-12 8h-2v-2h2v2z"/>
            </svg>
            </div>
        )}
      </div>
      </div>
    </>
  );
};
