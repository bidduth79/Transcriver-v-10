
import React, { useState, useRef, useEffect } from 'react';

// declare var html2pdf: any; // Removed TS declaration

export const DownloadMenu = ({ transcript, fileName, activeColors, t, searchTerm, sensitiveMatches = [], addToast, customTrigger }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadFile = (content: any, ext: string) => {
    try {
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      
      let finalFileName = 'transcript';
      if (fileName && typeof fileName === 'string') {
        finalFileName = fileName.split('.')[0];
      }
      link.download = `${finalFileName}_transcript.${ext}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsOpen(false);
      addToast(`${ext.toUpperCase()} ফাইল ডাউনলোড শুরু হয়েছে`, 'success');
    } catch (error: any) {
      console.error('Download error:', error);
      addToast(`ডাউনলোড ত্রুটি: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const exportTxt = () => {
    try {
      const safeTranscript = transcript || '';
      const blob = new Blob([safeTranscript], { type: 'text/plain;charset=utf-8' });
      downloadFile(blob, 'txt');
    } catch (error: any) {
      console.error('TXT Export Error:', error);
      addToast(`TXT এরর: ${error.message}`, 'error');
    }
  };

  const exportWord = () => {
    try {
      const safeTranscript = (typeof transcript === 'string' ? transcript : '') || '';
      // Convert speaker tags for Word
      let processedTranscript = safeTranscript.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #4338ca;">$1</strong>');
      let htmlContent = processedTranscript.replace(/\n/g, '<br>');
      
      // Add highlighting for Word
      if (includeKeywords && sensitiveMatches && Array.isArray(sensitiveMatches) && sensitiveMatches.length > 0) {
        const validMatches = sensitiveMatches
          .filter((m: string) => m && typeof m === 'string' && m.trim() !== '')
          .map((m: string) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        
        if (validMatches.length > 0) {
          const regex = new RegExp(`(${validMatches.join('|')})`, 'gi');
          htmlContent = htmlContent.replace(regex, `<span style="background-color: #ef4444; color: white; font-weight: bold;">$1</span>`);
        }
      }

      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Transcript</title><style>body { font-family: "Hind Siliguri", sans-serif; }</style></head><body>`;
      const footer = "</body></html>";
      const sourceHTML = header + htmlContent + footer;
      const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
      downloadFile(blob, 'doc');
    } catch (error: any) {
      console.error('Word Export Error:', error);
      addToast(`Word এরর: ${error.message}`, 'error');
    }
  };

  const exportPDF = () => {
    try {
      setIsOpen(false);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        addToast('পপ-আপ ব্লক করা আছে। দয়া করে পপ-আপ অ্যালাউ করুন।', 'error');
        return;
      }

      let finalFileName = 'transcript';
      if (fileName && typeof fileName === 'string') {
        finalFileName = fileName.split('.')[0];
      }

      const headerHtml = `
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #4338ca;">LI CELL STUDIO</h1>
            <p style="margin: 5px 0 0 0; font-size: 10px; font-weight: 900; color: #64748b; letter-spacing: 2px;">TRANSCRIPTION EXPORT ${searchTerm ? '(SEARCH HIGHLIGHTED)' : ''}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 10px; font-weight: 700; color: #94a3b8;">DATE: ${new Date().toLocaleDateString()}</p>
            <p style="margin: 5px 0 0 0; font-size: 10px; font-weight: 700; color: #94a3b8;">FILE: ${finalFileName}</p>
          </div>
        </div>
      `;

      let searchRegex: RegExp | null = null;
      if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchRegex = new RegExp(`(${escapedSearch})`, 'gi');
      }

      let sensitiveRegex: RegExp | null = null;
      if (includeKeywords && sensitiveMatches && Array.isArray(sensitiveMatches) && sensitiveMatches.length > 0) {
        const validMatches = sensitiveMatches
          .filter((m: string) => m && typeof m === 'string' && m.trim() !== '')
          .map((m: string) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        
        if (validMatches.length > 0) {
          sensitiveRegex = new RegExp(`(${validMatches.join('|')})`, 'gi');
        }
      }

      const highlightText = (text: string) => {
        if (typeof text !== 'string') return '';
        let processed = text;
        
        if (searchRegex) {
          processed = processed.replace(searchRegex, '<mark style="background-color: #f97316; color: white; padding: 0 2px; border-radius: 2px;">$1</mark>');
        }

        if (sensitiveRegex) {
          processed = processed.replace(sensitiveRegex, '<mark style="background-color: #ef4444; color: white; padding: 0 4px; border-radius: 4px; font-weight: bold;">$1</mark>');
        }

        return processed;
      };

      const safeTranscript = (typeof transcript === 'string' ? transcript : '') || '';
      const lines = safeTranscript.split('\n').filter((l: string) => l && typeof l === 'string');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${finalFileName}_transcript</title>
            <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              body { 
                font-family: 'Hind Siliguri', 'Inter', sans-serif; 
                padding: 40px; 
                color: #1e293b; 
                background-color: #ffffff;
              }
              @media print {
                @page { margin: 20mm; }
                body { 
                  -webkit-print-color-adjust: exact; 
                  print-color-adjust: exact; 
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            ${headerHtml}
            <div id="transcript-content">
              <div id="loading" style="text-align: center; padding: 50px; color: #64748b;">
                <h2>PDF প্রস্তুত করা হচ্ছে...</h2>
                <p>দয়া করে অপেক্ষা করুন</p>
              </div>
            </div>
            <script>
              // Function will be injected below
            </script>
          </body>
        </html>
      `);
      
      const CHUNK_SIZE = 500;
      let currentIndex = 0;
      
      const processChunk = () => {
        if (!printWindow || printWindow.closed) return;
        
        const chunk = lines.slice(currentIndex, currentIndex + CHUNK_SIZE);
        
        if (chunk.length === 0) {
          // Done processing
          const loadingEl = printWindow.document.getElementById('loading');
          if (loadingEl) loadingEl.remove();
          
          printWindow.document.close();
          
          printWindow.document.fonts.ready.then(() => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          });
          
          printWindow.onafterprint = () => {
            printWindow.close();
          };
          return;
        }
        
        const html = chunk.map((line: string) => {
          let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #4338ca; font-weight: 700;">$1</strong>');
          const finalLine = highlightText(processedLine);
          return `<p style="margin-bottom: 15px; line-height: 1.6; font-size: 13px;">${finalLine}</p>`;
        }).join('');
        
        const contentDiv = printWindow.document.getElementById('transcript-content');
        if (contentDiv) {
          const wrapper = printWindow.document.createElement('div');
          wrapper.innerHTML = html;
          contentDiv.appendChild(wrapper);
        }
        
        currentIndex += CHUNK_SIZE;
        // Yield to browser to prevent freezing
        setTimeout(processChunk, 10);
      };
      
      // Start chunk processing
      processChunk();
      
      addToast('PDF প্রস্তুত করা হচ্ছে, দয়া করে অপেক্ষা করুন...', 'success');
    } catch (error: any) {
      console.error('PDF Export Error:', error);
      addToast(`PDF এরর: ${error.message}`, 'error');
    }
  };

  const exportSRT = () => {
    try {
      const safeTranscript = (typeof transcript === 'string' ? transcript : '') || '';
      let srtContent = "";
      const lines = safeTranscript.split('\n').filter((l: string) => l && typeof l === 'string' && l.trim() !== "");
      lines.forEach((line: string, index: number) => {
        const timeMatch = line.match(/\[(\d{2}:\d{2})\]/);
        const startTimeStr = timeMatch ? timeMatch[1] : "00:00";
        srtContent += `${index + 1}\n`;
        srtContent += `00:${startTimeStr}:00,000 --> 00:${startTimeStr}:05,000\n`;
        srtContent += `${line.replace(/\*\*.*?\*\*:/, '').trim()}\n\n`;
      });
      const blob = new Blob([srtContent], { type: 'text/srt;charset=utf-8' });
      downloadFile(blob, 'srt');
    } catch (error: any) {
      console.error('SRT Export Error:', error);
      addToast(`SRT এরর: ${error.message}`, 'error');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {customTrigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>
          {customTrigger}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center px-8 py-3.5 bg-white text-slate-900 rounded-full text-sm font-black uppercase tracking-widest hover:brightness-95 transition-all shadow-xl active:scale-95 shrink-0 group ${isOpen ? 'ring-4 ring-indigo-500/20' : ''}`}
        >
          <svg className={`w-5 h-5 mr-3 transition-transform duration-500 ${isOpen ? 'rotate-180' : 'group-hover:scale-125'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t.download}
          <svg className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-white/5">
          <div className="p-3 space-y-1.5">
            <button onClick={exportTxt} className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/10 transition-all rounded-2xl group text-left active:scale-[0.97]">
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black tracking-widest uppercase">Notepad</span>
                <span className="text-[9px] text-white/40 font-bold uppercase">Plain Text File</span>
              </div>
            </button>

            <button onClick={exportWord} className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/10 transition-all rounded-2xl group text-left active:scale-[0.97]">
              <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black tracking-widest uppercase">Word Document</span>
                <span className="text-[9px] text-white/40 font-bold uppercase">Editable MS Word</span>
              </div>
            </button>

            <button onClick={exportSRT} className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/10 transition-all rounded-2xl group text-left active:scale-[0.97]">
              <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black tracking-widest uppercase">Subtitle SRT</span>
                <span className="text-[9px] text-white/40 font-bold uppercase">Captions with Time</span>
              </div>
            </button>

            <button onClick={exportPDF} className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/10 transition-all rounded-2xl group text-left active:scale-[0.97]">
              <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black tracking-widest uppercase">PDF Document</span>
                <span className="text-[9px] text-white/40 font-bold uppercase">Ready to Print</span>
              </div>
            </button>

            {sensitiveMatches && sensitiveMatches.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 px-4 pb-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer appearance-none w-4 h-4 rounded border border-white/30 checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer"
                      checked={includeKeywords}
                      onChange={(e) => setIncludeKeywords(e.target.checked)}
                    />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 peer-checked:scale-100 scale-50 transition-all pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-white/70 group-hover:text-white transition-colors">
                    Highlight Keywords in PDF & Word
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
