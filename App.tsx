
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

// Expose Swal to window for inline onclick handlers in HTML strings
(window as any).Swal = Swal;

import { GoogleGenAI } from "@google/genai";
import { Header } from './components/layout/Header';
import { Sidebar } from './features/sidebar/Sidebar';
import { ExpandedHistory } from './features/sidebar/ExpandedHistory';
import { TranscriptOutput } from './features/transcript/TranscriptOutput';
import { Footer } from './components/layout/Footer';
import { SpiderWebBackground } from './components/layout/Background';
import { InformationModal } from './components/modals/InformationModal';
import { ToolsModal } from './components/modals/ToolsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ActivityLogsModal } from './components/modals/ActivityLogsModal';
import { TranscriberReportModal } from './components/reports/TranscriberReportModal';
import { SuccessModal } from './components/modals/SuccessModal'; 
import { BatchSummaryModal } from './components/modals/BatchSummaryModal';
import { YouTubeMonitor } from './features/youtube-monitor/components/YouTubeMonitor';
import { getActiveProvider, incrementTotalCalls, getTotalCalls } from './services/ApiKeyManager';
import { useTranscription } from './hooks/useTranscription';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useHistory } from './hooks/useHistory';
import { useTranscriptSearch } from './hooks/useTranscriptSearch';
import { useTransformTranscript } from './hooks/useTransformTranscript';
import { useApiStats } from './hooks/useApiStats';
import { useAppTheme } from './hooks/useAppTheme';
import { useAppModals } from './hooks/useAppModals';
import { useBatchProcessor } from './hooks/useBatchProcessor';
import { translations } from './translations';



const App: React.FC = () => {
  const {
    theme, setTheme, appLang, setAppLang, fontSize, setFontSize,
    isDark, t, activeColors, mainBgColor, textColor, cardBg, cardBorder, subTextColor
  } = useAppTheme();

  const {
    isSidebarOpen, setIsSidebarOpen,
    isInformationOpen, setIsInformationOpen,
    isActivityLogOpen, setIsActivityLogOpen,
    isReportOpen, setIsReportOpen,
    isSettingsOpen, setIsSettingsOpen,
    activeTool, setActiveTool,
    isToolsMinimized, setIsToolsMinimized
  } = useAppModals();

  const {
    totalApiCalls, activeApiKeySource, activeModelName,
    isAiLoading, setIsAiLoading, updateApiStats
  } = useApiStats();

  const addToast = (msg: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const title = appLang === 'bn' 
      ? (type === 'success' ? 'সফল' : type === 'error' ? 'ত্রুটি' : type === 'warning' ? 'সতর্কতা' : 'তথ্য')
      : (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info');
      
    // Define colors based on type
    let bgColor, iconBg, svgPath;
    
    if (type === 'success') {
      bgColor = '#064e3b'; // Dark green
      iconBg = '#059669';  // Lighter green
      svgPath = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    } else if (type === 'error') {
      bgColor = '#7f1d1d'; // Dark red
      iconBg = '#dc2626';  // Lighter red
      svgPath = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    } else if (type === 'warning') {
      bgColor = '#78350f'; // Dark yellow/brown
      iconBg = '#d97706';  // Yellow
      svgPath = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
    } else {
      bgColor = '#002752'; // Dark blue
      iconBg = '#2563eb';  // Blue
      svgPath = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    }

    const htmlContent = `
      <div style="display: flex; align-items: center; padding: 12px 16px; min-width: 300px; max-width: 400px; gap: 16px;">
        <!-- Icon -->
        <div style="flex-shrink: 0; width: 36px; height: 36px; background-color: ${iconBg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            ${svgPath}
          </svg>
        </div>
        
        <!-- Text -->
        <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
          <span style="font-weight: 600; color: white; font-size: 15px; line-height: 1.3;">${title}</span>
          <span style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; line-height: 1.4;">${msg}</span>
        </div>

        <!-- Close Button -->
        <button onclick="Swal.close()" style="flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.4); background: transparent; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.8)';" onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='rgba(255,255,255,0.4)';">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      showCloseButton: false,
      timer: 3000,
      timerProgressBar: false,
      html: htmlContent,
      background: bgColor,
      padding: 0,
      customClass: {
        container: 'custom-toast-container',
        popup: 'custom-toast-popup',
        htmlContainer: 'custom-toast-html-container'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });
  };

  // Custom Hooks
  const {
    history, historyLimit, setHistoryLimit,
    isHistoryFullscreen, setIsHistoryFullscreen,
    activeHistoryId, setActiveHistoryId,
    histSearch, setHistSearch,
    histDateFilter, setHistDateFilter,
    histSentimentFilter, setHistSentimentFilter,
    showFavoritesOnly, setShowFavoritesOnly,
    toggleFavorite, backupHistory, restoreHistory,
    loadHistory, handleDeleteHistoryItem, groupHistory, filteredHistory
  } = useHistory(appLang, addToast, (id) => {
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
      setTranscript('');
      setStatus('idle');
    }
  });

  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          const startTime = now + (i * 0.08);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
          osc.start(startTime);
          osc.stop(startTime + 0.8);
      });
    } catch (e) {}
  };

  const {
    status, setStatus,
    transcript, setTranscript,
    errorMessage, setErrorMessage,
    progress, setProgress,
    currentStage, setCurrentStage,
    elapsedSeconds, setElapsedSeconds,
    estimatedSeconds, setEstimatedSeconds,
    file, setFile,
    fileUrl, setFileUrl,
    fileMeta, setFileMeta,
    showSuccessModal, setShowSuccessModal,
    processTranscription, resetAll: resetTranscription
  } = useTranscription(appLang, addToast, loadHistory, updateApiStats, playSuccessSound);

  const handleResetAll = () => {
    resetTranscription();
    setActiveHistoryId(null);
    setTranscriptMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    const folderInput = document.getElementById('folderInput') as HTMLInputElement;
    if (folderInput) {
      folderInput.value = '';
    }
  };

  // Separate state for transcript metadata (to compare with loaded file)
  const [transcriptMeta, setTranscriptMeta] = useState<any>(null);

  const {
    searchTerm, setSearchTerm,
    currentMatchIndex, setCurrentMatchIndex,
    matchCount, setMatchCount,
    transcriptSearchInputRef,
    goToNextMatch, goToPrevMatch
  } = useTranscriptSearch(transcript);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    batchQueue, setBatchQueue,
    currentBatchIndex, setCurrentBatchIndex,
    isBatchProcessing, setIsBatchProcessing,
    hasBatchStarted, setHasBatchStarted,
    isBatchPaused, setIsBatchPaused,
    isExtendedPause,
    batchCountdown, setBatchCountdown,
    failedFiles, processedCount, retryFailedFiles,
    progress: batchProgress, etaSeconds,
    isBatchSummaryOpen, setIsBatchSummaryOpen,
    startBatch, pauseBatch, resumeBatch, cancelBatch, skipNextBatchFile, jumpToBatchFile, removeBatchFile
  } = useBatchProcessor(
    appLang, addToast, setFile, setFileUrl, setActiveHistoryId, setTranscriptMeta, setFileMeta, processTranscription
  );

  const handleFileChange = async (e: any, autoStart = false) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;

    if (files.length > 1 || e.target.id === 'folderInput') {
      // Filter supported audio/video files including opus
      const supportedFiles = files.filter(f => 
        f.type.startsWith('audio/') || 
        f.type.startsWith('video/') || 
        f.name.toLowerCase().match(/\.(opus|mp3|wav|mp4|m4a|aac|ogg|webm|flac)$/)
      );
      
      if (supportedFiles.length === 0) {
        Swal.fire({
          html: `
            <div style="display: flex; align-items: center; padding: 8px 12px; min-width: 250px; max-width: 350px; gap: 12px;">
              <div style="flex-shrink: 0; width: 28px; height: 28px; background-color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg style="width: 16px; height: 16px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
                <span style="font-weight: 600; color: white; font-size: 13px; line-height: 1.2;">${appLang === 'bn' ? 'ত্রুটি' : 'Error'}</span>
                <span style="color: rgba(255,255,255,0.85); font-size: 11px; margin-top: 2px; line-height: 1.3;">${appLang === 'bn' ? 'কোনো সমর্থিত অডিও/ভিডিও ফাইল পাওয়া যায়নি' : 'No supported audio/video files found'}</span>
              </div>
              <button onclick="Swal.close()" style="flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.4); background: transparent; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.8)';" onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='rgba(255,255,255,0.4)';">
                <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          `,
          toast: false,
          position: 'center',
          showConfirmButton: false,
          showCloseButton: false,
          timer: 4000,
          background: '#7f1d1d',
          padding: 0,
          customClass: {
            container: 'custom-centered-modal-container',
            popup: 'custom-centered-modal-popup',
            htmlContainer: 'custom-centered-modal-html-container'
          }
        });
        return;
      }

      Swal.fire({
        html: `
          <div style="display: flex; align-items: center; padding: 12px 16px; min-width: 300px; max-width: 400px; gap: 12px; flex-direction: column;">
            <div style="display: flex; align-items: center; width: 100%; gap: 12px;">
              <div style="flex-shrink: 0; width: 32px; height: 32px; background-color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
                <span style="font-weight: 600; color: white; font-size: 14px; line-height: 1.2;">${appLang === 'bn' ? 'ফোল্ডার আপলোড' : 'Folder Upload'}</span>
                <span style="color: rgba(255,255,255,0.85); font-size: 12px; margin-top: 2px; line-height: 1.3;">${appLang === 'bn' ? `মোট ${supportedFiles.length} টি ফাইল পাওয়া গেছে। আপনি কি ব্যাচ প্রসেসিং শুরু করতে চান?` : `Found ${supportedFiles.length} files. Do you want to start batch processing?`}</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
              <button id="swal-folder-confirm" style="flex: 1; background-color: white; color: #064e3b; border: none; padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'শুরু করুন' : 'Start'}</button>
              <button id="swal-folder-cancel" style="flex: 1; background-color: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'বাতিল' : 'Cancel'}</button>
            </div>
          </div>
        `,
        toast: false,
        position: 'center',
        showConfirmButton: false,
        showCloseButton: false,
        background: '#064e3b',
        padding: 0,
        customClass: {
          container: 'custom-centered-modal-container',
          popup: 'custom-centered-modal-popup',
          htmlContainer: 'custom-centered-modal-html-container'
        },
        didOpen: () => {
          const confirmBtn = document.getElementById('swal-folder-confirm');
          const cancelBtn = document.getElementById('swal-folder-cancel');
          
          if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
              Swal.close();
              setBatchQueue(supportedFiles);
              setCurrentBatchIndex(0);
              setIsBatchProcessing(true);
              setHasBatchStarted(false);
              setIsBatchPaused(false);
              setBatchCountdown(0);
            });
          }
          
          if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
              Swal.close();
              // Reset file input
              if (fileInputRef.current) fileInputRef.current.value = '';
              const folderInput = document.getElementById('folderInput') as HTMLInputElement;
              if (folderInput) folderInput.value = '';
            });
          }
        }
      });
      
      // DO NOT start processing automatically
      return;
    }

    const selectedFile = files[0];
    if (selectedFile.size > 70 * 1024 * 1024) {
      addToast(appLang === 'bn' ? 'ফাইল সাইজ ৭০ এমবি এর বেশি হতে পারবে না' : 'File size cannot exceed 70MB', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const loadAndProcessFile = (forceStart = false) => {
      setFile(selectedFile);
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      const url = URL.createObjectURL(selectedFile);
      setFileUrl(url);
      setActiveHistoryId(null);
      setTranscriptMeta(null); // Clear previous transcript meta
      setTranscript(''); // Clear previous transcript
      setStatus('idle'); // Reset status
      
      const audio = new Audio(url);
      
      const finishMetadata = (durationStr: string) => {
        const metadata = {
          name: selectedFile.name,
          size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
          duration: durationStr,
          type: selectedFile.type,
          date: new Date().toISOString()
        };
        setFileMeta(metadata);
        if (autoStart || forceStart) {
          processTranscription(selectedFile, metadata);
        }
      };

      let resolved = false;

      audio.onloadedmetadata = () => {
        if (resolved) return;
        resolved = true;
        const duration = audio.duration;
        let durationStr = "Unknown";
        if (isFinite(duration) && !isNaN(duration)) {
          const mins = Math.floor(duration / 60);
          const secs = Math.floor(duration % 60);
          durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        finishMetadata(durationStr);
      };

      audio.onerror = () => {
        if (resolved) return;
        resolved = true;
        finishMetadata("Unknown");
      };

      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        finishMetadata("Unknown");
      }, 3000);
    };

    const existingHistoryItem = history.find(h => h.fileName === selectedFile.name);
    
    if (existingHistoryItem) {
      Swal.fire({
        html: `
          <div style="display: flex; align-items: center; padding: 12px 16px; min-width: 300px; max-width: 400px; gap: 12px; flex-direction: column;">
            <div style="display: flex; align-items: center; width: 100%; gap: 12px;">
              <div style="flex-shrink: 0; width: 32px; height: 32px; background-color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
                <span style="font-weight: 600; color: white; font-size: 14px; line-height: 1.2;">${appLang === 'bn' ? 'ফাইলটি ইতিমধ্যে ট্রান্সক্রাইব করা হয়েছে!' : 'File Already Transcribed!'}</span>
                <span style="color: rgba(255,255,255,0.85); font-size: 12px; margin-top: 2px; line-height: 1.3;">${appLang === 'bn' ? 'আপনি কি নতুন করে আবার ট্রান্সক্রাইব করতে চান, নাকি আগের রেজাল্ট দেখতে চান?' : 'Do you want to transcribe it again, or view the previous result?'}</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
              <button id="swal-custom-confirm" style="flex: 1; background-color: white; color: #002752; border: none; padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'নতুন করে করুন' : 'Transcribe Again'}</button>
              <button id="swal-custom-cancel" style="flex: 1; background-color: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'আগেরটি দেখুন' : 'View Existing'}</button>
            </div>
          </div>
        `,
        toast: false,
        position: 'center',
        showConfirmButton: false,
        showCloseButton: false,
        background: '#002752',
        padding: 0,
        customClass: {
          container: 'custom-centered-modal-container',
          popup: 'custom-centered-modal-popup',
          htmlContainer: 'custom-centered-modal-html-container'
        },
        didOpen: () => {
          const confirmBtn = document.getElementById('swal-custom-confirm');
          const cancelBtn = document.getElementById('swal-custom-cancel');
          
          if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
              Swal.close();
              loadAndProcessFile(true);
            });
          }
          
          if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
              Swal.close();
              // Load existing transcript AND the audio file
              setFile(selectedFile);
              if (fileUrl) URL.revokeObjectURL(fileUrl);
              const url = URL.createObjectURL(selectedFile);
              setFileUrl(url);
              
              const audio = new Audio(url);
              audio.onloadedmetadata = () => {
                const duration = audio.duration;
                const mins = Math.floor(duration / 60);
                const secs = Math.floor(duration % 60);
                const metadata = {
                  name: selectedFile.name,
                  size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
                  duration: `${mins}:${secs.toString().padStart(2, '0')}`,
                  type: selectedFile.type,
                  date: new Date().toISOString()
                };
                setFileMeta(metadata);
              };

              setTranscript(existingHistoryItem.transcript);
              setStatus('completed');
              setTranscriptMeta({ 
                name: existingHistoryItem.fileName, 
                duration: existingHistoryItem.duration, 
                channelName: existingHistoryItem.channelName, 
                date: existingHistoryItem.publishedDate 
              });
              setActiveHistoryId(existingHistoryItem.id);
              addToast(appLang === 'bn' ? "হিস্টোরি লোড হয়েছে" : "History loaded", 'info');
            });
          }
        }
      });
    } else {
      loadAndProcessFile();
    }
    
    // Clear the input value so the same file can be selected again
    e.target.value = '';
  };

  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecorder(
    appLang, addToast, (recordedFile) => handleFileChange({ target: { files: [recordedFile] } })
  );

  // Audio Player & Sync
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  useEffect(() => {
    loadHistory();
    updateApiStats();
    
    const handleHistoryUpdate = () => {
      loadHistory();
    };
    window.addEventListener(`store-updated-studio_history`, handleHistoryUpdate);
    
    const handleApiKeysUpdate = () => {
      updateApiStats();
    };
    window.addEventListener(`store-updated-api_keys`, handleApiKeysUpdate);
    window.addEventListener(`active-api-key-changed`, handleApiKeysUpdate);
    
    const handleAppError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addToast(customEvent.detail.message, 'error');
    };
    window.addEventListener('app-error', handleAppError);
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setAudioCurrentTime(audioRef.current.currentTime);
      }
    };
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.addEventListener('timeupdate', handleTimeUpdate);
    }
    return () => {
      window.removeEventListener(`store-updated-studio_history`, handleHistoryUpdate);
      window.removeEventListener(`store-updated-api_keys`, handleApiKeysUpdate);
      window.removeEventListener(`active-api-key-changed`, handleApiKeysUpdate);
      window.removeEventListener('app-error', handleAppError);
      if (audioEl) audioEl.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [fileUrl]);



  const {
    transformingType,
    handleTransformTranscript
  } = useTransformTranscript(transcript, setTranscript, appLang, addToast, updateApiStats);

  const handleSeek = (time: string) => {
    if (!audioRef.current) return;
    // Strip brackets and split
    const cleanTime = time.replace(/[\[\]]/g, '');
    const parts = cleanTime.split(/[-:]/).map(s => s.trim()).filter(s => s);
    // Simple check if it matches MM:SS or HH:MM:SS, taking first part if range
    const target = parts.length > 0 ? parts.slice(0, 3).join(':') : "00:00"; 
    
    // Convert target to seconds
    const tParts = target.split(':').map(Number);
    let seconds = 0;
    if (tParts.length === 1) seconds = tParts[0];
    else if (tParts.length === 2) seconds = tParts[0] * 60 + tParts[1];
    else if (tParts.length === 3) seconds = tParts[0] * 3600 + tParts[1] * 60 + tParts[2];
    
    audioRef.current.currentTime = seconds;
    audioRef.current.play();
  };



  return (
    <div className={`flex h-screen overflow-hidden ${mainBgColor} ${textColor} font-sans selection:bg-indigo-500/30 ${isExtendedPause ? 'shadow-[inset_0_0_80px_rgba(239,68,68,0.6)] animate-pulse transition-all duration-500' : ''}`}>
      <SpiderWebBackground opacity={isDark ? "opacity-[0.15]" : "opacity-[0.05]"} />
      


      <div className="relative flex h-screen w-full">
        {/* Sidebar */}
        <Sidebar 
          t={t}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          sidebarSide="left"
          bgColor={isDark ? 'bg-slate-900/50 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl'}
          activeColors={activeColors}
          cardBg={cardBg}
          cardBorder={cardBorder}
          isDark={isDark}
          subTextColor={subTextColor}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          fileUrl={fileUrl}
          resetAll={handleResetAll}
          fileMeta={fileMeta}
          audioRef={audioRef}
          processTranscription={() => processTranscription(file)}
          status={status}
          history={filteredHistory}
          historyLimit={historyLimit}
          setHistoryLimit={setHistoryLimit}
          setIsHistoryFullscreen={setIsHistoryFullscreen}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
          toggleFavorite={toggleFavorite}
          backupHistory={backupHistory}
          restoreHistory={restoreHistory}
          groupHistory={(items) => {
            const groups: any = {};
            (items || []).forEach(item => {
              const d = item?.date ? new Date(item.date).toLocaleDateString() : 'Unknown';
              if (!groups[d]) groups[d] = [];
              groups[d].push(item);
            });
            return groups;
          }}
          loadHistoryItem={async (item, searchKeyword) => {
            setTranscript(item.transcript);
            setStatus('completed');
            setTranscriptMeta({ name: item.fileName, duration: item.duration, channelName: item.channelName, date: item.publishedDate });
            
            // Mark item as opened and try to load audio
            try {
              const { getFromStore, addToStore } = await import('./services/db');
              if (!item.hasBeenOpened) {
                const updatedItem = { ...item, hasBeenOpened: true };
                await addToStore('studio_history', updatedItem);
                loadHistory();
              }
              
              const audioData: any = await getFromStore('youtube_audio', item.id);
              if (audioData && audioData.base64) {
                let mimeType = 'audio/mp3';
                const ext = (audioData.format || 'mp3').toLowerCase();
                if (ext === 'm4a') mimeType = 'audio/mp4';
                else if (ext === 'wav') mimeType = 'audio/wav';
                else if (ext === 'opus' || ext === 'ogg') mimeType = 'audio/ogg';
                else if (ext === 'webm') mimeType = 'video/webm';
                else if (ext === 'mp4') mimeType = 'video/mp4';
                else if (ext === 'aac') mimeType = 'audio/aac';

                const dataUrl = `data:${mimeType};base64,${audioData.base64}`;
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                
                // Free memory
                audioData.base64 = null;
                
                const fileObj = new File([blob], item.fileName, { type: mimeType });
                setFile(fileObj);
                setFileMeta({ name: item.fileName, duration: item.duration, type: mimeType, size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB', date: new Date().toISOString() });
                if (fileUrl) URL.revokeObjectURL(fileUrl);
                setFileUrl(URL.createObjectURL(fileObj));
                setTranscriptMeta(null); // Clear transcript meta so it falls back to fileMeta and isSynced becomes true
              }
            } catch (e) {
              console.error("Failed to load audio for history item", e);
            }

            setActiveHistoryId(item.id);
            if (searchKeyword) {
              setTimeout(() => {
                setSearchTerm(searchKeyword);
              }, 100);
            }
          }}
          appLang={appLang}
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          activeHistoryId={activeHistoryId}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          histSentimentFilter={histSentimentFilter}
          setHistSentimentFilter={setHistSentimentFilter}
          batchQueue={batchQueue}
          currentBatchIndex={currentBatchIndex}
          isBatchProcessing={isBatchProcessing}
          hasBatchStarted={hasBatchStarted}
          isBatchPaused={isBatchPaused}
          batchCountdown={batchCountdown}
          startBatch={startBatch}
          pauseBatch={pauseBatch}
          resumeBatch={resumeBatch}
          cancelBatch={cancelBatch}
          skipNextBatchFile={skipNextBatchFile}
          removeBatchFile={removeBatchFile}
          jumpToBatchFile={jumpToBatchFile}
          failedFiles={failedFiles}
          retryFailedFiles={retryFailedFiles}
          progress={batchProgress}
          etaSeconds={etaSeconds}
        />

        {/* Sidebar Toggle Arrow - Hidden on Mobile to avoid overlay issues */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 z-50 w-5 h-24 bg-indigo-600 border border-l-0 border-white/20 rounded-r-lg flex items-center justify-center transition-all duration-500 shadow-xl cursor-pointer hover:bg-indigo-500 group hidden md:flex ${isSidebarOpen ? 'left-[400px]' : 'left-0'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <svg 
            className={`w-3 h-3 text-white transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300">
          <Header 
            t={t}
            status={status}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isInformationOpen={isInformationOpen}
            setIsInformationOpen={setIsInformationOpen}
            isActivityLogOpen={isActivityLogOpen}
            setIsActivityLogOpen={setIsActivityLogOpen}
            isDark={isDark}
            setTheme={(v) => setTheme(typeof v === 'function' ? v(theme) : v)}
            appLang={appLang}
            setAppLang={(v) => setAppLang(typeof v === 'function' ? v(appLang) : v)}
            activeColors={activeColors}
            setActiveTool={(tool) => {
              setActiveTool(prev => prev === tool ? null : tool);
            }}
            setIsReportOpen={setIsReportOpen}
            setIsSettingsOpen={setIsSettingsOpen}
          />

          <div className="flex-1 flex flex-col relative overflow-hidden">
            {isExtendedPause && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
                <div className="text-red-500 text-[12rem] font-black leading-none animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                  {batchCountdown}
                </div>
                <div className="text-white text-2xl font-medium mt-8 tracking-wide animate-pulse">
                  {appLang === 'bn' ? 'ইউটিউব ব্লক এড়াতে বিরতি চলছে...' : 'Pausing to prevent YouTube block...'}
                </div>
              </div>
            )}
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <YouTubeMonitor 
                isOpen={activeTool === 'youtube_monitor'}
              onClose={() => setActiveTool(null)}
              isDark={isDark}
              activeColors={activeColors}
              appLang={appLang}
              addToast={addToast}
              onLoadTranscript={async (transcript, title, duration, historyId, channelName, date, videoId) => {
                setTranscript(transcript);
                setStatus('completed');
                setTranscriptMeta({ name: title, duration, channelName, date });
                
                // Try to load audio from store if videoId is provided
                if (videoId) {
                  try {
                    const { getFromStore } = await import('./services/db');
                    const audioData: any = await getFromStore('youtube_audio', videoId);
                    if (audioData && audioData.base64) {
                      let mimeType = 'audio/mp3';
                      const ext = (audioData.format || 'mp3').toLowerCase();
                      if (ext === 'm4a') mimeType = 'audio/mp4';
                      else if (ext === 'wav') mimeType = 'audio/wav';
                      else if (ext === 'opus' || ext === 'ogg') mimeType = 'audio/ogg';
                      else if (ext === 'webm') mimeType = 'video/webm';
                      else if (ext === 'mp4') mimeType = 'video/mp4';
                      else if (ext === 'aac') mimeType = 'audio/aac';

                      const dataUrl = `data:${mimeType};base64,${audioData.base64}`;
                      const res = await fetch(dataUrl);
                      const blob = await res.blob();
                      
                      // Free memory
                      audioData.base64 = null;
                      
                      const fileObj = new File([blob], title, { type: mimeType });
                      setFile(fileObj);
                      setFileMeta({ name: title, duration, type: mimeType, size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB', date: new Date().toISOString() });
                      if (fileUrl) URL.revokeObjectURL(fileUrl);
                      setFileUrl(URL.createObjectURL(fileObj));
                      setTranscriptMeta(null); // Clear transcript meta so it falls back to fileMeta and isSynced becomes true
                    }
                  } catch (e) {
                    console.error("Failed to load audio for transcript", e);
                  }
                }

                setActiveTool(null); // Close monitor to show transcript
                if (historyId) {
                  setActiveHistoryId(historyId);
                }
              }}
              onStartTranscription={async (file, metadata, isAutoProcess) => {
                const fileObj = file as File;
                setFile(fileObj);
                setFileMeta(metadata);
                setTranscriptMeta(null); // Clear previous transcript meta
                if (fileUrl) URL.revokeObjectURL(fileUrl);
                setFileUrl(URL.createObjectURL(fileObj));
                setActiveTool(null); // Always close monitor to show file info and transcription
                const result = await processTranscription(fileObj, metadata, isAutoProcess);
                return result?.success ? result.text : undefined;
              }}
              isAppProcessing={status === 'processing'}
            />

            <TranscriptOutput 
              t={t}
              status={status}
              isSearchExpanded={true}
              setIsSearchExpanded={() => {}}
              transcriptSearchInputRef={transcriptSearchInputRef}
              searchTerm={searchTerm}
              handleSearchChange={(e) => setSearchTerm(e.target.value)}
              activeColors={activeColors}
              downloadText={() => {}}
              setStatus={setStatus}
              setTranscript={setTranscript}
              mainBgColor={mainBgColor}
              fileUrl={fileUrl}
              textColor={textColor}
              isDark={isDark}
              setIsSidebarOpen={setIsSidebarOpen}
              fileMeta={fileMeta}
              processTranscription={() => processTranscription(file)}
              transcriptCardBg={cardBg}
              cardBorder={cardBorder}
              transcript={transcript}
              fontSize={fontSize}
              setFontSize={setFontSize}
              matchCount={matchCount}
              currentMatchIndex={currentMatchIndex}
              goToNextMatch={goToNextMatch}
              goToPrevMatch={goToPrevMatch}
              errorMessage={errorMessage}
              addToast={addToast}
              appLang={appLang}
              history={history}
              progress={progress}
              currentStage={currentStage}
              elapsedSeconds={elapsedSeconds}
              estimatedSeconds={estimatedSeconds}
              audioCurrentTime={audioCurrentTime}
              activeTranscriptSourceMeta={transcriptMeta || fileMeta}
              transformTranscript={handleTransformTranscript}
              transformingType={transformingType}
              onSeek={handleSeek}
              onModelUpdate={updateApiStats}
              setIsAiLoading={setIsAiLoading}
              setActiveHistoryId={setActiveHistoryId}
              setTranscriptMeta={setTranscriptMeta}
            />
            </div>

            <div className="hidden md:block">
              <Footer 
                t={t}
                activeColors={activeColors}
                activeApiKeySource={activeApiKeySource}
                activeModelName={activeModelName}
                totalApiCalls={totalApiCalls}
                isAiLoading={isAiLoading}
                appLang={appLang}
                isDark={isDark}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {isHistoryFullscreen && (
        <ExpandedHistory 
          t={t}
          isDark={isDark}
          setIsHistoryFullscreen={setIsHistoryFullscreen}
          histSearch={histSearch}
          setHistSearch={setHistSearch}
          histDateFilter={histDateFilter}
          setHistDateFilter={setHistDateFilter}
          histSentimentFilter={histSentimentFilter}
          setHistSentimentFilter={setHistSentimentFilter}
          filteredHistory={filteredHistory}
          loadHistoryItem={async (item, searchKeyword) => {
             setTranscript(item.transcript);
             setStatus('completed');
             setTranscriptMeta({ name: item.fileName, duration: item.duration, channelName: item.channelName, date: item.publishedDate });
             
             // Mark item as opened and try to load audio
             try {
               const { getFromStore, addToStore } = await import('./services/db');
               if (!item.hasBeenOpened) {
                 const updatedItem = { ...item, hasBeenOpened: true };
                 await addToStore('studio_history', updatedItem);
                 loadHistory();
               }

               const audioData: any = await getFromStore('youtube_audio', item.id);
               if (audioData && audioData.base64) {
                 let mimeType = 'audio/mp3';
                 const ext = (audioData.format || 'mp3').toLowerCase();
                 if (ext === 'm4a') mimeType = 'audio/mp4';
                 else if (ext === 'wav') mimeType = 'audio/wav';
                 else if (ext === 'opus' || ext === 'ogg') mimeType = 'audio/ogg';
                 else if (ext === 'webm') mimeType = 'video/webm';
                 else if (ext === 'mp4') mimeType = 'video/mp4';
                 else if (ext === 'aac') mimeType = 'audio/aac';

                 const dataUrl = `data:${mimeType};base64,${audioData.base64}`;
                 const res = await fetch(dataUrl);
                 const blob = await res.blob();
                 
                 // Free memory
                 audioData.base64 = null;
                 
                 const fileObj = new File([blob], item.fileName, { type: mimeType });
                 setFile(fileObj);
                 setFileMeta({ name: item.fileName, duration: item.duration, type: mimeType, size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB', date: new Date().toISOString() });
                 if (fileUrl) URL.revokeObjectURL(fileUrl);
                 setFileUrl(URL.createObjectURL(fileObj));
                 setTranscriptMeta(null); // Clear transcript meta so it falls back to fileMeta and isSynced becomes true
               }
             } catch (e) {
               console.error("Failed to load audio for history item", e);
             }

             setActiveHistoryId(item.id);
             setIsHistoryFullscreen(false);
             if (searchKeyword) {
               setTimeout(() => {
                 setSearchTerm(searchKeyword);
               }, 100);
             }
          }}
          activeColors={activeColors}
        />
      )}

      <InformationModal 
        isOpen={isInformationOpen}
        onClose={() => setIsInformationOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        addToast={addToast}
      />

      <ToolsModal 
        activeTool={activeTool === 'youtube_monitor' ? null : activeTool}
        onClose={() => setActiveTool(null)}
        isMinimized={isToolsMinimized}
        setIsMinimized={setIsToolsMinimized}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        addToast={addToast}
        onFileSelect={(f) => handleFileChange({ target: { files: [f] } }, true)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
        addToast={addToast}
      />

      <ActivityLogsModal 
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
      />

      <TranscriberReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        isDark={isDark}
        activeColors={activeColors}
        appLang={appLang}
      />

      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        elapsedSeconds={elapsedSeconds} 
        appLang={appLang} 
      />

      <BatchSummaryModal 
        isOpen={isBatchSummaryOpen}
        onClose={() => setIsBatchSummaryOpen(false)}
        processedCount={processedCount}
        failedFiles={failedFiles}
        onRetryFailed={retryFailedFiles}
        appLang={appLang}
        isDark={isDark}
        activeColors={activeColors}
      />

      {/* 
      <ChatBot 
        activeColors={activeColors}
        isDark={isDark}
        appLang={appLang}
        addToast={addToast}
      /> 
      */}
    </div>
  );
};

export default App;
