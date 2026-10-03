
import { fetchDataDual, saveDataDual, deleteDataDual } from './api.ts';
import { useAppStore } from '../hooks/useAppStore';
import { AUTO_SYNC_XAMPP_ENABLED, AUTO_SYNC_SUPABASE_ENABLED, AUTO_SYNC_FIREBASE_ENABLED } from './syncEngine';

export const DB_NAME = 'LiCellStudioDB_v5_Final'; 
export const DB_VERSION = 3;

import { STORES, FIREBASE_SYNCED_STORES, ALL_STORES } from '../constants/storeNames';
export { STORES, FIREBASE_SYNCED_STORES, ALL_STORES };

const SYNC_COOLDOWN = 1000 * 60 * 5; // 5 minutes

let dbPromise: Promise<IDBDatabase> | null = null;

export const initDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
        console.error("DB Open Error:", request.error);
        useAppStore.getState().setAppError('ডাটাবেস ওপেন করতে সমস্যা হয়েছে: ' + request.error?.message);
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

  const isAutoSyncActive = AUTO_SYNC_XAMPP_ENABLED || AUTO_SYNC_SUPABASE_ENABLED || AUTO_SYNC_FIREBASE_ENABLED;
  if (storeName !== STORES.YOUTUBE_AUDIO && isAutoSyncActive) {
    saveDataDual(storeName, data).catch(err => {
      console.warn(`Background save failed for ${storeName}:`, err);
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

  return localItem;
};

export const getAllFromStore = async (storeName: string, forceSync = false) => {
  const db = await initDB();
  const localData = await new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const isAutoSyncActive = AUTO_SYNC_XAMPP_ENABLED || AUTO_SYNC_SUPABASE_ENABLED || AUTO_SYNC_FIREBASE_ENABLED;

  // Only run background cloud sync if explicitly forced (manual sync) and auto-sync is active
  if (forceSync && storeName !== STORES.YOUTUBE_AUDIO && isAutoSyncActive) {
    const lastSync = parseInt(localStorage.getItem(`sync_${storeName}`) || '0', 10);
    const now = Date.now();
    if (now - lastSync > SYNC_COOLDOWN) {
      localStorage.setItem(`sync_${storeName}`, now.toString());
      fetchDataDual(storeName, true).then(async (cloudData) => {
        if (cloudData && Array.isArray(cloudData)) {
          const db2 = await initDB();
          const tx = db2.transaction([storeName], 'readwrite');
          const store = tx.objectStore(storeName);
          cloudData.forEach((item: any) => store.put(item));
          tx.oncomplete = () => {
            useAppStore.getState().triggerStoreUpdate(storeName);
          };
        }
      }).catch(err => {
         localStorage.removeItem(`sync_${storeName}`);
         console.warn(`Background sync failed for ${storeName}:`, err);
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

  const isAutoSyncActive = AUTO_SYNC_XAMPP_ENABLED || AUTO_SYNC_SUPABASE_ENABLED || AUTO_SYNC_FIREBASE_ENABLED;
  if (storeName !== STORES.YOUTUBE_AUDIO && isAutoSyncActive) {
    deleteDataDual(storeName, id).catch(err => {
      console.warn(`Background delete failed for ${storeName}:`, err);
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
