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
      className={`fixed bottom-12 right-4 z-50 p-2 text-xs font-mono rounded border backdrop-blur-md shadow-lg ${
        isDark ? 'bg-black/50 border-white/10 text-white/80' : 'bg-white/50 border-black/10 text-black/80'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${memory.used > memory.limit * 0.8 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
        <span className="font-semibold">Memory Usage</span>
      </div>
      <div>Used: {memory.used} MB</div>
      <div>Total: {memory.total} MB</div>
      <div className="text-[10px] opacity-70">Limit: {memory.limit} MB</div>
    </div>
  );
};
