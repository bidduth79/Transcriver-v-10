export { getApiUrl, getApiBaseUrl, setApiBaseUrl, DEFAULT_API_URL } from "../utils/config";
import { getApiUrl } from '../utils/config';
import { addToQueue } from './syncQueue';
import { fetchDataDual, saveDataDual, deleteDataDual } from './syncEngine';
export { fetchDataDual, saveDataDual, deleteDataDual };
import { authPromise, auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_SYNCED_STORES } from '../constants/storeNames';

export const checkCloudConnection = async (): Promise<{ status: 'online' | 'offline' | 'auth-error', message: string }> => {
  try {
      await authPromise;
      if (!auth.currentUser) return { status: 'auth-error', message: 'Not logged in' };
      return { status: 'online', message: 'Connected' };
  } catch(e) {
      return { status: 'offline', message: 'Connection failed' };
  }
};



export const fetchConfigDual = async (docName: string) => {
    try {
        const url = getApiUrl(`${docName}.php`);
        const res = await fetch(url);
        if (res.ok) {
            return await res.json();
        }
    } catch (e) { 
        console.error("Failed to fetch config locally:", e);
    }
    
    try {
        await authPromise;
        const docRef = doc(db, "config", docName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
    } catch (e: any) {
        if (e.code !== 'permission-denied') {
            console.warn("Config fetch failed", e);
        }
    }
    return null;
};

export const performMasterSync = async (onProgress: (msg: string, p: number) => void) => {
    try {
        const stores = FIREBASE_SYNCED_STORES;
        const totalStores = stores.length;

        for (let i = 0; i < totalStores; i++) {
            const store = stores[i];
            const displayStoreName = store.replace('studio_', '').toUpperCase();

            onProgress(`Syncing ${displayStoreName}...`, Math.round((i / totalStores) * 100));

            // Fetch from all sources (Local, IDB, Firebase, Supabase) and deduplicate
            const allData = await fetchDataDual(store);

            if (allData.length === 0) continue;

            // Push deduplicated data back to all sources
            const batchSize = 10;
            for (let j = 0; j < allData.length; j += batchSize) {
                const batch = allData.slice(j, j + batchSize);
                await Promise.all(batch.map((item: any) => saveDataDual(store, item)));
            }
        }

        onProgress("Sync Complete", 100);
        return true;
    } catch (e: any) {
        console.error("Master Sync Failed:", e);
        throw e;
    }
};

// Aliases for compatibility
export const syncAllLocalToCloud = performMasterSync;
export const restoreAllCloudToLocal = performMasterSync;
export const restoreCloudData = performMasterSync;
