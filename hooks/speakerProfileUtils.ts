import { SpeakerProfile } from '../types/speaker';

export const CACHE_KEY = 'speaker_profiles_cache_v3_bn_archive';

export const getCachedProfile = (name: string): SpeakerProfile | null => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const profile = cache[name.toLowerCase()];
    if (profile && profile.databaseStats === undefined) {
      return null;
    }
    return profile || null;
  } catch (e) {
    return null;
  }
};

export const setCachedProfile = (name: string, profile: SpeakerProfile) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const MAX_CACHE_ENTRIES = 50;
    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE_ENTRIES && !cache[name.toLowerCase()]) {
      delete cache[keys[0]]; // FIFO
    }
    cache[name.toLowerCase()] = profile;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to set cached speaker profile:", e);
  }
};

export const fetchWikiSummary = async (title: string, lang: 'bn' | 'en'): Promise<string | null> => {
  try {
    const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (res.ok) {
      const data = await res.json();
      return data.extract || null;
    }
  } catch (e) {
    console.error("Failed to fetch Wikipedia summary:", e);
  }
  return null;
};

export const fetchWikiImageByTitle = async (title: string, lang: string) => {
  try {
    const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&format=json&origin=*`);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      if (pageId !== '-1') {
        if (pages[pageId]?.thumbnail?.source) return pages[pageId].thumbnail.source;
        if (pages[pageId]?.original?.source) return pages[pageId].original.source;
      }
    }
  } catch (e) { console.error("Wiki fetch error", e); }
  return null;
};

export const searchWikiImage = async (query: string, lang: string) => {
  try {
    const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
    const data = await res.json();
    const results = data?.query?.search;
    if (results && results.length > 0) {
      return await fetchWikiImageByTitle(results[0].title, lang);
    }
  } catch (e) { console.error("Wiki search error", e); }
  return null;
};
