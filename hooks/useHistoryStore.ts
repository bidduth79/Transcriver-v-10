import { create } from 'zustand';
import { HistoryItem } from '../types';

interface HistoryState {
  history: HistoryItem[];
  setHistory: (history: HistoryItem[] | ((prev: HistoryItem[]) => HistoryItem[])) => void;
  
  isLoadingHistory: boolean;
  setIsLoadingHistory: (isLoading: boolean | ((prev: boolean) => boolean)) => void;
  
  historyLimit: number;
  setHistoryLimit: (limit: number | ((prev: number) => number)) => void;
  
  isHistoryFullscreen: boolean;
  setIsHistoryFullscreen: (isFullscreen: boolean | ((prev: boolean) => boolean)) => void;
  
  activeHistoryId: string | null;
  setActiveHistoryId: (id: string | null | ((prev: string | null) => string | null)) => void;
  
  histSearch: string;
  setHistSearch: (search: string | ((prev: string) => string)) => void;
  
  debouncedHistSearch: string;
  setDebouncedHistSearch: (search: string | ((prev: string) => string)) => void;
  
  histDateFilter: string;
  setHistDateFilter: (filter: string | ((prev: string) => string)) => void;
  
  histSentimentFilter: string;
  setHistSentimentFilter: (filter: string | ((prev: string) => string)) => void;
  
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  history: (() => {
    try {
      const cached = sessionStorage.getItem('historyCache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  })(),
  setHistory: (history) => set((state) => ({
    history: typeof history === 'function' ? history(state.history) : history
  })),
  
  isLoadingHistory: (() => {
    return !sessionStorage.getItem('historyCache');
  })(),
  setIsLoadingHistory: (isLoading) => set((state) => ({
    isLoadingHistory: typeof isLoading === 'function' ? isLoading(state.isLoadingHistory) : isLoading
  })),
  
  historyLimit: 20,
  setHistoryLimit: (limit) => set((state) => ({
    historyLimit: typeof limit === 'function' ? limit(state.historyLimit) : limit
  })),
  
  isHistoryFullscreen: false,
  setIsHistoryFullscreen: (isFullscreen) => set((state) => ({
    isHistoryFullscreen: typeof isFullscreen === 'function' ? isFullscreen(state.isHistoryFullscreen) : isFullscreen
  })),
  
  activeHistoryId: null,
  setActiveHistoryId: (id) => set((state) => ({
    activeHistoryId: typeof id === 'function' ? id(state.activeHistoryId) : id
  })),
  
  histSearch: '',
  setHistSearch: (search) => set((state) => ({
    histSearch: typeof search === 'function' ? search(state.histSearch) : search
  })),
  
  debouncedHistSearch: '',
  setDebouncedHistSearch: (search) => set((state) => ({
    debouncedHistSearch: typeof search === 'function' ? search(state.debouncedHistSearch) : search
  })),
  
  histDateFilter: '',
  setHistDateFilter: (filter) => set((state) => ({
    histDateFilter: typeof filter === 'function' ? filter(state.histDateFilter) : filter
  })),
  
  histSentimentFilter: 'All',
  setHistSentimentFilter: (filter) => set((state) => ({
    histSentimentFilter: typeof filter === 'function' ? filter(state.histSentimentFilter) : filter
  })),
  
  showFavoritesOnly: false,
  setShowFavoritesOnly: (show) => set((state) => ({
    showFavoritesOnly: typeof show === 'function' ? show(state.showFavoritesOnly) : show
  }))
}));
