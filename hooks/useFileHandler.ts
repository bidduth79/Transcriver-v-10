import React from 'react';
import { TranscriptMeta, FileMeta, HistoryItem } from '../types';
import { 
    showFolderUploadModal, 
    showNoFilesFoundModal, 
    showFileAlreadyTranscribedModal 
} from './fileHandlerUtils';

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
  appLang, addToast, setFile, setFileUrl, fileUrl,
  setActiveHistoryId, setTranscriptMeta, setTranscript, setStatus,
  setFileMeta, processTranscription, history, setBatchQueue,
  setCurrentBatchIndex, setIsBatchProcessing, setHasBatchStarted,
  setIsBatchPaused, setBatchCountdown, fileInputRef
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
        showNoFilesFoundModal(appLang);
        return;
      }

      showFolderUploadModal(
          appLang, 
          supportedFiles.length,
          () => {
            setBatchQueue(supportedFiles);
            setCurrentBatchIndex(0);
            setIsBatchProcessing(true);
            setHasBatchStarted(false);
            setIsBatchPaused(false);
            setBatchCountdown(0);
          },
          () => {
            if (fileInputRef.current) fileInputRef.current.value = '';
            const folderInput = document.getElementById('folderInput') as HTMLInputElement;
            if (folderInput) folderInput.value = '';
          }
      );
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
      showFileAlreadyTranscribedModal(
          appLang,
          () => {
              loadAndProcessFile(true);
          },
          () => {
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
          }
      );
    } else {
      loadAndProcessFile();
    }
    
    e.target.value = '';
  };

  return { handleFileChange };
};
