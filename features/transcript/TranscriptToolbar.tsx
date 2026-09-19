import React from 'react';
import { DownloadMenu } from '../../components/common/DownloadMenu';
import { useTranscriptToolbar } from './hooks/useTranscriptToolbar';
import { unicodeToBijoy, bijoyToUnicode, isUnicode } from '@abdalgolabs/ansi-unicode-converter';

export const TranscriptToolbar = ({
  t,
  status,
  isSynced,
  transcriptSegments,
  isKaraokeEnabled,
  setIsKaraokeEnabled,
  appLang,
  handleSummaryClick,
  setIsReportOpen,
  isDisabled,
  activeColors,
  searchTerm,
  handleSearchChange,
  handleKeyDown,
  clearSearch,
  transcriptSearchInputRef,
  matchCount,
  currentMatchIndex,
  goToPrevMatch,
  goToNextMatch,
  fontSize,
  setFontSize,
  transformTranscript,
  transformingType,
  setIsAnalysisOpen,
  transcript,
  fileMeta,
  addToast,
  setTranscript,
  setStatus,
  setActiveHistoryId,
  sensitiveMatches
}: any) => {
  const { handleDelete } = useTranscriptToolbar(setTranscript, setStatus, setActiveHistoryId);

  return (
    <div className="relative px-4 md:px-6 py-2 md:py-3 border-b border-white/10 flex items-center justify-between bg-slate-950 z-20 shrink-0 gap-3 flex-wrap">
      <div className="flex items-center space-x-3 group cursor-default shrink-0 mr-auto">
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${status === 'completed' ? 'bg-slate-500' : 'bg-white/20'}`}></div>
        <h2 className="text-sm md:text-base font-black text-white tracking-tight text-white/90 font-stylish-bn">{t.outputTranscript}</h2>
        
        {isSynced && status === 'completed' && transcriptSegments && transcriptSegments.length > 0 && (
            <button
                onClick={() => setIsKaraokeEnabled(!isKaraokeEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border active:scale-95 cursor-pointer ${
                    isKaraokeEnabled 
                    ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 ring-2 ring-indigo-500/20' 
                    : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                title={isKaraokeEnabled ? "Disable Karaoke Mode" : "Enable Karaoke Mode"}
            >
                <div className={`w-2 h-2 rounded-full ${isKaraokeEnabled ? 'bg-white animate-pulse' : 'bg-slate-500'}`}></div>
                {appLang === 'bn' ? 'কারাওকে মুড' : 'KARAOKE MODE'}
            </button>
        )}
      </div>
      
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Header Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSummaryClick}
            className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group/tool shadow-xl cursor-pointer group"
            title={appLang === 'bn' ? 'সার্চ এনালাইসিস' : 'Search Analysis'}
          >
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button 
            onClick={() => setIsReportOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group/tool shadow-xl cursor-pointer group"
            title={appLang === 'bn' ? 'রিপোর্ট' : 'Report'}
          >
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>

        <div 
          className={`relative flex items-center bg-white/5 rounded-full border border-white/10 px-3 py-1.5 shadow-2xl transition-all duration-300 focus-within:ring-1 focus-within:ring-white/20 w-48 md:w-64 group ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
        >
          <div className="text-white/40 mr-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input 
            ref={transcriptSearchInputRef} 
            type="text" 
            placeholder={appLang === 'bn' ? 'ট্রান্সক্রিপ্টে খুঁজুন...' : 'Search in transcript...'} 
            value={searchTerm} 
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs font-bold text-white flex-1 placeholder:text-white/40 min-w-0 font-stylish-bn" 
          />

          {searchTerm && !isDisabled && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-[10px] font-black text-white/40 mr-1 tabular-nums">{matchCount > 0 ? currentMatchIndex + 1 : 0}/{matchCount}</span>
              <button onClick={clearSearch} className="text-white/40 hover:text-red-400 transition-colors cursor-pointer">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 shrink-0 ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* Language Toggle */}
          <div className="flex items-center bg-white/5 rounded-2xl p-0.5 border border-white/10">
            <button 
              onClick={() => transformingType !== 'translate' && transformTranscript('translate', 'en')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${appLang === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
              title="Translate to English"
            >
              EN
            </button>
            <button 
              onClick={() => transformingType !== 'translate' && transformTranscript('translate', 'bn')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all font-stylish-bn cursor-pointer ${appLang === 'bn' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
              title="Translate to Bengali"
            >
              বাংলা
            </button>
          </div>

          {/* Encoding Toggle */}
          <div className="flex items-center bg-white/5 rounded-2xl p-0.5 border border-white/10">
            <button 
              onClick={() => {
                if (!isUnicode(transcript || '')) {
                  setTranscript(bijoyToUnicode(transcript || ''));
                  addToast(appLang === 'bn' ? 'ইউনিকোডে রূপান্তর করা হয়েছে' : 'Converted to Unicode', 'success');
                }
              }}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all font-stylish-bn cursor-pointer ${(transcript && isUnicode(transcript)) ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
              title={appLang === 'bn' ? 'ইউনিকোডে কনভার্ট করুন' : 'Convert to Unicode'}
            >
              ইউ
            </button>
            <button 
              onClick={() => {
                if (transcript && isUnicode(transcript)) {
                  setTranscript(unicodeToBijoy(transcript));
                  addToast(appLang === 'bn' ? 'বিজয়ে রূপান্তর করা হয়েছে' : 'Converted to Bijoy', 'success');
                }
              }}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all font-stylish-bn cursor-pointer ${(!transcript || !isUnicode(transcript)) ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
              title={appLang === 'bn' ? 'বিজয়তে কনভার্ট করুন' : 'Convert to Bijoy'}
            >
              বি
            </button>
          </div>

          {/* Font Size Controls */}
          <div className="flex items-center bg-white/5 rounded-2xl p-0.5 border border-white/10">
            <button 
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
            >
              <span className="text-xs font-black">−</span>
            </button>
            <span className="px-2 text-xs font-black text-white tabular-nums">{fontSize}</span>
            <button 
              onClick={() => setFontSize(Math.min(32, fontSize + 2))}
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
            >
              <span className="text-xs font-black">+</span>
            </button>
          </div>

          {/* Download Button */}
          <div className={`${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <DownloadMenu 
              transcript={transcript} 
              fileName={fileMeta?.name || 'transcript'} 
              activeColors={activeColors} 
              t={t} 
              searchTerm={searchTerm} 
              sensitiveMatches={sensitiveMatches}
              addToast={addToast} 
              customTrigger={
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black transition-all active:scale-95 border border-white/10 font-stylish-bn cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{appLang === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
                  <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              }
            />
          </div>

          {/* Delete Button */}
          <button 
            onClick={handleDelete}
            className="w-9 h-9 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl cursor-pointer"
            title={appLang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
