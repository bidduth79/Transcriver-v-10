import { useState, useEffect } from 'react';
import { STORES, getAllFromStore, addToStore, deleteFromStore } from '../../../services/db';
import { useAppStore } from '@/hooks/useAppStore';
import { YouTubeApiKey } from '../../../types/youtube';

export const useYouTubeApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<YouTubeApiKey[]>([]);

  const loadApiKeys = async () => {
    const loadedKeys = (await getAllFromStore(STORES.YOUTUBE_API_KEYS)) as YouTubeApiKey[];
    const validKeys = loadedKeys || [];
    
    const currentDatePT = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", year: 'numeric', month: 'numeric', day: 'numeric' });
    
    for (const key of validKeys) {
      if (key.isExhausted && key.exhaustedAt) {
        const exhaustedDatePT = new Date(key.exhaustedAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles", year: 'numeric', month: 'numeric', day: 'numeric' });
        if (exhaustedDatePT !== currentDatePT) {
          key.isExhausted = false;
          key.exhaustedAt = undefined;
          await addToStore(STORES.YOUTUBE_API_KEYS, key);
        }
      }
    }
    const envKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim() !== '') {
      const trimmed = envKey.trim();
      const exists = validKeys.some(k => k.key === trimmed);
      if (!exists) {
        validKeys.unshift({
          id: 'env_youtube_key',
          key: trimmed,
          label: 'Environment (.env)',
          isActive: true,
          isPrimary: validKeys.length === 0,
          isExhausted: false,
          addedAt: Date.now()
        });
      }
    }

    setApiKeys(validKeys);
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const apiKeyUpdates = useAppStore(state => state.storeUpdates[STORES.YOUTUBE_API_KEYS]);
  useEffect(() => {
    loadApiKeys();
  }, [apiKeyUpdates]);

  const addApiKey = async (key: YouTubeApiKey) => {
    await addToStore(STORES.YOUTUBE_API_KEYS, key);
    setApiKeys(prev => [...prev, key]);
  };

  const updateApiKey = async (id: string, updatedKey: Partial<YouTubeApiKey>) => {
    const key = apiKeys.find(k => k.id === id);
    if (!key) return;
    const newKey = { ...key, ...updatedKey };
    await addToStore(STORES.YOUTUBE_API_KEYS, newKey);
    setApiKeys(prev => prev.map(k => k.id === id ? newKey : k));
  };

  const removeApiKey = async (id: string) => {
    await deleteFromStore(STORES.YOUTUBE_API_KEYS, id);
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  return {
    apiKeys,
    addApiKey,
    updateApiKey,
    removeApiKey
  };
};
