import React from 'react';

export const BatchProcessingQueue = ({
  appLang,
  isDark,
  cardBg,
  cardBorder,
  activeColors,
  history = [],
  batchQueue = [],
  currentBatchIndex = 0,
  isBatchProcessing = false,
  hasBatchStarted = false,
  isBatchPaused = false,
  batchCountdown = 0,
  failedFiles = [],
  retryFailedFiles,
  progress = 0,
  etaSeconds = null,
  startBatch,
  pauseBatch,
  resumeBatch,
  cancelBatch,
  skipNextBatchFile,
  removeBatchFile,
  jumpToBatchFile
}: any) => {
  if (!(isBatchProcessing || failedFiles.length > 0) || batchQueue.length === 0) {
    return null;
  }

  return (
    <div className="px-6 mt-8">
      <div className="flex items-center justify-between bg-slate-950 px-5 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.4)] border border-white/10 mb-4 h-[52px]">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${activeColors?.primary || 'bg-indigo-600'} shadow-[0_0_12px_rgba(255,255,255,0.4)] shrink-0`}></div>
          <span className="text-[12px] font-black uppercase tracking-[0.15em] text-white truncate">
            {appLang === 'bn' ? 'ব্যাচ প্রসেসিং' : 'Batch Processing'}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
          {currentBatchIndex + 1} / {batchQueue.length}
        </span>
      </div>
      
      <div className={`${cardBg} rounded-3xl border ${cardBorder} shadow-[0_15px_35px_rgba(0,0,0,0.2)] overflow-hidden`}>
        <div className="p-4">
        
        {/* Progress Bar and ETA */}
        {hasBatchStarted && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {appLang === 'bn' ? 'অগ্রগতি' : 'Progress'}
              </span>
              <span className="text-[10px] font-bold text-indigo-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500">
                {etaSeconds !== null ? (
                  <>
                    {appLang === 'bn' ? 'আনুমানিক সময় বাকি: ' : 'Estimated time remaining: '}
                    <span className="font-medium text-slate-300">
                      {etaSeconds < 60 
                        ? (appLang === 'bn' ? `~${etaSeconds} সেকেন্ড` : `~${etaSeconds}s`) 
                        : (appLang === 'bn' ? `~${Math.floor(etaSeconds / 60)} মি ${etaSeconds % 60} সে` : `~${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s`)}
                    </span>
                  </>
                ) : (
                  appLang === 'bn' ? 'সময় হিসাব করা হচ্ছে...' : 'Calculating time...'
                )}
              </span>
            </div>
          </div>
        )}

        {/* Countdown Timer */}
        {batchCountdown > 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center animate-pulse">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
              {appLang === 'bn' ? 'পরবর্তী ফাইল শুরু হচ্ছে' : 'Next file starting in'}
            </span>
            <span className="text-3xl font-black text-indigo-500 tabular-nums">
              {batchCountdown}s
            </span>
          </div>
        )}

        {/* Queue List */}
        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2 mb-4">
          {batchQueue.map((file: any, index: number) => {
            const isProcessed = index < currentBatchIndex;
            const isFailed = failedFiles.some((f: any) => f.file.name === file.name);
            const fileSizeMb = (file.size / 1024 / 1024).toFixed(2) + ' MB';
            const isDuplicate = !isProcessed && history.some((h: any) => {
              if (h.size) {
                return h.fileName === file.name && h.size === fileSizeMb;
              }
              return h.fileName === file.name;
            });
            
            const itemBg = index === currentBatchIndex 
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' 
              : isFailed
                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                : isProcessed
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                  : isDuplicate
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100 border-transparent';

            return (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 rounded-xl text-xs border transition-all group/item ${itemBg}`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  {index === currentBatchIndex && hasBatchStarted && !isBatchPaused ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                  ) : isFailed ? (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  ) : isProcessed ? (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  ) : isDuplicate ? (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></div>
                  )}
                  <div className="flex flex-col overflow-hidden w-full">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-[13px]" title={file.name}>
                        {file.name}
                      </span>
                      {isFailed && (
                        <span className="text-[9px] font-bold bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase shrink-0">
                          {appLang === 'bn' ? 'ব্যর্থ' : 'Failed'}
                        </span>
                      )}
                      {isProcessed && (
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded uppercase shrink-0">
                          {appLang === 'bn' ? 'সফল' : 'Success'}
                        </span>
                      )}
                      {isDuplicate && (
                        <span className="text-[9px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded uppercase shrink-0">
                          {appLang === 'bn' ? 'ডুপ্লিকেট' : 'Duplicate'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Interactive Controls */}
                <div className="flex items-center justify-end pl-2">
                  <button 
                    onClick={() => removeBatchFile(index)}
                    className="p-1.5 hover:bg-red-500/20 hover:text-red-500 text-slate-400 rounded-lg transition-colors shrink-0 z-10"
                    title={appLang === 'bn' ? 'বাদ দিন' : 'Remove'}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                  
                  {/* Hidden icons that expand to the right */}
                  <div className="flex items-center gap-1 opacity-0 max-w-0 overflow-hidden group-hover/item:opacity-100 group-hover/item:max-w-[150px] transition-all duration-300 ease-in-out pl-1 origin-left">
                    {/* Start/Jump */}
                    {index !== currentBatchIndex && (
                      <button onClick={() => jumpToBatchFile(index)} className="p-1.5 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors" title={appLang === 'bn' ? 'শুরু করুন' : 'Start'}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    )}
                    {/* Pause (only if current) */}
                    {index === currentBatchIndex && !isBatchPaused && (
                      <button onClick={pauseBatch} className="p-1.5 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors" title={appLang === 'bn' ? 'পজ' : 'Pause'}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      </button>
                    )}
                    {/* Resume (only if current and paused) */}
                    {index === currentBatchIndex && isBatchPaused && (
                      <button onClick={resumeBatch} className="p-1.5 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors" title={appLang === 'bn' ? 'পুনরায় চালু' : 'Resume'}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    )}
                    {/* Stop/Cancel */}
                    {index === currentBatchIndex && (
                       <button onClick={cancelBatch} className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" title={appLang === 'bn' ? 'থামান' : 'Stop'}>
                         <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
                       </button>
                    )}
                    {/* Retry */}
                    {(index < currentBatchIndex || isDuplicate) && (
                      <button onClick={() => jumpToBatchFile(index)} className="p-1.5 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors" title={appLang === 'bn' ? 'পুনরায় চেষ্টা' : 'Retry'}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-2 pt-4 border-t border-slate-500/10">
          {!hasBatchStarted ? (
            <>
              {failedFiles.length > 0 && !isBatchProcessing ? (
                <button onClick={retryFailedFiles} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-500/25">
                  {appLang === 'bn' ? 'ব্যর্থ ফাইল পুনরায় চেষ্টা' : 'Retry Failed'}
                </button>
              ) : (
                <button onClick={startBatch} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/25">
                  {appLang === 'bn' ? 'শুরু করুন' : 'Start Batch'}
                </button>
              )}
            </>
          ) : (
            <>
              {isBatchPaused ? (
                <button onClick={resumeBatch} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/25">
                  {appLang === 'bn' ? 'চালু' : 'Resume'}
                </button>
              ) : (
                <button onClick={pauseBatch} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/25">
                  {appLang === 'bn' ? 'পজ' : 'Pause'}
                </button>
              )}
              <button onClick={skipNextBatchFile} className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-indigo-500/25">
                {appLang === 'bn' ? 'স্কিপ' : 'Skip'}
              </button>
            </>
          )}
          <button onClick={cancelBatch} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-red-500/25">
            {appLang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
        </div>
        

        </div>
      </div>
    </div>
  );
};
