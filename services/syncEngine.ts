import { db, auth, authPromise, isFirebaseConfigured } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { getApiUrl } from '../utils/config';
import { supabase } from './supabase';
import { isSupabaseConfigured } from './supabase';
import { addToQueue } from './syncQueue';
import { get, set } from 'idb-keyval';
import { FIREBASE_SYNCED_STORES } from '../constants/storeNames';

// --- Helper async functions (replaces `new Promise(async ...)` anti-pattern) ---

const fetchFromIdb = async (storeName: string): Promise<any[]> => {
  try {
    const keys = await import('idb-keyval').then(m => m.keys());
    const storeKeys = keys.filter(k => typeof k === 'string' && k.startsWith(`${storeName}_`));
    const dataPromises = storeKeys.map(k => get(k as string));
    const data = await Promise.all(dataPromises);
    return data.filter(Boolean);
  } catch (e) {
    return [];
  }
};

const fetchFromLocalApi = async (storeName: string): Promise<any[]> => {
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
    return allLocalData;
  } catch (e) {
    return allLocalData;
  }
};

const fetchFromFirebase = async (storeName: string): Promise<any[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    await authPromise;
    const querySnapshot = await getDocs(collection(db, storeName));
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

const fetchFromSupabase = async (storeName: string): Promise<any[]> => {
  if (!isSupabaseConfigured) return [];
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
    return allSupabaseData.map((row: any) => row.data || row);
  } catch (e) {
    return [];
  }
};

// TRIPLE-SYNC READ
export const fetchDataDual = async (storeName: string) => {
  const promises: Promise<any[]>[] = [
    fetchFromIdb(storeName),
    fetchFromLocalApi(storeName),
  ];

  if (FIREBASE_SYNCED_STORES.includes(storeName)) {
    promises.push(fetchFromFirebase(storeName));
    promises.push(fetchFromSupabase(storeName));
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
    // 3. Firebase Write (with null guard)
    if (isFirebaseConfigured && db) {
      promises.push(
        authPromise.then(() => setDoc(doc(db!, storeName, id), payload))
          .catch(e => {
              console.warn("Firebase save failed, queuing...", e.message);
              addToQueue('firebase', 'save', storeName, id, payload);
          })
      );
    }

    // 4. Supabase Write (with config guard)
    if (isSupabaseConfigured) {
      promises.push(
        Promise.resolve(supabase.from(storeName).upsert({ id: id, data: payload })).then(({ error }: any) => {
            if (error) throw error;
        }).catch((e: any) => {
            console.warn("Supabase save failed, queuing...", e.message);
            addToQueue('supabase', 'save', storeName, id, payload);
        })
      );
    }
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
    // Firebase delete (with null guard)
    if (isFirebaseConfigured && db) {
      promises.push(
        authPromise.then(() => deleteDoc(doc(db!, storeName, id)))
          .catch(e => addToQueue('firebase', 'delete', storeName, id))
      );
    }

    // Supabase delete (with config guard)
    if (isSupabaseConfigured) {
      promises.push(
        Promise.resolve(supabase.from(storeName).delete().eq('id', id)).then(({ error }: any) => {
            if (error) throw error;
        }).catch((e: any) => addToQueue('supabase', 'delete', storeName, id))
      );
    }
  }

  await Promise.allSettled(promises);
  return true;
};
