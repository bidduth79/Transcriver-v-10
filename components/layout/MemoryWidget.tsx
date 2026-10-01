import React, { useState, useEffect } from 'react';

export const MemoryWidget: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [memory, setMemory] = useState<{ used: number; total: number; limit: number } | null>(null);

  useEffect(() => {
    // Only available in Chrome-based browsers
    const perf = performance as any;
    if (!perf.memory) return;

    const updateMemory = () => {
      setMemory({
        used: Math.round(perf.memory.usedJSHeapSize / (1024 * 1024)),
        total: Math.round(perf.memory.totalJSHeapSize / (1024 * 1024)),
        limit: Math.round(perf.memory.jsHeapSizeLimit / (1024 * 1024))
      });
    };

    updateMemory();
    const interval = setInterval(updateMemory, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!memory) return null;

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
        isDark ? 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
      }`}
      title={`Total: ${memory.total}MB | Limit: ${memory.limit}MB`}
    >
      <div className={`w-2 h-2 rounded-full ${memory.used > memory.limit * 0.8 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}></div>
      <span>MEM: {memory.used} MB</span>
    </div>
  );
};
