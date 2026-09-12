import { get, set } from 'idb-keyval';
import { db, authPromise } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { supabase } from './supabase';
import { getApiUrl } from '../utils/config';

// Structure: { target: 'supabase'|'firebase'|'local', action: 'save'|'delete', storeName, id, payload? }
const QUEUE_KEY = 'sync_queue';

export const addToQueue = async (target: string, action: string, storeName: string, id: string, payload?: any) => {
    try {
        const queue: any[] = (await get(QUEUE_KEY)) || [];
        queue.push({ target, action, storeName, id, payload, timestamp: Date.now() });
        await set(QUEUE_KEY, queue);
    } catch (e) {
        console.error("Failed to add to sync queue:", e);
    }
};

export const processQueue = async () => {
    if (!navigator.onLine) return;

    try {
        const queue: any[] = (await get(QUEUE_KEY)) || [];
        if (queue.length === 0) return;

        const remainingQueue: any[] = [];

        for (const task of queue) {
            let success = false;
            try {
                if (task.target === 'firebase') {
                    await authPromise;
                    if (task.action === 'save') {
                        await setDoc(doc(db, task.storeName, task.id), task.payload);
                    } else if (task.action === 'delete') {
                        await deleteDoc(doc(db, task.storeName, task.id));
                    }
                    success = true;
                } else if (task.target === 'supabase') {
                    if (task.action === 'save') {
                        const { error } = await supabase.from(task.storeName).upsert({ id: task.id, data: task.payload });
                        if (!error) success = true;
                    } else if (task.action === 'delete') {
                        const { error } = await supabase.from(task.storeName).delete().eq('id', task.id);
                        if (!error) success = true;
                    }
                } else if (task.target === 'local') {
                    const url = task.action === 'save' 
                        ? getApiUrl(`api.php?action=save&store=${task.storeName}`)
                        : getApiUrl(`api.php?action=delete&store=${task.storeName}&id=${task.id}`);
                    
                    const response = await fetch(url, {
                        method: task.action === 'save' ? 'POST' : 'GET',
                        headers: task.action === 'save' ? { 'Content-Type': 'application/json' } : undefined,
                        body: task.action === 'save' ? JSON.stringify(task.payload) : undefined
                    });
                    if (response.ok) success = true;
                }
            } catch (e) {
                console.warn(`Background sync failed for ${task.target} - ${task.storeName}`, e);
            }

            if (!success) {
                remainingQueue.push(task);
            }
        }

        await set(QUEUE_KEY, remainingQueue);
    } catch (e) {
        console.error("Failed to process sync queue:", e);
    }
};

window.addEventListener('online', processQueue);

// Call once on load to flush any pre-existing queue
if (typeof window !== 'undefined') {
  setTimeout(() => {
    processQueue();
  }, 1000);
}
