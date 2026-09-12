import React from 'react';
import Swal from 'sweetalert2';
import { TranscriptMeta, FileMeta, HistoryItem } from '../types';

interface UseFileHandlerProps {
  appLang: string;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  setFile: (file: File) => void;
  setFileUrl: (url: string) => void;
  fileUrl: string | null;
  setActiveHistoryId: (id: string | null) => void;
  setTranscriptMeta: (meta: TranscriptMeta | null) => void;
  setTranscript: (t: string) => void;
  setStatus: (s: 'idle' | 'processing' | 'completed' | 'error') => void;
  setFileMeta: (m: FileMeta) => void;
  processTranscription: (file: File, meta?: FileMeta) => void;
  history: HistoryItem[];
  setBatchQueue: (q: File[]) => void;
  setCurrentBatchIndex: (i: number) => void;
  setIsBatchProcessing: (b: boolean) => void;
  setHasBatchStarted: (b: boolean) => void;
  setIsBatchPaused: (b: boolean) => void;
  setBatchCountdown: (c: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const useFileHandler = ({
  appLang,
  addToast,
  setFile,
  setFileUrl,
  fileUrl,
  setActiveHistoryId,
  setTranscriptMeta,
  setTranscript,
  setStatus,
  setFileMeta,
  processTranscription,
  history,
  setBatchQueue,
  setCurrentBatchIndex,
  setIsBatchProcessing,
  setHasBatchStarted,
  setIsBatchPaused,
  setBatchCountdown,
  fileInputRef
}: UseFileHandlerProps) => {

  const handleFileChange = (e: any, autoStart: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 1 || (e.target as HTMLInputElement).webkitdirectory) {
      const fileArray = Array.from(files) as File[];
      
      const supportedFiles = fileArray.filter(file => {
        const type = file.type;
        const name = file.name.toLowerCase();
        return type.startsWith('audio/') || type.startsWith('video/') || 
               name.endsWith('.mp3') || name.endsWith('.wav') || 
               name.endsWith('.m4a') || name.endsWith('.mp4') || 
               name.endsWith('.webm') || name.endsWith('.ogg') ||
               name.endsWith('.aac') || name.endsWith('.opus') || name.endsWith('.flac');
      });

      if (supportedFiles.length === 0) {
        Swal.fire({
          html: `
            <div style="display: flex; align-items: center; padding: 12px 16px; min-width: 300px; max-width: 400px; gap: 12px; flex-direction: column;">
              <div style="display: flex; align-items: center; width: 100%; gap: 12px;">
                <div style="flex-shrink: 0; width: 32px; height: 32px; background-color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
                <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
                  <span style="font-weight: 600; color: white; font-size: 14px; line-height: 1.2;">${appLang === 'bn' ? 'কোনো অডিও/ভিডিও ফাইল পাওয়া যায়নি' : 'No Audio/Video Files Found'}</span>
                </div>
              </div>
            </div>
          `,
          toast: false,
          position: 'center',
          showConfirmButton: false,
          timer: 3000,
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
              if (fileInputRef.current) fileInputRef.current.value = '';
              const folderInput = document.getElementById('folderInput') as HTMLInputElement;
              if (folderInput) folderInput.value = '';
            });
          }
        }
      });
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
      setTranscriptMeta(null);
      setTranscript('');
      setStatus('idle');
      
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
              audio.onerror = () => {
                setFileMeta({
                  name: selectedFile.name,
                  size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
                  duration: 'Unknown',
                  type: selectedFile.type,
                  date: new Date().toISOString()
                });
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
    
    e.target.value = '';
  };

  return { handleFileChange };
};
