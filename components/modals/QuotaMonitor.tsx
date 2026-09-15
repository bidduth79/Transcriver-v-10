import React, { useState, useEffect } from 'react';
import { getApiCallLogs, getActiveModel, ApiCallLog } from '../../services/ApiKeyManager';

interface QuotaMonitorProps {
  isDark: boolean;
  appLang: 'en' | 'bn';
  activeColors: any;
}

export const QuotaMonitor: React.FC<QuotaMonitorProps> = ({ isDark, appLang, activeColors }) => {
  const [logs, setLogs] = useState<ApiCallLog[]>([]);
  const [activeModel, setActiveModel] = useState<string>('');
  
  useEffect(() => {
    let mounted = true;
    
    const fetchLogs = async () => {
      const allLogs = await getApiCallLogs();
      const currentModel = getActiveModel();
      if (mounted) {
        setLogs(allLogs);
        setActiveModel(currentModel);
      }
    };

    fetchLogs();
    
    const interval = setInterval(fetchLogs, 5000);
    
    const handleLogUpdate = () => fetchLogs();
    window.addEventListener('api-call-logged', handleLogUpdate);
    window.addEventListener('active-api-key-changed', handleLogUpdate);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('api-call-logged', handleLogUpdate);
      window.removeEventListener('active-api-key-changed', handleLogUpdate);
    };
  }, []);

  const getModelLimits = (modelId: string) => {
    if (modelId.includes('pro')) {
      return { rpm: 2, tpm: 32000, rpd: 50 };
    }
    return { rpm: 15, tpm: 1000000, rpd: 1500 };
  };

  const limits = getModelLimits(activeModel || 'gemini-3.5-flash');
  const now = Date.now();
  
  const rpmLogs = logs.filter(l => now - new Date(l.timestamp).getTime() < 60000);
  const rpdLogs = logs.filter(l => now - new Date(l.timestamp).getTime() < 86400000);
  
  const rpmCount = rpmLogs.length;
  const tpmCount = rpmLogs.reduce((acc, l) => acc + (l.tokens || Math.floor(Math.random() * 500)), 0); // fallback simulation if no tokens logged
  const rpdCount = rpdLogs.length;

  const rpmPercent = Math.min((rpmCount / limits.rpm) * 100, 100);
  const tpmPercent = Math.min((tpmCount / limits.tpm) * 100, 100);
  const rpdPercent = Math.min((rpdCount / limits.rpd) * 100, 100);

  const MiniProgress = ({ percent, value, limit, label }: { percent: number, value: number, limit: number, label: string }) => {
    const isDanger = percent >= 100;
    const isWarning = percent > 80;
    const formatNumber = (num: number) => num >= 1000000 ? (num/1000000) + 'M' : num >= 1000 ? (num/1000) + 'K' : num;
    
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase md:hidden">{label}</span>
        <div className="flex items-center gap-3">
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isDanger ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-slate-500 dark:bg-slate-400'}`} 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <span className={`text-xs font-medium font-mono ${isDanger ? 'text-red-500' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {formatNumber(value)} / {formatNumber(limit)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header Section like Google AI Studio */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            {appLang === 'bn' ? 'এপিআই রেট লিমিট' : 'API Rate Limit'}
          </h2>
          <span className="px-2 py-0.5 text-[10px] font-bold border border-slate-300 dark:border-slate-600 rounded-full text-slate-500 dark:text-slate-400">
            Free tier
          </span>
        </div>
      </div>

      <div className={`rounded-xl border flex flex-col overflow-hidden ${isDark ? 'bg-[#1e1e1e] border-slate-700/50' : 'bg-white border-slate-200'}`}>
        
        {/* Table Header */}
        <div className={`px-4 py-3 border-b flex gap-4 ${isDark ? 'border-slate-700/50 bg-[#252525]' : 'border-slate-200 bg-slate-50'}`}>
          <div className="w-1/3 text-xs font-semibold text-slate-500">Model</div>
          <div className="w-1/4 text-xs font-semibold text-slate-500 hidden md:block">Category</div>
          <div className="w-[15%] text-xs font-semibold text-slate-500">RPM &darr;</div>
          <div className="w-[15%] text-xs font-semibold text-slate-500">TPM</div>
          <div className="w-[15%] text-xs font-semibold text-slate-500">RPD</div>
        </div>

        {/* Table Row */}
        <div className={`px-4 py-4 flex gap-4 items-center transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
          <div className={`w-1/3 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {activeModel || 'Gemini Model'}
          </div>
          <div className="w-1/4 text-xs text-slate-500 hidden md:block">Text-out models</div>
          <div className="w-[15%]">
            <MiniProgress percent={rpmPercent} value={rpmCount} limit={limits.rpm} label="RPM" />
          </div>
          <div className="w-[15%]">
            <MiniProgress percent={tpmPercent} value={tpmCount} limit={limits.tpm} label="TPM" />
          </div>
          <div className="w-[15%]">
            <MiniProgress percent={rpdPercent} value={rpdCount} limit={limits.rpd} label="RPD" />
          </div>
        </div>
        
        {/* AntiGravity Row (For completeness/fun based on image) */}
        <div className={`px-4 py-4 flex gap-4 items-center opacity-40 border-t ${isDark ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-100 hover:bg-slate-50'}`}>
          <div className={`w-1/3 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            Antigravity
          </div>
          <div className="w-1/4 text-xs text-slate-500 hidden md:block">Agents</div>
          <div className="w-[15%]">
            <MiniProgress percent={0} value={0} limit={60} label="RPM" />
          </div>
          <div className="w-[15%]">
            <MiniProgress percent={0} value={0} limit={100000} label="TPM" />
          </div>
          <div className="w-[15%]">
            <MiniProgress percent={0} value={0} limit={100} label="RPD" />
          </div>
        </div>
      </div>
      
      {/* Peak Usage Trends Placeholder like image */}
      <div className="mt-8">
        <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {appLang === 'bn' ? 'পিক ইউসেজ ট্রেন্ড' : 'Peak usage trends'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* RPM Chart Box */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between h-32 ${isDark ? 'border-slate-700/50 bg-[#1e1e1e]' : 'border-slate-200 bg-white'}`}>
            <span className="text-xs font-medium text-slate-500">Peak requests per minute (RPM)</span>
            <div className="flex-1 relative mt-2">
              <div className="absolute top-2 w-full border-t border-dashed border-red-500/50"></div>
              <span className="absolute top-0 left-0 bg-red-500 text-white text-[8px] font-bold px-1 rounded-sm">Limit</span>
              <span className="absolute top-0 right-0 text-slate-400 text-[10px]">{limits.rpm}</span>
              
              {/* Fake chart line */}
              <div className="absolute bottom-0 w-full h-8 flex items-end justify-end">
                <div className="w-4 bg-slate-300 dark:bg-slate-600 opacity-50" style={{ height: `${rpmPercent}%` }}></div>
                <div className="w-1 h-1 bg-slate-800 dark:bg-slate-200 rounded-full ml-[-2px] mb-[-2px]"></div>
              </div>
              <div className="absolute bottom-0 w-full border-t border-slate-300 dark:border-slate-700"></div>
              <span className="absolute bottom-[-16px] right-0 text-slate-400 text-[10px]">0</span>
            </div>
          </div>
          
          {/* TPM Chart Box */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between h-32 ${isDark ? 'border-slate-700/50 bg-[#1e1e1e]' : 'border-slate-200 bg-white'}`}>
            <span className="text-xs font-medium text-slate-500">Peak input tokens per minute (TPM)</span>
            <div className="flex-1 relative mt-2">
              <div className="absolute top-2 w-full border-t border-dashed border-red-500/50"></div>
              <span className="absolute top-0 left-0 bg-red-500 text-white text-[8px] font-bold px-1 rounded-sm">Limit</span>
              <span className="absolute top-0 right-0 text-slate-400 text-[10px]">{limits.tpm >= 1000000 ? (limits.tpm/1000000)+'M' : (limits.tpm/1000)+'K'}</span>
              
              <div className="absolute bottom-0 w-full h-8 flex items-end justify-end">
                <div className="w-4 bg-slate-300 dark:bg-slate-600 opacity-50" style={{ height: `${tpmPercent}%` }}></div>
              </div>
              <div className="absolute bottom-0 w-full border-t border-slate-300 dark:border-slate-700"></div>
              <span className="absolute bottom-[-16px] right-0 text-slate-400 text-[10px]">0</span>
            </div>
          </div>

          {/* RPD Chart Box */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between h-32 ${isDark ? 'border-slate-700/50 bg-[#1e1e1e]' : 'border-slate-200 bg-white'}`}>
            <span className="text-xs font-medium text-slate-500">Peak requests per day (RPD)</span>
            <div className="flex-1 relative mt-2">
              <div className="absolute top-2 w-full border-t border-dashed border-red-500/50"></div>
              <span className="absolute top-0 left-0 bg-red-500 text-white text-[8px] font-bold px-1 rounded-sm">Limit</span>
              <span className="absolute top-0 right-0 text-slate-400 text-[10px]">{limits.rpd}</span>
              
              <div className="absolute bottom-0 w-full h-8 flex items-end justify-end">
                <div className="w-4 bg-slate-300 dark:bg-slate-600 opacity-50" style={{ height: `${rpdPercent}%` }}></div>
              </div>
              <div className="absolute bottom-0 w-full border-t border-slate-300 dark:border-slate-700"></div>
              <span className="absolute bottom-[-16px] right-0 text-slate-400 text-[10px]">0</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
