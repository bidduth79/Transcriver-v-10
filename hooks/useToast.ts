import { useCallback } from 'react';
import { toast } from 'sonner';

export const useToast = (appLang: string) => {
  const addToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning') => {
    // Schedule via macrotask so sonner's internal flushSync never runs during React lifecycle rendering
    setTimeout(() => {
      switch (type) {
        case 'success':
          toast.success(msg);
          break;
        case 'error':
          toast.error(msg);
          break;
        case 'warning':
          toast.warning(msg);
          break;
        case 'info':
        default:
          toast.info(msg);
          break;
      }
    }, 0);
  }, []);

  return { addToast };
};
