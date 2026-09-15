import React from 'react';

interface TranscriptSidebarToolsProps {
  sensitiveMatches: any[];
  sensitiveWordCounts: any[];
  appLang: string;
  isDark: boolean;
  searchTerm: string;
  goToNextMatch: () => void;
  handleSearchChange: (e: any) => void;
  isBgbAnalysisEnabled: boolean;
  setIsBgbAnalysisEnabled: (enabled: boolean) => void;
  bgbAnalysisResult: any;
  isAnalyzing: boolean;
  triggerAnalysis: () => void;
}

export const TranscriptSidebarTools: React.FC<TranscriptSidebarToolsProps> = ({
  sensitiveMatches,
  sensitiveWordCounts,
  appLang,
  isDark,
  searchTerm,
  goToNextMatch,
  handleSearchChange,
  isBgbAnalysisEnabled,
  setIsBgbAnalysisEnabled,
  bgbAnalysisResult,
  isAnalyzing,
  triggerAnalysis
}) => {
  if (!sensitiveMatches || sensitiveMatches.length === 0) return null;

  return (
    <div className="absolute top-0 right-full h-full mr-6 xl:mr-10 z-30">
      <div className={`sticky top-8 max-h-[calc(100vh-6rem)] w-48 md:w-56 flex flex-col gap-4 animate-in slide-in-from-top-8 duration-700 hidden xl:flex`}>
        <div className={`p-4 rounded-3xl shadow-2xl backdrop-blur-xl border border-red-500/20 flex flex-col min-h-0 shrink ${isDark ? 'bg-slate-900/90' : 'bg-white/95'}`}>
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-red-500/20 shrink-0">
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {appLang === 'bn' ? 'সার্চিং ওয়ার্ড' : 'Searching Words'}
            </h4>
          </div>
          
          <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 min-h-0">
            {sensitiveWordCounts?.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  if (searchTerm === item.word) {
                    goToNextMatch();
                  } else {
                    handleSearchChange({ target: { value: item.word } });
                  }
                }}
                className={`cursor-pointer flex items-center justify-between text-[10px] md:text-[11px] font-black tracking-wide px-3 py-2 rounded-xl shrink-0 transition-colors ${isDark ? 'bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/30' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100'}`} 
                title={item.word}
              >
                <span className="truncate mr-2">{item.word}</span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] ${isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-200/50 text-red-700'}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BGB Analysis Card */}
        <div className={`shrink-0 p-4 rounded-3xl shadow-2xl backdrop-blur-xl border overflow-y-auto custom-scrollbar transition-colors duration-500 ${
            !isBgbAnalysisEnabled ? (isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200') :
            isAnalyzing ? (isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-100/95 border-slate-200') :
            bgbAnalysisResult?.remark === 'Positive' ? (isDark ? 'bg-emerald-950/90 border-emerald-500/40' : 'bg-emerald-50/95 border-emerald-400') :
            bgbAnalysisResult?.remark === 'Negative' ? (isDark ? 'bg-red-950/90 border-red-500/40' : 'bg-red-50/95 border-red-400') :
            (isDark ? 'bg-yellow-950/90 border-yellow-500/40' : 'bg-yellow-50/95 border-yellow-400')
        }`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              {isBgbAnalysisEnabled && (bgbAnalysisResult || isAnalyzing) ? (
                isAnalyzing ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${
                      bgbAnalysisResult?.remark === 'Positive' ? 'bg-emerald-500' :
                      bgbAnalysisResult?.remark === 'Negative' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                )
              ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
              )}
              <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${
                  !isBgbAnalysisEnabled || (!bgbAnalysisResult && !isAnalyzing) ? (isDark ? 'text-slate-500' : 'text-slate-500') :
                  isAnalyzing ? (isDark ? 'text-slate-400' : 'text-slate-600') :
                  bgbAnalysisResult?.remark === 'Positive' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') :
                  bgbAnalysisResult?.remark === 'Negative' ? (isDark ? 'text-red-400' : 'text-red-600') :
                  (isDark ? 'text-yellow-400' : 'text-yellow-600')
              }`}>
                {!isBgbAnalysisEnabled ? 'BGB Analysis' : isAnalyzing ? 'Analyzing...' : bgbAnalysisResult?.remark || 'Ready to Analyze'}
              </h4>
            </div>
            
            <button
              onClick={() => setIsBgbAnalysisEnabled(!isBgbAnalysisEnabled)}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isBgbAnalysisEnabled ? 'bg-indigo-500' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isBgbAnalysisEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          </div>
          
          {isBgbAnalysisEnabled && (
            <div className="flex flex-col gap-2 min-h-0 shrink-0">
              {!bgbAnalysisResult && !isAnalyzing ? (
                  <button 
                    onClick={triggerAnalysis}
                    className={`w-full py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                  >
                    Start Analysis
                  </button>
              ) : (
                  <p className={`text-[10px] md:text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isAnalyzing ? 'Checking context for BGB impact...' : bgbAnalysisResult?.details}
                  </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
