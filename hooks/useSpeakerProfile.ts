import { useState } from 'react';
import { getActiveProvider, incrementTotalCalls } from '../services/ApiKeyManager';
import { GoogleGenAI } from '@google/genai';
import { SpeakerProfile, SpeakerCustomNote } from '../types/speaker';
import { scanDatabaseForSpeaker, getCustomNote, saveCustomNote } from '../services/speakerArchiveService';

const CACHE_KEY = 'speaker_profiles_cache_v3_bn_archive';

const getCachedProfile = (name: string): SpeakerProfile | null => {
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

const setCachedProfile = (name: string, profile: SpeakerProfile) => {
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

// Dual-Language Wikipedia summary fetcher
const fetchWikiSummary = async (title: string, lang: 'bn' | 'en'): Promise<string | null> => {
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

export const useSpeakerProfile = (transcriptContext: string) => {
  const [isOpen, setIsOpen] = useState(false);
  const [speakerName, setSpeakerName] = useState('');
  const [profile, setProfile] = useState<SpeakerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const updateCustomNote = (newNote: SpeakerCustomNote) => {
    saveCustomNote(newNote);
    setProfile(prev => prev ? { ...prev, customNote: newNote } : null);
    if (speakerName) {
      const cached = getCachedProfile(speakerName);
      if (cached) {
        cached.customNote = newNote;
        setCachedProfile(speakerName, cached);
      }
    }
  };

  const openProfile = async (name: string, ignoreCache: boolean = false) => {
    setSpeakerName(name);
    setIsOpen(true);
    setError('');

    // Load custom team notes immediately
    const existingCustomNote = getCustomNote(name);

    // 1. Scan local/cloud database archives for this speaker
    const dbStatsPromise = scanDatabaseForSpeaker(name, transcriptContext);

    // Check cache first
    if (!ignoreCache) {
      const cached = getCachedProfile(name);
      if (cached) {
        // Refresh dbStats and note in case new files arrived
        const currentStats = await dbStatsPromise;
        const refreshed = { ...cached, databaseStats: currentStats, customNote: existingCustomNote || cached.customNote };
        setProfile(refreshed);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setProfile(null);

    try {
      const provider = await getActiveProvider();
      const apiKey = provider?.key;
      if (!apiKey) throw new Error("এপিআই কি (API Key) কনফিগার করা নেই। Settings থেকে ঠিক করুন।");

      const ai = new GoogleGenAI({ apiKey });
      const safeContext = transcriptContext.substring(0, 2000).replace(/"/g, "'");
      const prompt = `You are an expert Bangladeshi investigative researcher and biographer. Provide a structured, highly detailed profile in BENGALI language for the public figure: "${name}".
Use the following transcript context to understand their relevance if needed:
"${safeContext}"

CRITICAL LANGUAGE REQUIREMENT:
- All descriptive fields ("name", "description", "career", "bgbViews") MUST be written strictly and fluently in BENGALI (বাংলা).
- Do NOT output in English for description, career, or bgbViews.

Respond ONLY with a valid JSON object matching exactly this structure:
{
  "name": "পূর্ণ নাম (বাংলায়)",
  "imageUrl": "Direct public image URL if highly confident, otherwise empty",
  "wikipediaLang": "The language code of their Wikipedia page (e.g. 'bn' or 'en'), or empty if none",
  "wikipediaTitle": "The exact title of their Wikipedia article (in the corresponding language), or empty if none",
  "description": "২-৩ বাক্যের সংক্ষিপ্ত পরিচিতি ও জীবনী (অবশ্যই বাংলায়)",
  "career": "কর্মজীবন, পেশাগত পরিচিতি ও উল্লেখযোগ্য কার্যক্রমের বিস্তারিত বিবরণ (অবশ্যই বাংলায়)",
  "bgbViews": "বিজিবি (বর্ডার গার্ড বাংলাদেশ) বা সীমান্ত ইস্যু সম্পর্কে তাদের বক্তব্য, অবস্থান বা ইতিহাস (অবশ্যই বাংলায়)। তথ্য না থাকলে লিখুন: 'বিজিবি বা সীমান্ত বিষয়ে সুনির্দিষ্ট কোনো বক্তব্য বা তথ্য পাওয়া যায়নি।'",
  "sourceUrl": "URL to their Wikipedia page or official profile, otherwise empty",
  "socialLinks": {
    "facebook": "url or empty",
    "twitter": "url or empty",
    "linkedin": "url or empty"
  }
}
Do not include markdown blocks like \`\`\`json, just return the raw JSON object.`;

      let modelToUse = provider?.model || 'gemini-3-flash-preview';
      if (modelToUse === 'gemini-2.5-flash') {
        modelToUse = 'gemini-3-flash-preview';
      }

      let response: any;
      try {
        // First try with Google Search grounding tool
        response = await ai.models.generateContent({
          model: modelToUse,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
      } catch (searchErr: any) {
        console.warn("Google Search grounding not available or permission denied, falling back to standard AI generation:", searchErr);
        try {
          // Second try: standard model generation without tools
          response = await ai.models.generateContent({
            model: modelToUse,
            contents: prompt
          });
        } catch (genErr: any) {
          console.warn("Primary model generation failed, trying fallback model gemini-3.1-flash-lite-preview:", genErr);
          // Third try: fast fallback model
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: prompt
          });
          modelToUse = 'gemini-3.1-flash-lite-preview';
        }
      }

      await incrementTotalCalls('Speaker Profile', modelToUse, provider.source);

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedProfile: SpeakerProfile = JSON.parse(jsonMatch[0]);

        let fetchedImageUrl = parsedProfile.imageUrl || '';

        const fetchWikiImageByTitle = async (title: string, lang: string) => {
          try {
            const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&format=json&origin=*`);
            const data = await res.json();
            const pages = data?.query?.pages;
            if (pages) {
              const pageId = Object.keys(pages)[0];
              if (pageId !== '-1') {
                if (pages[pageId].thumbnail?.source) return pages[pageId].thumbnail.source;
                if (pages[pageId].original?.source) return pages[pageId].original.source;
              }
            }
          } catch (e) { console.error("Wiki fetch error", e); }
          return null;
        };

        const searchWikiImage = async (query: string, lang: string) => {
          try {
            const searchRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
            const searchData = await searchRes.json();
            if (searchData?.query?.search?.length > 0) {
              return await fetchWikiImageByTitle(searchData.query.search[0].title, lang);
            }
          } catch (e) { console.error("Wiki search error", e); }
          return null;
        };

        const searchCommonsImage = async (query: string) => {
          try {
            const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json&origin=*`);
            const data = await res.json();
            const pages = data?.query?.pages;
            if (pages) {
              const pageId = Object.keys(pages)[0];
              if (pageId !== '-1' && pages[pageId].imageinfo?.[0]?.url) {
                return pages[pageId].imageinfo[0].url;
              }
            }
          } catch (e) { console.error("Commons search error", e); }
          return null;
        };

        // Try to find an image if we don't have one
        if (!fetchedImageUrl || fetchedImageUrl.trim() === '') {
          if (parsedProfile.wikipediaTitle && parsedProfile.wikipediaLang) {
            fetchedImageUrl = await fetchWikiImageByTitle(parsedProfile.wikipediaTitle, parsedProfile.wikipediaLang) || '';
          }
          if (!fetchedImageUrl) {
            fetchedImageUrl = await searchWikiImage(name, 'en') || '';
          }
          if (!fetchedImageUrl) {
            fetchedImageUrl = await searchWikiImage(name, 'bn') || '';
          }
          if (!fetchedImageUrl) {
            fetchedImageUrl = await searchCommonsImage(name) || '';
          }
        }

        parsedProfile.imageUrl = fetchedImageUrl;

        // Dual language Wikipedia Deep Fetch
        let wikiBnSummary = null;
        let wikiEnSummary = null;
        if (parsedProfile.wikipediaTitle) {
          if (parsedProfile.wikipediaLang === 'bn') {
            wikiBnSummary = await fetchWikiSummary(parsedProfile.wikipediaTitle, 'bn');
          } else {
            wikiEnSummary = await fetchWikiSummary(parsedProfile.wikipediaTitle, 'en');
          }
        }
        if (!wikiBnSummary) wikiBnSummary = await fetchWikiSummary(name, 'bn');
        if (!wikiEnSummary) wikiEnSummary = await fetchWikiSummary(name, 'en');

        parsedProfile.wikiSummaryBn = wikiBnSummary || undefined;
        parsedProfile.wikiSummaryEn = wikiEnSummary || undefined;

        // Wait for database scan
        const dbStats = await dbStatsPromise;
        parsedProfile.databaseStats = dbStats;
        parsedProfile.customNote = existingCustomNote || undefined;

        setProfile(parsedProfile);
        setCachedProfile(name, parsedProfile);
      } else {
        throw new Error("Failed to parse profile data from AI");
      }
    } catch (err: any) {
      let rawMsg = err?.message || '';
      let displayError = 'স্পীকারের প্রোফাইল লোড করা সম্ভব হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
      
      if (rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('403')) {
        displayError = 'API Key-তে অনুসন্ধান চালানোর অনুমতি নেই। অনুগ্রহ করে Settings থেকে একটি সক্রিয় API Key প্রদান করুন।';
      } else if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429')) {
        displayError = 'API কোটা সাময়িকভাবে শেষ হয়ে গেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
      } else if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('400')) {
        displayError = 'প্রদত্ত API Key টি সঠিক নয়। Settings থেকে সঠিক কি কনফিগার করুন।';
      } else if (rawMsg) {
        displayError = rawMsg;
      }

      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  const closeProfile = () => setIsOpen(false);
  const refreshProfile = () => openProfile(speakerName, true);

  return {
    isOpen,
    speakerName,
    profile,
    isLoading,
    error,
    openProfile,
    closeProfile,
    refreshProfile,
    updateCustomNote
  };
};
