import { useCallback } from 'react';
import { toast } from 'sonner';

export const useToast = (appLang: string) => {
  const addToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning') => {
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
  }, []); // appLang is not used inside anymore because we just pass msg directly

  return { addToast };
};
