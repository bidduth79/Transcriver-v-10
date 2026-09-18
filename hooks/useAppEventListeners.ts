import { useEffect } from 'react';
import { useAppStore } from './useAppStore';

export const useAppEventListeners = (
  loadHistory: () => void,
  updateApiStats: () => void,
  addToast: (msg: string, type: 'error') => void,
  fileUrl: string | null
) => {
  const storeUpdates = useAppStore(state => state.storeUpdates);
  const activeApiKeyChanged = useAppStore(state => state.activeApiKeyChanged);
  const appError = useAppStore(state => state.appError);

  const studioHistoryUpdate = storeUpdates['studio_history'];
  const apiKeysUpdate = storeUpdates['api_keys'];

  useEffect(() => {
    loadHistory();
  }, [studioHistoryUpdate, loadHistory]);

  useEffect(() => {
    updateApiStats();
  }, [apiKeysUpdate, activeApiKeyChanged, updateApiStats]);

  useEffect(() => {
    if (appError) {
      addToast(appError, 'error');
      useAppStore.getState().setAppError(null);
    }
  }, [appError, addToast]);

  useEffect(() => {
    loadHistory();
    updateApiStats();
  }, [fileUrl, loadHistory, updateApiStats]);
};
