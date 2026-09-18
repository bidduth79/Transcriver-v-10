import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInformationModal } from './hooks/useInformationModal';
import { getGuideData, getTabs } from './utils/informationData';

interface InformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeColors: any;
  appLang: 'bn' | 'en';
  addToast?: (msg: string, type: any) => void;
}

export const InformationModal: React.FC<InformationModalProps> = ({ isOpen, onClose, isDark, activeColors, appLang, addToast }) => {
  const {
    activeTab, setActiveTab,
    isMinimized, setIsMinimized,
    isMaximized, setIsMaximized,
    size,
    startResizing,
    runDbSetup
  } = useInformationModal({ addToast, appLang });

  const guideData = getGuideData(appLang);
  const tabs = getTabs(appLang);

  const currentData = guideData[activeTab as keyof typeof guideData];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Minimized Floating Widget */}
          {isMinimized && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-24 right-20 z-[120]"
            >
               <div 
                 onClick={() => setIsMinimized(false)}
                 className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border cursor-pointer hover:scale-105 transition-transform ${isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
               >
                  <div className={`w-3 h-3 rounded-full ${activeColors.primary}`}></div>
                  <span className="text-xs font-bold uppercase tracking-widest">{appLang === 'bn' ? 'নির্দেশিকা' : 'Guide'}</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
            </motion.div>
          )}

          {/* Full Modal */}
          {!isMinimized && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-0 bg-slate-950/80 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                id="info-modal-container"
        className={`rounded-[3rem] border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        style={{ 
            width: isMaximized ? '100vw' : `${size.width}px`, 
            height: isMaximized ? '100vh' : `${size.height}px`,
            maxWidth: isMaximized ? '100vw' : '95vw', 
            maxHeight: isMaximized ? '100vh' : '95vh',
            borderRadius: isMaximized ? '0' : '3rem'
        }}
      >
        
        {/* Header */}
        <header className="px-10 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0 relative z-20 cursor-move">
          <div className="flex items-center gap-5 group">
            <div className={`w-12 h-12 ${activeColors.primary} rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-stylish-bn leading-none transition-colors group-hover:text-white/90">{appLang === 'bn' ? 'ব্যবহার নির্দেশিকা' : 'USER MANUAL'}</h2>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-1">LI CELL STUDIO V4.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(true)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5 group"><svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"/></svg></button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5 group"><svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4M4 20v4m0 0h4M20 20v4m0 0h-4"/></svg></button>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-all border border-white/10 group"><svg className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative z-10">
          
          {/* Sidebar Navigation */}
          <aside className={`w-64 flex flex-col gap-2 p-6 border-r overflow-y-auto custom-scrollbar ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-left group relative overflow-hidden ${activeTab === tab.id ? `${activeColors.primary} text-white shadow-lg` : `hover:bg-black/5 ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}`}
               >
                 <div className={`w-6 h-6 flex items-center justify-center ${activeTab === tab.id ? 'text-white' : 'opacity-60'}`}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{tab.icon}</svg>
                 </div>
                 <span className="text-xs font-black uppercase tracking-widest font-stylish-bn">{tab.label}</span>
                 {activeTab === tab.id && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></div>}
               </button>
             ))}
          </aside>

          {/* Main Content Area */}
          <main className={`flex-1 overflow-y-auto custom-scrollbar p-10 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                   <h3 className={`text-3xl font-black uppercase tracking-tight mb-2 font-stylish-bn ${isDark ? 'text-white' : 'text-slate-800'}`}>{currentData.title}</h3>
                   <p className={`text-sm font-bold opacity-60 ${isDark ? 'text-white' : 'text-slate-600'}`}>{currentData.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {currentData.items.map((item: any, idx: number) => (
                     <div key={idx} className={`p-6 rounded-[2rem] border flex gap-6 group transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-lg'}`}>
                        <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-600 text-white' : 'bg-white text-indigo-600 shadow-md'}`}>
                           <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                        </div>
                        <div>
                           <h4 className={`text-lg font-black uppercase mb-3 font-stylish-bn ${activeColors.text}`}>{item.title}</h4>
                           <p className={`text-sm leading-relaxed font-medium whitespace-pre-line font-stylish-bn ${isDark ? 'text-white/80' : 'text-slate-600'}`}>{item.content}</p>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Pro Tip Box */}
                <div className="mt-10 p-6 rounded-[2rem] bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 flex items-center gap-5">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-lg animate-pulse text-indigo-600 font-bold text-xl">!</div>
                   <div>
                      <h5 className="text-white font-black uppercase tracking-widest text-xs mb-1">PRO TIP</h5>
                      <p className="text-white/80 text-xs font-bold font-stylish-bn">
                        {appLang === 'bn' 
                          ? 'ভালো ফলাফলের জন্য নয়েজ-মুক্ত অডিও ব্যবহার করুন। বড় ফাইলের ক্ষেত্রে "Auto Split" ব্যবহার করলে দ্রুত কাজ হবে।' 
                          : 'Use noise-free audio for best results. For large files, "Auto Split" is faster.'}
                      </p>
                   </div>
                </div>
             </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="px-10 py-6 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between shrink-0 backdrop-blur-sm relative z-20">
           {/* DB Setup Button */}
           <button 
             onClick={runDbSetup}
             className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-slate-700 transition-all border border-white/10 active:scale-95"
           >
             DB SETUP
           </button>

           <button onClick={onClose} className={`px-10 py-3 ${activeColors.primary} text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all`}>
             {appLang === 'bn' ? 'বুঝতে পেরেছি' : 'GOT IT'}
           </button>
        </footer>

        {/* Resize Handle */}
        {!isMaximized && (
          <div 
            onMouseDown={startResizing}
            className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-50 flex items-end justify-end p-1.5 opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4 text-slate-400 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 8h16M4 16h16" /></svg>
          </div>
        )}
      </motion.div>
      </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
