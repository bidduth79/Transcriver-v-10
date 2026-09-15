import { db, auth, authPromise } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { getApiUrl } from '../utils/config';
import { supabase } from './supabase';
import { addToQueue } from './syncQueue';
import { get, set } from 'idb-keyval';
import { FIREBASE_SYNCED_STORES } from '../constants/storeNames';

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

  // 2. XAMPP Local API Fetch (Paginated to prevent OOM)
  const localFetch = new Promise(async (resolve) => {
    let allLocalData: any[] = [];
    try {
      let page = 1;
      const limit = 200; // Safe chunk size
      
      while (true) {
        const url = getApiUrl(`api.php?action=get&store=${storeName}&page=${page}&limit=${limit}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); 
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const text = await response.text();
          try {
              const data = JSON.parse(text);
              if (Array.isArray(data)) {
                  const items = data.map((row: any) => row.data || row);
                  allLocalData = allLocalData.concat(items);
                  if (items.length < limit) break; // Reached the end
              } else {
                  break; // Invalid format
              }
          } catch (jsonErr) {
              console.warn(`[Local Fetch] Invalid JSON for ${storeName} on page ${page}`);
              break;
          }
        } else {
          break; // HTTP error
        }
        page++;
      }
      resolve(allLocalData);
    } catch (e) {
      resolve(typeof allLocalData !== 'undefined' ? allLocalData : []);
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
        let allSupabaseData: any[] = [];
        let from = 0;
        const limit = 50; 
        
        while (true) {
          const { data, error } = await supabase.from(storeName).select('*').range(from, from + limit - 1);
          
          if (error) {
             console.error(`[Supabase Fetch] Error for ${storeName}:`, error);
             break;
          }
          
          if (data && data.length > 0) {
             allSupabaseData = allSupabaseData.concat(data);
             if (data.length < limit) break;
             from += limit;
          } else {
             break;
          }
        }
        resolve(allSupabaseData.map((row: any) => row.data || row));
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
      set(`${storeName}_${idStr}`, { ...item, id: idStr }).catch(()=>null);
    }
  });
  
  return Array.from(uniqueDataMap.values());
};

// TRIPLE-SYNC WRITE
export const saveDataDual = async (storeName: string, data: any) => {
  const id = String(data.id || Date.now());
  const payload = JSON.parse(JSON.stringify({ ...data, id }));
  
  try {
     await set(`${storeName}_${id}`, payload);
  } catch(e) {
     console.error("Failed to save to Primary Cache (IndexedDB):", e);
  }

  const isSyncedStore = FIREBASE_SYNCED_STORES.includes(storeName);
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
  return true;
};

// TRIPLE-SYNC DELETE
export const deleteDataDual = async (storeName: string, id: string) => {
  try {
     const del = await import('idb-keyval').then(m => m.del);
     await del(`${storeName}_${id}`);
  } catch (e) {
    console.error("Failed to delete from Primary Cache:", e);
  }

  const isSyncedStore = FIREBASE_SYNCED_STORES.includes(storeName);
  const promises = [];

  promises.push(
    fetch(getApiUrl(`api.php?action=delete&store=${storeName}&id=${id}`))
      .then(res => { if (!res.ok) throw new Error("Local HTTP Failed"); })
      .catch((e) => addToQueue('local', 'delete', storeName, id))
  );

  if (isSyncedStore) {
    promises.push(
      authPromise.then(() => deleteDoc(doc(db, storeName, id)))
        .catch(e => addToQueue('firebase', 'delete', storeName, id))
    );

    promises.push(
      Promise.resolve(supabase.from(storeName).delete().eq('id', id)).then(({ error }) => {
          if (error) throw error;
      }).catch(e => addToQueue('supabase', 'delete', storeName, id))
    );
  }

  await Promise.allSettled(promises);
  return true;
};
