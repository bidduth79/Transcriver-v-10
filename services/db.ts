
import { fetchDataDual, saveDataDual, deleteDataDual } from './api.ts';

export const DB_NAME = 'LiCellStudioDB_v5_Final'; 
export const DB_VERSION = 1;

export const STORES = {
  HISTORY: 'studio_history',
  REPORTS: 'studio_reports',
  SEARCH_ANALYSIS: 'studio_analysis',
  API_KEYS: 'user_api_keys',
  MASTER_KEYS: 'system_master_keys',
  SYSTEM_ACTIVITY_LOGS: 'activity_logs',
  API_CALL_LOGS: 'gemini_call_logs',
  STATS: 'global_stats',
  CHAT_HISTORY: 'assistant_chat_history',
  YOUTUBE_CHANNELS: 'youtube_channels',
  YOUTUBE_API_KEYS: 'youtube_api_keys',
  YOUTUBE_QUEUE: 'youtube_queue',
  YOUTUBE_LINKS: 'youtube_links',
  TRANSCRIPTS: 'youtube_transcripts',
  YOUTUBE_AUDIO: 'youtube_audio'
};

export const FIREBASE_SYNCED_STORES = [
  STORES.HISTORY,
  STORES.REPORTS,
  STORES.SEARCH_ANALYSIS,
  STORES.API_KEYS,
  STORES.MASTER_KEYS,
  STORES.STATS,
  STORES.API_CALL_LOGS,
  STORES.SYSTEM_ACTIVITY_LOGS,
  STORES.CHAT_HISTORY,
  STORES.YOUTUBE_CHANNELS,
  STORES.YOUTUBE_API_KEYS,
  STORES.YOUTUBE_QUEUE,
  STORES.YOUTUBE_LINKS,
  STORES.TRANSCRIPTS
];

const ALL_STORES = Object.values(STORES);

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
        console.error("DB Open Error:", request.error);
        window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'ডাটাবেস ওপেন করতে সমস্যা হয়েছে: ' + request.error?.message } }));
        reject(request.error);
    };

    request.onsuccess = () => {
        resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      // @ts-ignore
      const db = event.target.result;
      
      ALL_STORES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };
  });
};

export const addToStore = async (storeName: string, data: any) => {
  const db = await initDB();
  await new Promise((resolve, reject) => {
    // @ts-ignore
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });

  if (storeName !== STORES.YOUTUBE_AUDIO) {
    saveDataDual(storeName, data).catch(err => {
      // Hide 'Failed to fetch' errors as they are expected in preview mode (CORS/Mixed Content)
      if (!err.message?.includes('Failed to fetch')) {
        console.error(`Background save failed for ${storeName}:`, err);
        window.dispatchEvent(new CustomEvent('app-error', { detail: { message: `ডাটা সেভ করতে সমস্যা হয়েছে (${storeName}): ` + err.message } }));
      } else {
        console.warn(`Background save failed (expected in preview): ${err.message}`);
      }
    });
  }
  return true;
};

export const getFromStore = async (storeName: string, id: string) => {
  const db = await initDB();
  const localItem = await new Promise((resolve, reject) => {
    // @ts-ignore
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (storeName !== STORES.YOUTUBE_AUDIO) {
     fetchDataDual(storeName).then(async (all) => {
        const item = all.find((i: any) => i.id === id);
        if (item) {
           const db2 = await initDB();
           // @ts-ignore
           const tx = db2.transaction([storeName], 'readwrite');
           tx.objectStore(storeName).put(item);
        }
     }).catch(err => {
       // Hide 'Failed to fetch' errors from UI as they are expected in preview mode (CORS/Mixed Content)
       if (!err.message?.includes('Failed to fetch')) {
         console.error(`Background fetch failed for ${storeName}:`, err);
         window.dispatchEvent(new CustomEvent('app-error', { detail: { message: `ডাটা ফেচ করতে সমস্যা হয়েছে (${storeName}): ` + err.message } }));
       } else {
         console.warn(`Background fetch failed (expected in preview): ${err.message}`);
       }
     });
  }

  return localItem;
};

const syncStatus = new Map<string, number>();
const SYNC_COOLDOWN = 1000 * 60 * 5; // 5 minutes

export const getAllFromStore = async (storeName: string, forceSync = false) => {
  const db = await initDB();
  const localData = await new Promise((resolve, reject) => {
    // @ts-ignore
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (storeName !== STORES.YOUTUBE_AUDIO) {
    const lastSync = syncStatus.get(storeName) || 0;
    const now = Date.now();
    if (forceSync || now - lastSync > SYNC_COOLDOWN) {
      syncStatus.set(storeName, now);
      fetchDataDual(storeName).then(async (cloudData) => {
        if (cloudData && Array.isArray(cloudData)) {
          const db2 = await initDB();
          // @ts-ignore
          const tx = db2.transaction([storeName], 'readwrite');
          const store = tx.objectStore(storeName);
          cloudData.forEach((item: any) => store.put(item));
          tx.oncomplete = () => {
            window.dispatchEvent(new CustomEvent(`store-updated-${storeName}`));
          };
        }
      }).catch(err => {
         syncStatus.set(storeName, 0);
         // Hide 'Failed to fetch' errors from UI as they are expected in preview mode (CORS/Mixed Content)
         if (!err.message?.includes('Failed to fetch')) {
           console.error(`Background sync failed for ${storeName}:`, err);
           window.dispatchEvent(new CustomEvent('app-error', { detail: { message: `ডাটা সিঙ্ক করতে সমস্যা হয়েছে (${storeName}): ` + err.message } }));
         } else {
           console.warn(`Background sync failed (expected in preview): ${err.message}`);
         }
      });
    }
  }

  return localData;
};

export const deleteFromStore = async (storeName: string, id: string) => {
  const db = await initDB();
  await new Promise((resolve, reject) => {
    // @ts-ignore
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });

  if (storeName !== STORES.YOUTUBE_AUDIO) {
    deleteDataDual(storeName, id).catch(err => {
      // Hide 'Failed to fetch' errors from UI as they are expected in preview mode (CORS/Mixed Content)
      if (!err.message?.includes('Failed to fetch')) {
        console.error(`Background delete failed for ${storeName}:`, err);
        window.dispatchEvent(new CustomEvent('app-error', { detail: { message: `ডাটা মুছতে সমস্যা হয়েছে (${storeName}): ` + err.message } }));
      } else {
        console.warn(`Background delete failed (expected in preview): ${err.message}`);
      }
    });
  }
  return true;
};

export const clearStore = async (storeName: string) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        // @ts-ignore
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
};
