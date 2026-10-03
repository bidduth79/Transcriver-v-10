import { get, set } from 'idb-keyval';
import { db, authPromise } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { supabase } from './supabase';
import { getApiUrl, isLocalServerEnabled } from '../utils/config';
import { AUTO_SYNC_SUPABASE_ENABLED, AUTO_SYNC_FIREBASE_ENABLED } from './syncEngine';

// Structure: { target: 'supabase'|'firebase'|'local', action: 'save'|'delete', storeName, id, payload? }
const QUEUE_KEY = 'sync_queue';

export const addToQueue = async (target: string, action: string, storeName: string, id: string, payload?: any) => {
    if (target === 'local' && !isLocalServerEnabled()) return;
    if (target === 'supabase' && !AUTO_SYNC_SUPABASE_ENABLED) return;
    if (target === 'firebase' && !AUTO_SYNC_FIREBASE_ENABLED) return;

    try {
        const queue: any[] = (await get(QUEUE_KEY)) || [];
        // Keep queue capped at 50 to avoid massive RAM growth
        if (queue.length > 50) queue.shift();
        queue.push({ target, action, storeName, id, payload, timestamp: Date.now() });
        await set(QUEUE_KEY, queue);
    } catch (e) {
        console.error("Failed to add to sync queue:", e);
    }
};

export const processQueue = async () => {
    if (!navigator.onLine) return;
    const isAnyActive = isLocalServerEnabled() || AUTO_SYNC_SUPABASE_ENABLED || AUTO_SYNC_FIREBASE_ENABLED;
    if (!isAnyActive) {
        // Clear stale queue if all sync targets are disabled
        try { await set(QUEUE_KEY, []); } catch (e) {}
        return;
    }

    try {
        const queue: any[] = (await get(QUEUE_KEY)) || [];
        if (queue.length === 0) return;

        const remainingQueue: any[] = [];

        for (const task of queue) {
            // Discard tasks for disabled sync targets immediately
            if (task.target === 'local' && !isLocalServerEnabled()) continue;
            if (task.target === 'supabase' && !AUTO_SYNC_SUPABASE_ENABLED) continue;
            if (task.target === 'firebase' && !AUTO_SYNC_FIREBASE_ENABLED) continue;

            // Discard tasks older than 1 hour or failed more than 2 times
            if (task.retryCount && task.retryCount >= 2) continue;
            if (task.timestamp && Date.now() - task.timestamp > 3600000) continue;

            let success = false;
            try {
                if (task.target === 'firebase') {
                    await authPromise;
                    if (!db) throw new Error("Firebase DB not initialized");
                    if (task.action === 'save') {
                        await setDoc(doc(db, task.storeName, task.id), task.payload);
                    } else if (task.action === 'delete') {
                        await deleteDoc(doc(db, task.storeName, task.id));
                    }
                    success = true;
                } else if (task.target === 'supabase' && AUTO_SYNC_SUPABASE_ENABLED) {
                    if (task.action === 'save') {
                        const { error } = await supabase.from(task.storeName).upsert({ id: task.id, data: task.payload });
                        if (!error) success = true;
                    } else if (task.action === 'delete') {
                        const { error } = await supabase.from(task.storeName).delete().eq('id', task.id);
                        if (!error) success = true;
                    }
                } else if (task.target === 'local' && isLocalServerEnabled()) {
                    const url = task.action === 'save' 
                        ? getApiUrl(`api.php?action=save&store=${task.storeName}`)
                        : getApiUrl(`api.php?action=delete&store=${task.storeName}&id=${task.id}`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    const response = await fetch(url, {
                        method: task.action === 'save' ? 'POST' : 'GET',
                        headers: task.action === 'save' ? { 'Content-Type': 'application/json' } : undefined,
                        body: task.action === 'save' ? JSON.stringify(task.payload) : undefined,
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    if (response.ok) success = true;
                }
            } catch (e) {
                // Silently record failure, increment retry count
                task.retryCount = (task.retryCount || 0) + 1;
            }

            if (!success && (!task.retryCount || task.retryCount < 2)) {
                remainingQueue.push(task);
            }
        }

        await set(QUEUE_KEY, remainingQueue);
    } catch (e) {
        console.warn("Failed to process sync queue:", e);
    }
};

window.addEventListener('online', processQueue);

// Call once on load to flush any pre-existing queue
if (typeof window !== 'undefined') {
  setTimeout(() => {
    processQueue();
  }, 1000);
}
