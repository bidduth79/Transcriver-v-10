import { useEffect } from 'react';

export const useAppEventListeners = (
  loadHistory: () => void,
  updateApiStats: () => void,
  addToast: (msg: string, type: 'error') => void,
  fileUrl: string | null
) => {
  useEffect(() => {
    loadHistory();
    updateApiStats();
    
    const handleHistoryUpdate = () => {
      loadHistory();
    };
    
    const handleApiKeysUpdate = () => {
      updateApiStats();
    };
    
    const handleAppError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addToast(customEvent.detail.message, 'error');
    };
    
    window.addEventListener(`store-updated-studio_history`, handleHistoryUpdate);
    window.addEventListener(`store-updated-api_keys`, handleApiKeysUpdate);
    window.addEventListener(`active-api-key-changed`, handleApiKeysUpdate);
    window.addEventListener('app-error', handleAppError);
    
    return () => {
      window.removeEventListener(`store-updated-studio_history`, handleHistoryUpdate);
      window.removeEventListener(`store-updated-api_keys`, handleApiKeysUpdate);
      window.removeEventListener(`active-api-key-changed`, handleApiKeysUpdate);
      window.removeEventListener('app-error', handleAppError);
    };
  }, [fileUrl, loadHistory, updateApiStats, addToast]);
};
