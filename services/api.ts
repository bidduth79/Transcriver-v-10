export { getApiUrl, getApiBaseUrl, setApiBaseUrl, DEFAULT_API_URL } from "../utils/config";
import { db, auth, authPromise } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, writeBatch } from "firebase/firestore";
import { getApiUrl } from '../utils/config';
import { supabase } from './supabase';
import { addToQueue } from './syncQueue';
import { get, set } from 'idb-keyval';

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

// TRIPLE-SYNC READ
export const fetchDataDual = async (storeName: string) => {
  const promises = [];
  
  // 1. Local IndexedDB Fetch (Instant Cache)
  const idbFetch = new Promise(async (resolve) => {
     try {
       const keys = await import('idb-keyval').then(m => m.keys());
       const storeKeys = keys.filter(k => typeof k === 'string' && k.startsWith(`${storeName}_`));
       const dataPromises = storeKeys.map(k => get(k as string));
       const data = await Promise.all(dataPromises);
       resolve(data.filter(Boolean));
     } catch(e) {
       resolve([]);
     }
  });
  promises.push(idbFetch);

  // 2. XAMPP Local API Fetch
  const localFetch = new Promise(async (resolve) => {
    try {
      const url = getApiUrl(`api.php?action=get&store=${storeName}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); 
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                resolve(data.map((row: any) => row.data || row));
                return;
            }
        } catch (jsonErr) {
            console.warn(`[Local Fetch] Invalid JSON for ${storeName}`);
        }
      }
      resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
  promises.push(localFetch);

  if (FIREBASE_SYNCED_STORES.includes(storeName)) {
    // 3. Firebase Fetch
    const firebaseFetch = new Promise(async (resolve) => {
      try {
        await authPromise;
        const querySnapshot = await getDocs(collection(db, storeName));
        const cloudData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        resolve(cloudData);
      } catch (e) {
        resolve([]);
      }
    });
    promises.push(firebaseFetch);

    // 4. Supabase Fetch
    const supabaseFetch = new Promise(async (resolve) => {
      try {
        const { data, error } = await supabase.from(storeName).select('*');
        if (!error && data) {
           resolve(data.map((row: any) => row.data || row));
        } else {
           resolve([]);
        }
      } catch (e) {
        resolve([]);
      }
    });
    promises.push(supabaseFetch);
  }

  const results = await Promise.all(promises);
  const allData = results.flat();
  
  // Deduplicate by ID
  const uniqueDataMap = new Map();
  allData.forEach((item: any) => {
    if (item && item.id) {
      const idStr = String(item.id);
      uniqueDataMap.set(idStr, { ...item, id: idStr });
      
      // Update IndexedDB cache silently if missing
      set(`${storeName}_${idStr}`, { ...item, id: idStr }).catch(()=>null);
    }
  });
  
  return Array.from(uniqueDataMap.values());
};

// TRIPLE-SYNC WRITE
export const saveDataDual = async (storeName: string, data: any) => {
  const id = String(data.id || Date.now());
  const payload = JSON.parse(JSON.stringify({ ...data, id }));
  
  // 1. Save to Primary Cache (IndexedDB) for instant UX
  try {
     await set(`${storeName}_${id}`, payload);
  } catch(e) {
     console.error("Failed to save to Primary Cache (IndexedDB):", e);
  }

  const isSyncedStore = FIREBASE_SYNCED_STORES.includes(storeName);

  // We intentionally do not await the background tasks if we want a fast UI, 
  // but for consistency we can await Promise.allSettled and queue the failures.
  const promises = [];

  // 2. XAMPP Local Write
  promises.push(
    fetch(getApiUrl(`api.php?action=save&store=${storeName}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => {
        if (!res.ok) throw new Error("Local HTTP Failed");
    }).catch((e) => {
        addToQueue('local', 'save', storeName, id, payload);
    })
  );

  if (isSyncedStore) {
    // 3. Firebase Write
    promises.push(
      authPromise.then(() => setDoc(doc(db, storeName, id), payload))
        .catch(e => {
            console.warn("Firebase save failed, queuing...", e.message);
            addToQueue('firebase', 'save', storeName, id, payload);
        })
    );

    // 4. Supabase Write
    promises.push(
      Promise.resolve(supabase.from(storeName).upsert({ id: id, data: payload })).then(({ error }) => {
          if (error) throw error;
      }).catch(e => {
          console.warn("Supabase save failed, queuing...", e.message);
          addToQueue('supabase', 'save', storeName, id, payload);
      })
    );
  }

  await Promise.allSettled(promises);
  return true; // Always return true for fault-tolerance
};

// TRIPLE-SYNC DELETE
export const deleteDataDual = async (storeName: string, id: string) => {
  // 1. Delete from Primary Cache
  try {
     const del = await import('idb-keyval').then(m => m.del);
     await del(`${storeName}_${id}`);
  } catch (e) {
    console.error("Failed to delete from Primary Cache:", e);
  }

  const isSyncedStore = FIREBASE_SYNCED_STORES.includes(storeName);
  const promises = [];

  // 2. XAMPP Local Delete
  promises.push(
    fetch(getApiUrl(`api.php?action=delete&store=${storeName}&id=${id}`))
      .then(res => { if (!res.ok) throw new Error("Local HTTP Failed"); })
      .catch((e) => addToQueue('local', 'delete', storeName, id))
  );

  if (isSyncedStore) {
    // 3. Firebase Delete
    promises.push(
      authPromise.then(() => deleteDoc(doc(db, storeName, id)))
        .catch(e => addToQueue('firebase', 'delete', storeName, id))
    );

    // 4. Supabase Delete
    promises.push(
      Promise.resolve(supabase.from(storeName).delete().eq('id', id)).then(({ error }) => {
          if (error) throw error;
      }).catch(e => addToQueue('supabase', 'delete', storeName, id))
    );
  }

  await Promise.allSettled(promises);
  return true;
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
