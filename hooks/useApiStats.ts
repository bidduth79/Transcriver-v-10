import { useState, useCallback } from 'react';
import { getActiveProvider, getTotalCalls } from '../services/ApiKeyManager';

export const useApiStats = () => {
  const [totalApiCalls, setTotalApiCalls] = useState(0);
  const [activeApiKeySource, setActiveApiKeySource] = useState('Checking...');
  const [activeModelName, setActiveModelName] = useState('Loading...');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const updateApiStats = useCallback(async () => {
    const calls = await getTotalCalls();
    setTotalApiCalls(calls);
    const provider = await getActiveProvider();
    if (provider) {
      setActiveApiKeySource(provider.source);
      setActiveModelName(provider.model);
    } else {
      setActiveApiKeySource('None');
      setActiveModelName('None');
    }
  }, []);

  return {
    totalApiCalls,
    activeApiKeySource,
    activeModelName,
    isAiLoading,
    setIsAiLoading,
    updateApiStats
  };
};
