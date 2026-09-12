import { addToStore, getAllFromStore, deleteFromStore } from './db.ts';
import { STORES } from '../constants/storeNames.ts';

export interface SearchAnalysisItem {
  id: string;
  searchTerm: string;
  fileName: string;
  duration: string;
  speakerCount: number;
  matchCount: number;
  matchTimestamps: string[];
  matchSentences: string[];
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'pending';
  remarkExplanation?: string;
}

export const saveSearchAnalysis = async (item: SearchAnalysisItem): Promise<SearchAnalysisItem[]> => {
  await addToStore(STORES.SEARCH_ANALYSIS, item);
  return (await getAllFromStore(STORES.SEARCH_ANALYSIS)) as SearchAnalysisItem[];
};

export const getSearchAnalysisHistory = async (): Promise<SearchAnalysisItem[]> => {
  return (await getAllFromStore(STORES.SEARCH_ANALYSIS)) as SearchAnalysisItem[];
};

export const deleteSearchAnalysisAction = async (id: string): Promise<SearchAnalysisItem[]> => {
  await deleteFromStore(STORES.SEARCH_ANALYSIS, id);
  return (await getAllFromStore(STORES.SEARCH_ANALYSIS)) as SearchAnalysisItem[];
};
