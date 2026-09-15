
import { fetchDataDual, saveDataDual, deleteDataDual } from './api.ts';

export const DB_NAME = 'LiCellStudioDB_v5_Final'; 
export const DB_VERSION = 3;

import { STORES, FIREBASE_SYNCED_STORES, ALL_STORES } from '../constants/storeNames';
export { STORES, FIREBASE_SYNCED_STORES, ALL_STORES };

let dbPromise: Promise<IDBDatabase> | null = null;

export const initDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
        console.error("DB Open Error:", request.error);
        window.dispatchEvent(new CustomEvent('app-error', { detail: { message: 'ডাটাবেস ওপেন করতে সমস্যা হয়েছে: ' + request.error?.message } }));
        dbPromise = null;
        reject(request.error);
    };

    request.onsuccess = () => {
        resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      ALL_STORES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };
  });
  
  return dbPromise;
};

export const addToStore = async (storeName: string, data: any) => {
  const db = await initDB();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });

  if (storeName !== STORES.YOUTUBE_AUDIO) {
    saveDataDual(storeName, data).catch(err => {
      // Hide 'Failed to fetch' errors as they are expected in preview mode (CORS/Mixed Content)
      if (import.meta.env.PROD || !err.message?.includes('Failed to fetch')) {
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
           const tx = db2.transaction([storeName], 'readwrite');
           tx.objectStore(storeName).put(item);
        }
     }).catch(err => {
       // Hide 'Failed to fetch' errors from UI as they are expected in preview mode (CORS/Mixed Content)
       if (import.meta.env.PROD || !err.message?.includes('Failed to fetch')) {
         console.error(`Background fetch failed for ${storeName}:`, err);
         window.dispatchEvent(new CustomEvent('app-error', { detail: { message: `ডাটা ফেচ করতে সমস্যা হয়েছে (${storeName}): ` + err.message } }));
       } else {
         console.warn(`Background fetch failed (expected in preview): ${err.message}`);
       }
     });
  }

  return localItem;
};

const SYNC_COOLDOWN = 1000 * 60 * 5; // 5 minutes

export const getAllFromStore = async (storeName: string, forceSync = false) => {
  const db = await initDB();
  const localData = await new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (storeName !== STORES.YOUTUBE_AUDIO) {
    const lastSync = parseInt(localStorage.getItem(`sync_${storeName}`) || '0', 10);
    const now = Date.now();
    if (forceSync || now - lastSync > SYNC_COOLDOWN) {
      localStorage.setItem(`sync_${storeName}`, now.toString());
      fetchDataDual(storeName).then(async (cloudData) => {
        if (cloudData && Array.isArray(cloudData)) {
          const db2 = await initDB();
          const tx = db2.transaction([storeName], 'readwrite');
          const store = tx.objectStore(storeName);
          cloudData.forEach((item: any) => store.put(item));
          tx.oncomplete = () => {
            window.dispatchEvent(new CustomEvent(`store-updated-${storeName}`));
          };
        }
      }).catch(err => {
         localStorage.removeItem(`sync_${storeName}`);
         // Hide 'Failed to fetch' errors from UI as they are expected in preview mode (CORS/Mixed Content)
         if (import.meta.env.PROD || !err.message?.includes('Failed to fetch')) {
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
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });

  if (storeName !== STORES.YOUTUBE_AUDIO) {
    deleteDataDual(storeName, id).catch(err => {
      // Hide 'Failed to fetch' errors from UI as they are expected in preview mode (CORS/Mixed Content)
      if (import.meta.env.PROD || !err.message?.includes('Failed to fetch')) {
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
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
};
