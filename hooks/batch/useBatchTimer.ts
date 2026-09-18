import { useState, useRef, useEffect, useCallback } from 'react';

export const useBatchTimer = (isBatchPausedRef: React.MutableRefObject<boolean>) => {
  const [batchCountdown, setBatchCountdown] = useState(0);
  const [isExtendedPause, setIsExtendedPause] = useState(false);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (batchTimerRef.current) clearInterval(batchTimerRef.current);
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (batchTimerRef.current) clearInterval(batchTimerRef.current);
    setBatchCountdown(0);
  }, []);

  const startCountdown = useCallback((
    nextIndex: number, 
    queueLength: number, 
    onTickComplete: () => void,
    onFinishProcessing: () => void
  ) => {
    if (isBatchPausedRef.current) {
      return;
    }

    if (nextIndex >= queueLength) {
      onFinishProcessing();
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
          onTickComplete();
        }
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    batchCountdown,
    setBatchCountdown,
    isExtendedPause,
    setIsExtendedPause,
    clearTimer,
    startCountdown
  };
};
