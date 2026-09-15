import { useState, useEffect, useRef } from 'react';

export const useBatchMetrics = (
  isBatchProcessing: boolean, 
  isBatchPaused: boolean, 
  hasBatchStarted: boolean,
  batchQueueLength: number,
  currentBatchIndex: number
) => {
  const [activeProcessingTime, setActiveProcessingTime] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  
  const lastStartTimeRef = useRef<number | null>(null);

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
    if (batchQueueLength === 0) {
      setProgress(0);
      setEtaSeconds(null);
      return;
    }

    const currentProgress = (currentBatchIndex / batchQueueLength) * 100;
    setProgress(currentProgress);

    if (currentBatchIndex > 0 && activeProcessingTime > 0) {
      const timePerFile = activeProcessingTime / currentBatchIndex;
      const remainingFiles = batchQueueLength - currentBatchIndex;
      setEtaSeconds(Math.round((timePerFile * remainingFiles) / 1000));
    } else {
      setEtaSeconds(null);
    }
  }, [currentBatchIndex, batchQueueLength, activeProcessingTime]);

  const resetMetrics = () => {
    setActiveProcessingTime(0);
  };

  return {
    progress,
    etaSeconds,
    activeProcessingTime,
    resetMetrics
  };
};
