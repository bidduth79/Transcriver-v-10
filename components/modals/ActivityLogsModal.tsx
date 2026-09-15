
import React, { useState, useEffect, useRef } from 'react';
import { getAllFromStore, STORES } from '../../services/db';
import { SystemLogItem } from '../../services/SystemLogger';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeColors: any;
  appLang: 'bn' | 'en';
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({ isOpen, onClose, isDark, activeColors, appLang }) => {
  const [logs, setLogs] = useState<SystemLogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLogItem[]>([]);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Window State
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [size, setSize] = useState({ width: 1000, height: 750 });
  const isResizing = useRef(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      setIsMinimized(false);
    }
    
    const handleLogsUpdate = () => {
      if (isOpen) loadLogs();
    };
    window.addEventListener(`store-updated-activity_logs`, handleLogsUpdate);
    return () => window.removeEventListener(`store-updated-activity_logs`, handleLogsUpdate);
  }, [isOpen]);

  const loadLogs = async () => {
    try {
      const data = (await getAllFromStore(STORES.SYSTEM_ACTIVITY_LOGS)) as SystemLogItem[];
      if (!Array.isArray(data)) return;
      
      const validData = data.filter(item => item != null);

      // Sort Newest First
      validData.sort((a: any, b: any) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });
      setLogs(validData);
      setFilteredLogs(validData);
    } catch (error) {
      console.error("Failed to load activity logs:", error);
    }
  };

  useEffect(() => {
    let res = logs;

    if (filterCategory !== 'ALL') {
        res = res.filter(l => l.category === filterCategory);
    }
    if (filterStatus !== 'ALL') {
        res = res.filter(l => l.status === filterStatus);
    }
    if (dateFrom) {
        res = res.filter(l => new Date(l.timestamp) >= new Date(dateFrom));
    }
    if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59);
        res = res.filter(l => new Date(l.timestamp) <= end);
    }

    setFilteredLogs(res);
  }, [filterCategory, filterStatus, dateFrom, dateTo, logs]);

  // --- Resizing Logic ---
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const modalElement = document.getElementById('logs-modal-container');
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      setSize({
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

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'SUCCESS': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
          case 'ERROR': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
          case 'WARNING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
          default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      }
  };

  const safeFormatDate = (dateStr: string | undefined) => {
    if (!dateStr) return { date: 'N/A', time: 'N/A', valid: false };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: 'Invalid', time: 'Invalid', valid: false };
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString(),
      valid: true
    };
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
            <span className="text-xs font-bold uppercase tracking-widest">{appLang === 'bn' ? 'লগস' : 'Logs'}</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
         </div>
      </div>

      {/* Full Modal - Hidden via CSS when minimized */}
      <div className={`fixed inset-0 z-[115] flex items-center justify-center p-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300 ${isMinimized ? 'hidden' : 'flex'}`}>
      <div 
        id="logs-modal-container"
        className={`rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        style={{ 
            width: isMaximized ? '100vw' : `${size.width}px`, 
            height: isMaximized ? '100vh' : `${size.height}px`,
            maxWidth: isMaximized ? '100vw' : '95vw', 
            maxHeight: isMaximized ? '100vh' : '95vh',
            borderRadius: isMaximized ? '0' : '3rem'
        }}
      >
        
        {/* Header */}
        <header className="px-10 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0 cursor-move">
          <div className="flex items-center gap-5 group">
            <div className={`w-14 h-14 ${activeColors.primary} rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
               <svg className="w-7 h-7 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-stylish-bn transition-colors group-hover:text-white/90">{appLang === 'bn' ? 'অ্যাক্টিভিটি মনিটর' : 'Activity Monitor'}</h2>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">SYSTEM LOGS & DIAGNOSTICS</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(true)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5 group">
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"/></svg>
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5 group">
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4"/></svg>
            </button>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/10 group">
                <svg className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className={`p-6 border-b flex flex-wrap gap-4 items-center shrink-0 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex gap-2">
                <select className={`px-4 py-2 rounded-xl text-xs font-bold border outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="ALL">All Groups</option>
                    <option value="TRANSCRIPTION">Transcription</option>
                    <option value="API_KEY">API Key</option>
                    <option value="REPORT">Report</option>
                    <option value="ANALYSIS">Analysis</option>
                    <option value="SYSTEM">System</option>
                </select>
                <select className={`px-4 py-2 rounded-xl text-xs font-bold border outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="ALL">All Status</option>
                    <option value="SUCCESS">Success</option>
                    <option value="ERROR">Error</option>
                    <option value="WARNING">Warning</option>
                </select>
            </div>
            <div className={`h-8 w-px mx-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
            <div className="flex gap-2 items-center">
                <span className="text-[10px] font-black uppercase text-slate-400">Date:</span>
                <input type="date" className={`px-3 py-2 rounded-xl text-xs font-bold border ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <span className="text-slate-400">-</span>
                <input type="date" className={`px-3 py-2 rounded-xl text-xs font-bold border ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className={`ml-auto px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                {filteredLogs.length} Records
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                        <p className="text-xl font-black uppercase tracking-widest">NO LOGS FOUND</p>
                    </div>
                ) : (
                    filteredLogs.map(log => {
                        if (!log) return null;
                        return (
                        <div key={log.id || Math.random().toString()} className={`p-5 rounded-2xl border transition-all hover:bg-black/5 flex items-start gap-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex flex-col items-center gap-2 pt-1 shrink-0 w-24">
                                <span className="text-[10px] font-mono font-bold opacity-50">{safeFormatDate(log.timestamp).date}</span>
                                <span className="text-xs font-mono font-black">{safeFormatDate(log.timestamp).time}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getStatusColor(log.status)}`}>{log.status}</span>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{log.category}</span>
                                </div>
                                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{log.message}</p>
                                {log.details && (
                                    <p className={`text-xs mt-2 font-mono p-2 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-black/5 text-slate-500'}`}>
                                        {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                                    </p>
                                )}
                            </div>
                        </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Resize Handle */}
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
