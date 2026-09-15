import { useState, useEffect, useCallback } from 'react';
import { getAllFromStore, deleteFromStore, addToStore, STORES } from '../services/db';
import { HistoryItem } from '../types';

export const useHistory = (
  appLang: 'en' | 'bn',
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  onHistoryItemDeleted: (id: string) => void
) => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const cached = sessionStorage.getItem('historyCache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(() => {
    return !sessionStorage.getItem('historyCache');
  });
  const [historyLimit, setHistoryLimit] = useState(20);
  const [isHistoryFullscreen, setIsHistoryFullscreen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [histSearch, setHistSearch] = useState('');
  const [debouncedHistSearch, setDebouncedHistSearch] = useState('');
  const [histDateFilter, setHistDateFilter] = useState('');
  const [histSentimentFilter, setHistSentimentFilter] = useState('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHistSearch(histSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [histSearch]);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(prev => history.length === 0 ? true : prev);
    try {
      const allHistory = (await getAllFromStore(STORES.HISTORY)) as HistoryItem[];
      const sorted = allHistory.sort((a: HistoryItem, b: HistoryItem) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(sorted);
      try {
        sessionStorage.setItem('historyCache', JSON.stringify(sorted.slice(0, 50)));
      } catch (e) {
        // Ignore quota exceeded
      }
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [history.length]);

  const handleDeleteHistoryItem = async (id: string) => {
    await deleteFromStore(STORES.HISTORY, id);
    onHistoryItemDeleted(id);
    loadHistory();
    addToast(appLang === 'bn' ? 'ডিলিট করা হয়েছে' : 'Deleted', 'warning');
  };

  const toggleFavorite = async (id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      const updatedItem = { ...item, isFavorite: !item.isFavorite };
      await addToStore(STORES.HISTORY, updatedItem);
      loadHistory();
      addToast(
        updatedItem.isFavorite 
          ? (appLang === 'bn' ? 'বুকমার্কে যোগ করা হয়েছে' : 'Added to favorites') 
          : (appLang === 'bn' ? 'বুকমার্ক থেকে সরানো হয়েছে' : 'Removed from favorites'), 
        'success'
      );
    }
  };

  const backupHistory = () => {
    const jsonStr = JSON.stringify(history);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `licell_history_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    addToast(appLang === 'bn' ? 'ব্যাকআপ ডাউনলোড শুরু হয়েছে' : 'Backup download started', 'info');
  };

  const restoreHistory = async (file: File) => {
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.id && item.date && item.transcript) {
            await addToStore(STORES.HISTORY, item);
          }
        }
        loadHistory();
        addToast(appLang === 'bn' ? 'হিস্টোরি রিস্টোর সফল হয়েছে' : 'History restored successfully', 'success');
      } else {
        throw new Error("Invalid format");
      }
    } catch (e) {
      console.error("Failed to restore history", e);
      addToast(appLang === 'bn' ? 'রিস্টোর করতে সমস্যা হয়েছে' : 'Failed to restore history', 'error');
    }
  };

  const groupHistory = useCallback((items: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    if (Array.isArray(items)) {
      items.forEach(item => {
        const dateStr = item?.date ? new Date(item.date).toLocaleDateString() : 'Unknown';
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(item);
      });
    }
    return groups;
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesSearch = (item.fileName || '').toLowerCase().includes(debouncedHistSearch.toLowerCase());
    const matchesDate = histDateFilter ? (item.date && typeof item.date === 'string' ? item.date.startsWith(histDateFilter) : false) : true;
    const matchesFavorite = showFavoritesOnly ? !!item?.isFavorite : true;
    const matchesSentiment = histSentimentFilter === 'All' ? true : item?.bgbRemark === histSentimentFilter;
    return matchesSearch && matchesDate && matchesFavorite && matchesSentiment;
  });

  return {
    history,
    historyLimit, setHistoryLimit,
    isHistoryFullscreen, setIsHistoryFullscreen,
    activeHistoryId, setActiveHistoryId,
    histSearch, setHistSearch,
    histDateFilter, setHistDateFilter,
    histSentimentFilter, setHistSentimentFilter,
    showFavoritesOnly, setShowFavoritesOnly,
    loadHistory,
    handleDeleteHistoryItem,
    toggleFavorite,
    backupHistory,
    restoreHistory,
    groupHistory,
    filteredHistory,
    isLoadingHistory
  };
};
