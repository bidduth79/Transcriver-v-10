import { useState, useRef, useEffect } from 'react';
import { TranscriptMeta, FileMeta } from '../types';
import { getFileMetadata } from './batch/batchUtils';
import { useBatchMetrics } from './batch/useBatchMetrics';
import { useBatchTimer } from './batch/useBatchTimer';

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
  const isBatchPausedRef = useRef(false);

  useEffect(() => {
    isBatchPausedRef.current = isBatchPaused;
  }, [isBatchPaused]);
  
  const [failedFiles, setFailedFiles] = useState<FailedFile[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [isBatchSummaryOpen, setIsBatchSummaryOpen] = useState(false);

  const {
    progress,
    etaSeconds,
    resetMetrics
  } = useBatchMetrics(isBatchProcessing, isBatchPaused, hasBatchStarted, batchQueue.length, currentBatchIndex);

  const {
    batchCountdown,
    setBatchCountdown,
    isExtendedPause,
    setIsExtendedPause,
    clearTimer,
    startCountdown
  } = useBatchTimer(isBatchPausedRef);

  const finishProcessing = () => {
    setIsBatchProcessing(false);
    setHasBatchStarted(false);
    
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
  };

  const startCountdownForNextFile = (queue: File[], nextIndex: number) => {
    if (isBatchPausedRef.current) {
      setCurrentBatchIndex(nextIndex);
      return;
    }
    
    startCountdown(
      nextIndex, 
      queue.length, 
      () => processNextBatchFile(queue, nextIndex), 
      finishProcessing
    );
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
      
      await processTranscription(currentFile, metadata, true);
      
      setProcessedCount(prev => prev + 1);
      startCountdownForNextFile(queue, index + 1);
    } catch (error: any) {
      console.error(`Error processing ${currentFile.name}:`, error);
      
      if (retryCount < 1) {
        addToast(appLang === 'bn' ? `${currentFile.name} ব্যর্থ হয়েছে, আবার চেষ্টা করা হচ্ছে...` : `${currentFile.name} failed, retrying...`, 'warning');
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
    resetMetrics();
    processNextBatchFile(batchQueue, currentBatchIndex);
  };

  const pauseBatch = () => {
    setIsBatchPaused(true);
    clearTimer();
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
    setFailedFiles([]);
    setProcessedCount(0);
    resetMetrics();
    clearTimer();
  };

  const skipNextBatchFile = () => {
    clearTimer();
    processNextBatchFile(batchQueue, currentBatchIndex + 1);
  };

  const jumpToBatchFile = (index: number) => {
    clearTimer();
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
      clearTimer();
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
    resetMetrics();
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
