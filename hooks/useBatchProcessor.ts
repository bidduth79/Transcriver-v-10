import { useState, useRef, useEffect } from 'react';
import { TranscriptMeta, FileMeta } from '../types';

export interface FailedFile {
  file: File;
  reason: string;
}

export const useBatchProcessor = (
  appLang: 'bn' | 'en',
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  setFile: (file: File) => void,
  setFileUrl: (url: string) => void,
  setActiveHistoryId: (id: string | null) => void,
  setTranscriptMeta: (meta: TranscriptMeta | null) => void,
  setFileMeta: (meta: FileMeta) => void,
  processTranscription: (file: File, metadata: FileMeta, isAutoProcess?: boolean) => Promise<any>
) => {
  const [batchQueue, setBatchQueue] = useState<File[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [hasBatchStarted, setHasBatchStarted] = useState(false);
  const [isBatchPaused, setIsBatchPaused] = useState(false);
  const [batchCountdown, setBatchCountdown] = useState(0);
  
  const [isExtendedPause, setIsExtendedPause] = useState(false);
  
  // New states for advanced tracking
  const [failedFiles, setFailedFiles] = useState<FailedFile[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  
  // ETA and Progress tracking
  const [activeProcessingTime, setActiveProcessingTime] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  
  const isBatchPausedRef = useRef(false);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastStartTimeRef = useRef<number | null>(null);

  const [isBatchSummaryOpen, setIsBatchSummaryOpen] = useState(false);

  // Timer to update active processing time and ETA
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBatchProcessing && !isBatchPaused && hasBatchStarted) {
      lastStartTimeRef.current = Date.now();
      interval = setInterval(() => {
        if (lastStartTimeRef.current) {
          const now = Date.now();
          const delta = now - lastStartTimeRef.current;
          setActiveProcessingTime(prev => prev + delta);
          lastStartTimeRef.current = now;
        }
      }, 1000);
    } else {
      lastStartTimeRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isBatchProcessing, isBatchPaused, hasBatchStarted]);

  // Calculate Progress and ETA
  useEffect(() => {
    if (batchQueue.length === 0) {
      setProgress(0);
      setEtaSeconds(null);
      return;
    }

    const currentProgress = (currentBatchIndex / batchQueue.length) * 100;
    setProgress(currentProgress);

    if (currentBatchIndex > 0 && activeProcessingTime > 0) {
      const timePerFile = activeProcessingTime / currentBatchIndex;
      const remainingFiles = batchQueue.length - currentBatchIndex;
      setEtaSeconds(Math.round((timePerFile * remainingFiles) / 1000));
    } else {
      setEtaSeconds(null);
    }
  }, [currentBatchIndex, batchQueue.length, activeProcessingTime]);

  useEffect(() => {
    isBatchPausedRef.current = isBatchPaused;
  }, [isBatchPaused]);

  useEffect(() => {
    return () => {
      if (batchTimerRef.current) clearInterval(batchTimerRef.current);
    };
  }, []);

  const startCountdownForNextFile = (queue: File[], nextIndex: number) => {
    if (isBatchPausedRef.current) {
      setCurrentBatchIndex(nextIndex);
      return;
    }

    if (nextIndex >= queue.length) {
      setIsBatchProcessing(false);
      setHasBatchStarted(false);
      
      // Show summary toast
      setFailedFiles(prevFailed => {
        setProcessedCount(prevProcessed => {
          if (prevFailed.length > 0) {
            addToast(appLang === 'bn' 
              ? `ব্যাচ সম্পন্ন। ${prevProcessed}টি সফল, ${prevFailed.length}টি ব্যর্থ।` 
              : `Batch completed. ${prevProcessed} succeeded, ${prevFailed.length} failed.`, 'warning');
          } else {
            addToast(appLang === 'bn' ? 'ব্যাচ প্রসেসিং সফলভাবে সম্পন্ন হয়েছে' : 'Batch processing completed successfully', 'success');
          }
          setIsBatchSummaryOpen(true);
          return prevProcessed;
        });
        return prevFailed;
      });
      return;
    }

    let timeLeft = Math.floor(Math.random() * (9 - 3 + 1)) + 3;
    let isExtended = false;

    if (nextIndex > 0 && nextIndex % 5 === 0) {
      timeLeft += 10;
      isExtended = true;
    }

    setIsExtendedPause(isExtended);
    setBatchCountdown(timeLeft);
    
    batchTimerRef.current = setInterval(() => {
      timeLeft -= 1;
      setBatchCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        if (batchTimerRef.current) clearInterval(batchTimerRef.current);
        setBatchCountdown(0);
        setIsExtendedPause(false);
        if (!isBatchPausedRef.current) {
          processNextBatchFile(queue, nextIndex);
        } else {
          setCurrentBatchIndex(nextIndex);
        }
      }
    }, 1000);
  };

  const getFileMetadata = (file: File): Promise<any> => {
    return new Promise((resolve) => {
      let resolved = false;
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      
      const finish = (result: any) => {
        if (resolved) return;
        resolved = true;
        URL.revokeObjectURL(url);
        resolve(result);
      };
      
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        let durationStr = "Unknown";
        if (isFinite(duration) && !isNaN(duration)) {
          const mins = Math.floor(duration / 60);
          const secs = Math.floor(duration % 60);
          durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        finish({
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          duration: durationStr,
          type: file.type,
          date: new Date().toISOString()
        });
      };
      
      audio.onerror = () => {
        // Fallback metadata if audio parsing fails
        finish({
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          duration: "Unknown",
          type: file.type,
          date: new Date().toISOString()
        });
      };

      // Fallback timeout in case metadata loading hangs
      setTimeout(() => {
        finish({
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          duration: "Unknown",
          type: file.type,
          date: new Date().toISOString()
        });
      }, 3000);
    });
  };

  const processNextBatchFile = async (queue: File[], index: number, retryCount = 0) => {
    if (index >= queue.length) {
      startCountdownForNextFile(queue, index);
      return;
    }

    const currentFile = queue[index];
    setCurrentBatchIndex(index);
    
    if (currentFile.size > 70 * 1024 * 1024) {
      addToast(appLang === 'bn' ? `${currentFile.name} ৭০ এমবি এর বেশি, স্কিপ করা হচ্ছে` : `${currentFile.name} exceeds 70MB, skipping`, 'error');
      setFailedFiles(prev => [...prev, { file: currentFile, reason: 'Size exceeds 70MB' }]);
      startCountdownForNextFile(queue, index + 1);
      return;
    }

    setFile(currentFile);
    const url = URL.createObjectURL(currentFile);
    setFileUrl(url);
    setActiveHistoryId(null);
    setTranscriptMeta(null);
    
    try {
      const metadata = await getFileMetadata(currentFile);
      setFileMeta(metadata);
      
      // Start transcription
      await processTranscription(currentFile, metadata, true);
      
      setProcessedCount(prev => prev + 1);
      startCountdownForNextFile(queue, index + 1);
    } catch (error: any) {
      console.error(`Error processing ${currentFile.name}:`, error);
      
      if (retryCount < 1) {
        addToast(appLang === 'bn' ? `${currentFile.name} ব্যর্থ হয়েছে, আবার চেষ্টা করা হচ্ছে...` : `${currentFile.name} failed, retrying...`, 'warning');
        // 3 second backoff before retry
        setTimeout(() => {
          if (!isBatchPausedRef.current) {
            processNextBatchFile(queue, index, retryCount + 1);
          } else {
            setCurrentBatchIndex(index);
          }
        }, 3000);
      } else {
        addToast(appLang === 'bn' ? `${currentFile.name} ট্রান্সক্রাইব করা যায়নি` : `Failed to transcribe ${currentFile.name}`, 'error');
        setFailedFiles(prev => [...prev, { file: currentFile, reason: error?.message || 'Transcription failed' }]);
        startCountdownForNextFile(queue, index + 1);
      }
    }
  };

  const startBatch = () => {
    setHasBatchStarted(true);
    setIsBatchProcessing(true);
    setIsBatchPaused(false);
    setFailedFiles([]);
    setProcessedCount(0);
    setActiveProcessingTime(0);
    processNextBatchFile(batchQueue, currentBatchIndex);
  };

  const pauseBatch = () => {
    setIsBatchPaused(true);
    if (batchTimerRef.current) {
      clearInterval(batchTimerRef.current);
      setBatchCountdown(0);
    }
  };

  const resumeBatch = () => {
    setIsBatchPaused(false);
    processNextBatchFile(batchQueue, currentBatchIndex);
  };

  const cancelBatch = () => {
    setBatchQueue([]);
    setCurrentBatchIndex(0);
    setIsBatchProcessing(false);
    setHasBatchStarted(false);
    setIsBatchPaused(false);
    setBatchCountdown(0);
    setFailedFiles([]);
    setProcessedCount(0);
    setActiveProcessingTime(0);
    if (batchTimerRef.current) clearInterval(batchTimerRef.current);
  };

  const skipNextBatchFile = () => {
    if (batchTimerRef.current) clearInterval(batchTimerRef.current);
    setBatchCountdown(0);
    processNextBatchFile(batchQueue, currentBatchIndex + 1);
  };

  const jumpToBatchFile = (index: number) => {
    if (batchTimerRef.current) clearInterval(batchTimerRef.current);
    setBatchCountdown(0);
    setHasBatchStarted(true);
    setIsBatchPaused(false);
    processNextBatchFile(batchQueue, index);
  };

  const removeBatchFile = (indexToRemove: number) => {
    const newQueue = batchQueue.filter((_, i) => i !== indexToRemove);
    setBatchQueue(newQueue);
    
    if (indexToRemove < currentBatchIndex) {
      setCurrentBatchIndex(prev => prev - 1);
    } else if (indexToRemove === currentBatchIndex && hasBatchStarted && !isBatchPaused) {
      if (batchTimerRef.current) clearInterval(batchTimerRef.current);
      setBatchCountdown(0);
      processNextBatchFile(newQueue, currentBatchIndex);
    }
    
    if (newQueue.length <= 1) {
      cancelBatch();
    }
  };

  const retryFailedFiles = () => {
    if (failedFiles.length === 0) return;
    const filesToRetry = failedFiles.map(f => f.file);
    setBatchQueue(filesToRetry);
    setCurrentBatchIndex(0);
    setFailedFiles([]);
    setProcessedCount(0);
    setActiveProcessingTime(0);
    setHasBatchStarted(true);
    setIsBatchPaused(false);
    setIsBatchProcessing(true);
    processNextBatchFile(filesToRetry, 0);
  };

  return {
    batchQueue, setBatchQueue,
    currentBatchIndex, setCurrentBatchIndex,
    isBatchProcessing, setIsBatchProcessing,
    hasBatchStarted, setHasBatchStarted,
    isBatchPaused, setIsBatchPaused,
    isExtendedPause, setIsExtendedPause,
    batchCountdown, setBatchCountdown,
    failedFiles, processedCount,
    progress, etaSeconds,
    isBatchSummaryOpen, setIsBatchSummaryOpen,
    startBatch, pauseBatch, resumeBatch, cancelBatch, skipNextBatchFile, jumpToBatchFile, removeBatchFile, retryFailedFiles
  };
};
