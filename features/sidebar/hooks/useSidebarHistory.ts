import { useState, useRef, useCallback } from 'react';

export const useSidebarHistory = (history: any[], historyLimit: number, setHistoryLimit: (val: any) => void) => {
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const bottomRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (node) {
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (history.length < historyLimit) return;
          
          setIsHistoryLoading(true);
          setTimeout(() => {
            setHistoryLimit((prev: number) => {
              return prev + 20;
            });
            setIsHistoryLoading(false);
          }, 800);
        }
      });
      observer.current.observe(node);
    }
  }, [setHistoryLimit, history.length, historyLimit]);

  return { isHistoryLoading, bottomRef };
};
