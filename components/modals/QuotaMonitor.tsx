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
    
    // Set up an interval to refresh logs and recompute time window
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
    // Pro models have stricter limits
    if (modelId.includes('pro')) {
      return { rpm: 2, rpd: 50 };
    }
    // Flash models
    return { rpm: 15, rpd: 1500 };
  };

  const limits = getModelLimits(activeModel);
  const now = Date.now();
  
  // Calculate RPM (Requests in last 60 seconds)
  const rpmLogs = logs.filter(l => now - new Date(l.timestamp).getTime() < 60000);
  const rpmCount = rpmLogs.length;
  const rpmPercent = Math.min((rpmCount / limits.rpm) * 100, 100);
  
  // Calculate RPD (Requests in last 24 hours)
  const rpdLogs = logs.filter(l => now - new Date(l.timestamp).getTime() < 86400000);
  const rpdCount = rpdLogs.length;
  const rpdPercent = Math.min((rpdCount / limits.rpd) * 100, 100);

  const getStatusColor = (percent: number) => {
    if (percent > 90) return 'bg-red-500';
    if (percent > 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <h3 className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          {appLang === 'bn' ? 'বর্তমান মডেল' : 'Current Model'}: {activeModel}
        </h3>
        
        {/* RPM Monitor */}
        <div className="mt-4">
          <div className="flex justify-between items-end mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {appLang === 'bn' ? 'মিনিট প্রতি রিকোয়েস্ট (RPM)' : 'Requests Per Minute (RPM)'}
            </span>
            <span className={`text-xl font-black ${rpmCount >= limits.rpm ? 'text-red-500' : ''}`}>
              {rpmCount} / {limits.rpm}
            </span>
          </div>
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${getStatusColor(rpmPercent)}`} style={{ width: `${rpmPercent}%` }}></div>
          </div>
          {rpmCount >= limits.rpm && (
            <p className="text-[10px] font-bold text-red-500 mt-2 uppercase tracking-widest animate-pulse">
              {appLang === 'bn' ? 'লিমিট শেষ! পরবর্তী রিকোয়েস্টের জন্য অপেক্ষা করুন।' : 'Limit Reached! Please wait before next request.'}
            </p>
          )}
        </div>

        {/* RPD Monitor */}
        <div className="mt-6">
          <div className="flex justify-between items-end mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {appLang === 'bn' ? 'দৈনিক রিকোয়েস্ট (RPD)' : 'Requests Per Day (RPD)'}
            </span>
            <span className={`text-xl font-black ${rpdCount >= limits.rpd ? 'text-red-500' : ''}`}>
              {rpdCount} / {limits.rpd}
            </span>
          </div>
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${getStatusColor(rpdPercent)}`} style={{ width: `${rpdPercent}%` }}></div>
          </div>
        </div>
      </div>
      
      <div className={`p-6 rounded-3xl border flex flex-col gap-2 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
        <h4 className="text-xs font-black uppercase tracking-widest mb-2 text-indigo-500">
          {appLang === 'bn' ? 'গুরুত্বপূর্ণ তথ্য' : 'Important Note'}
        </h4>
        <p className="text-xs leading-relaxed font-bold">
          {appLang === 'bn' 
            ? 'এটি লোকাল ইউসেজ ট্র্যাকার, যা এই ডিভাইসে করা আপনার রিকোয়েস্টের হিসেব রাখে। প্রো মডেলে (Gemini Pro) মিনিটে সর্বোচ্চ ২টি এবং ফ্ল্যাশ মডেলে মিনিটে ১৫টি রিকোয়েস্ট করা যায়। টেস্টিংয়ের সময় বেশি কল করতে চাইলে Flash মডেল ব্যবহার করুন।'
            : 'This is a local usage tracker for requests made on this device. Pro models are limited to 2 RPM, while Flash models allow 15 RPM. Use Flash models for heavy testing.'}
        </p>
      </div>
    </div>
  );
};
