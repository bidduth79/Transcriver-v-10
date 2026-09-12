import { useRef } from 'react';

export const useHistoryItemCard = (item: any, onDeleteHistoryItem: any, loadHistoryItem: any) => {
  const timerRef = useRef<number | null>(null);
  const isLongPressTriggered = useRef(false);

  const handleStart = () => {
    isLongPressTriggered.current = false;
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      if (onDeleteHistoryItem) {
        onDeleteHistoryItem(item.id);
        if (navigator.vibrate) navigator.vibrate(200);
      }
    }, 3000);
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: any) => {
    if (!isLongPressTriggered.current) {
      loadHistoryItem(item);
    }
  };

  const handleTouchEnd = (e: any) => {
    handleEnd();
  };

  const formatProcessingTime = (timeStr: string) => {
    if (!timeStr) return timeStr;
    
    if (timeStr.endsWith('s') && !timeStr.includes('m') && !timeStr.includes(':')) {
      const totalSecs = parseInt(timeStr.replace('s', ''), 10);
      if (!isNaN(totalSecs)) {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        if (mins > 0) {
          return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        } else {
          return `${secs}s`;
        }
      }
    }

    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10);
        const secs = parseInt(parts[1], 10);
        if (!isNaN(mins) && !isNaN(secs)) {
          if (mins > 0) {
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
          } else {
            return `${secs}s`;
          }
        }
      }
    }
    
    return timeStr;
  };

  return {
    handleStart,
    handleEnd,
    handleClick,
    handleTouchEnd,
    formatProcessingTime
  };
};
