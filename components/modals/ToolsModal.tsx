
import React, { useState, useEffect, useRef } from 'react';
import { YouTubeInput } from '../../features/tools/YouTubeInput';
import { ConvertMediaTool } from './tools/ConvertMediaTool';
import { CutMediaTool } from './tools/CutMediaTool';
import { JoinMediaTool } from './tools/JoinMediaTool';

interface ToolsModalProps {
  activeTool: string | null;
  onClose: () => void;
  // Minimization Props
  isMinimized: boolean;
  setIsMinimized: (v: boolean) => void;
  isDark: boolean;
  activeColors: any;
  appLang: 'bn' | 'en';
  addToast: (msg: string, type: any) => void;
  onFileSelect?: (file: File) => void; 
}

export const ToolsModal: React.FC<ToolsModalProps> = ({ 
  activeTool, onClose, isMinimized, setIsMinimized, isDark, activeColors, appLang, addToast, onFileSelect
}) => {
  const validTools = ['downloader', 'converter', 'video_cut', 'audio_cut'];
  if (!activeTool || !validTools.includes(activeTool)) return null;

  const [currentTab, setCurrentTab] = useState<string>('downloader');
  
  // Cutter State
  const [subMode, setSubMode] = useState<'cut' | 'join'>('cut');

  // Resizing State
  const [modalSize, setModalSize] = useState({ width: 1100, height: 850 });
  const [isMaximized, setIsMaximized] = useState(false);
  const isResizing = useRef(false);

  const tabs = [
    { id: 'downloader', label: appLang === 'bn' ? 'ডাউনলোডার' : 'Downloader', icon: <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/> },
    { id: 'converter', label: appLang === 'bn' ? 'কনভার্টার' : 'Converter', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /> },
    { id: 'video_cut', label: appLang === 'bn' ? 'ভিডিও টুলস' : 'Video Tools', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/> },
    { id: 'audio_cut', label: appLang === 'bn' ? 'অডিও টুলস' : 'Audio Tools', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/> }
  ];

  const isMediaTool = currentTab === 'video_cut' || currentTab === 'audio_cut';

  useEffect(() => {
    if (activeTool) {
      setCurrentTab(activeTool);
    }
  }, [activeTool]);

  // --- RESIZING LOGIC ---
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const modalElement = document.getElementById('tools-modal-container');
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      setModalSize({
        width: Math.max(600, e.clientX - rect.left),
        height: Math.max(500, e.clientY - rect.top)
      });
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResizing);
  };

  if (!activeTool) return null;

  const handleDownloadSuccess = async (blob: Blob, fileName: string, mode?: string) => {
    try {
      if (mode === 'transcribe') {
          if (onFileSelect) {
              const file = new File([blob], fileName, { type: blob.type || 'audio/mp3' });
              onFileSelect(file);
              setIsMinimized(true);
              addToast(appLang === 'bn' ? "ট্রান্সক্রিপশন শুরু হচ্ছে... (টুলস মিনিমাইজড)" : "Starting transcription... (Tools Minimized)", 'info');
          }
      } else if (mode === 'browser_download' || (!mode && fileName.startsWith('Cut_')) || (!mode && fileName.startsWith('Joined_'))) {
          // Trigger browser download for Cut and Join operations (they don't save to the project downloads folder automatically)
          // Also allow explicit 'browser_download' mode
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          addToast(appLang === 'bn' ? "ডাউনলোড শুরু হয়েছে (প্রজেক্ট ফোল্ডার চেক করুন)" : "Download Started (Check project downloads folder)", "success");
      } else {
          // It's a YouTube download or Conversion, already saved to the project downloads folder by the server
          addToast(appLang === 'bn' ? "প্রজেক্টের downloads ফোল্ডারে সেভ হয়েছে" : "Saved to project downloads folder", "success");
      }
    } catch (err) {
      console.log('Save cancelled or failed', err);
    }
  };

  return (
    <>
      {/* Minimized Floating Widget - Visible ONLY when isMinimized is true */}
      <div className={`fixed bottom-24 right-20 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300 ${isMinimized ? 'block' : 'hidden'}`}>
           <div 
             onClick={() => setIsMinimized(false)}
             className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border cursor-pointer hover:scale-105 transition-transform group ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
           >
              <div className={`w-10 h-10 rounded-xl ${activeColors.primary} flex items-center justify-center text-white shadow-lg animate-pulse`}>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{appLang === 'bn' ? 'টুলস মিনিমাইজড' : 'TOOLS ACTIVE'}</span>
                 <span className="text-xs font-bold">{appLang === 'bn' ? 'ক্লিক করে খুলুন' : 'Click to Maximize'}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center ml-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </div>
           </div>
        </div>

      {/* Full Modal View - Hidden via CSS when minimized, keeping state intact */}
      <div className={`fixed inset-0 z-[200] flex items-center justify-center p-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300 ${isMinimized ? 'hidden' : 'flex'}`}>
      <div 
        id="tools-modal-container"
        className={`rounded-[3rem] border shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        style={{ 
            width: isMaximized ? '100vw' : `${modalSize.width}px`, 
            height: isMaximized ? '100vh' : `${modalSize.height}px`,
            maxWidth: isMaximized ? '100vw' : '98vw', 
            maxHeight: isMaximized ? '100vh' : '98vh',
            borderRadius: isMaximized ? '0' : '3rem'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0 cursor-move" onMouseDown={(e) => {}}>
          <div className="flex items-center gap-4 group">
            <div className={`w-12 h-12 ${activeColors.primary} rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
              <svg className="w-6 h-6 text-white transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight font-stylish-bn transition-colors group-hover:text-white/90">{appLang === 'bn' ? 'টুলস ও ইউটিলিটি' : 'Tools & Utilities'}</h2>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{appLang === 'bn' ? 'মিডিয়া প্রসেসিং সেন্টার' : 'Media Processing Center'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
              <button onClick={() => setIsMinimized(true)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/10 bg-white/5 group" title="Minimize">
                <svg className="w-5 h-5 mb-1 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
              </button>
              <button onClick={() => setIsMaximized(!isMaximized)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/10 bg-white/5 group" title="Maximize">
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4"/></svg>
              </button>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white rounded-full transition-all border border-white/10 bg-white/5 group" title="Close">
                <svg className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className={`w-20 md:w-64 border-r flex flex-col p-4 gap-2 overflow-y-auto custom-scrollbar ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group cursor-pointer ${currentTab === tab.id ? `${activeColors.primary} text-white shadow-lg` : isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center ${currentTab === tab.id ? 'text-white' : isDark ? 'opacity-60 group-hover:opacity-100' : 'text-slate-500 group-hover:text-slate-900'}`}>
                  <svg className="w-5 h-5" fill={tab.id === 'downloader' ? 'currentColor' : 'none'} stroke={tab.id === 'downloader' ? 'none' : 'currentColor'} viewBox="0 0 24 24">
                    {tab.icon}
                  </svg>
                </div>
                <span className={`text-xs font-black uppercase tracking-wider hidden md:block ${currentTab === tab.id ? 'text-white' : isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar relative">
            <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${activeColors.primary} mix-blend-overlay`}></div>
            
            {currentTab === 'downloader' && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2">
                  <h3 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    YouTube & Facebook Downloader
                  </h3>
                  <p className="text-xs font-bold opacity-50 uppercase tracking-widest">
                    {appLang === 'bn' ? 'ভিডিও বা অডিও ডাউনলোড করুন' : 'Download Video or Audio'}
                  </p>
                </div>
                
                <YouTubeInput 
                  onSuccess={handleDownloadSuccess}
                  isDark={isDark}
                  activeColors={activeColors}
                  appLang={appLang}
                  platform="youtube"
                  allowVideo={true}
                  showFormats={true} 
                />
              </div>
            )}

            {currentTab === 'converter' && (
                <ConvertMediaTool 
                    isDark={isDark} 
                    activeColors={activeColors} 
                    appLang={appLang} 
                    addToast={addToast} 
                />
            )}

            {isMediaTool && (
              <div className="max-w-4xl mx-auto flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex justify-center mb-8">
                    <div className={`p-1 rounded-xl flex gap-1 ${isDark ? 'bg-black/20' : 'bg-slate-200'}`}>
                       <button onClick={() => setSubMode('cut')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${subMode === 'cut' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                          {appLang === 'bn' ? 'কাটার' : 'CUTTER'}
                       </button>
                       <button onClick={() => setSubMode('join')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${subMode === 'join' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                          {appLang === 'bn' ? 'জয়েনার' : 'JOINER'}
                       </button>
                    </div>
                 </div>

                 <div className={`w-full p-8 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    
                    {subMode === 'cut' && (
                        <CutMediaTool 
                            isDark={isDark} 
                            activeColors={activeColors} 
                            appLang={appLang} 
                            addToast={addToast} 
                            currentTab={currentTab} 
                            onFileSelect={onFileSelect} 
                            setIsMinimized={setIsMinimized} 
                        />
                    )}

                    {subMode === 'join' && (
                        <JoinMediaTool 
                            isDark={isDark} 
                            activeColors={activeColors} 
                            appLang={appLang} 
                            addToast={addToast} 
                            currentTab={currentTab} 
                        />
                    )}
                 </div>
              </div>
            )}
          </div>
        </div>
        {!isMaximized && (
            <div onMouseDown={startResizing} className="absolute bottom-2 right-2 w-10 h-10 cursor-nwse-resize flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity z-[200]"><svg className="w-6 h-6 text-slate-400 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M22 22h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm8-8h-2v-2h2v2zm-12 8h-2v-2h2v2z"/></svg></div>
        )}
      </div>
      </div>
    </>
  );
};
