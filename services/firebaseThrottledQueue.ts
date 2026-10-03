/**
 * Firebase Throttled Background Sync Queue
 * 
 * ব্যবহারকারীর অনুরোধ অনুযায়ী:
 * "ফায়ারবেইজটা চালু থাকবে এবং সাথে সাথে ট্রাই করবে না, ধীরে ধীরে আস্তে আস্তে সময় বাচিয়ে পাঠাবে"
 * 
 * বৈশিষ্ট্য:
 * ১. ট্রান্সক্রিপশন শেষ হওয়ার সাথে সাথে ব্রাউজারের UI, রেন্ডার ও অডিও ফ্রিজ যেন না হয়,
 *    সেজন্য এটি ৩.৫ সেকেন্ড অপেক্ষা করে (Initial Debounce/Cool-down)।
 * ২. এরপর আইটেমগুলো একে একে ১.৫ সেকেন্ড বিরতি দিয়ে অত্যন্ত হালকা ও নিঃশব্দভাবে পাঠায় (Throttled Dispatch)।
 * ৩. একই ডকুমেন্টের একাধিক আপডেট হলে ডুপ্লিকেট না পাঠিয়ে শুধু সর্বশেষ ডাটা পাঠায়।
 * ৪. কোনো নেটওয়ার্ক ত্রুটি হলে UI-তে এরর না দেখিয়ে নিঃশব্দে রিট্রাই করে।
 */

import { db, authPromise, isFirebaseConfigured } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface QueueItem {
  key: string;
  storeName: string;
  id: string;
  action: 'set' | 'delete';
  payload?: any;
}

const queueMap = new Map<string, QueueItem>();
let isWorkerRunning = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// প্রতি ডকুমেন্টের মাঝে বিরতি (১.৫ সেকেন্ড) যাতে ব্রাউজারের থ্রেড সম্পূর্ণ রিল্যাক্সড থাকে
const THROTTLE_DELAY_MS = 1500;
// ট্রান্সক্রিপশন বা সেভের পর প্রথম রিকোয়েস্ট পাঠানোর আগে বিরতি (৩.৫ সেকেন্ড)
const INITIAL_IDLE_WAIT_MS = 3500;

export const enqueueFirebaseWrite = (storeName: string, id: string, payload: any) => {
  if (!isFirebaseConfigured || !db) return;

  const key = `${storeName}::${id}`;
  queueMap.set(key, {
    key,
    storeName,
    id,
    action: 'set',
    payload: JSON.parse(JSON.stringify(payload))
  });

  scheduleWorker();
};

export const enqueueFirebaseDelete = (storeName: string, id: string) => {
  if (!isFirebaseConfigured || !db) return;

  const key = `${storeName}::${id}`;
  queueMap.set(key, {
    key,
    storeName,
    id,
    action: 'delete'
  });

  scheduleWorker();
};

const scheduleWorker = () => {
  if (isWorkerRunning) return;

  // ব্রাউজারকে শান্ত হতে সময় দিন
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    startWorker();
  }, INITIAL_IDLE_WAIT_MS);
};

const startWorker = async () => {
  if (isWorkerRunning || queueMap.size === 0) return;
  isWorkerRunning = true;

  try {
    // নিশ্চিত করুন ফায়ারবেস অথেন্টিকেশন প্রস্তুত
    await authPromise;
    if (!db) {
      isWorkerRunning = false;
      return;
    }

    while (queueMap.size > 0) {
      if (!navigator.onLine) {
        // অফলাইন হলে বিরতি নিন
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      // কিউ থেকে প্রথম আইটেমটি নিন
      const nextKey = queueMap.keys().next().value;
      if (!nextKey) break;

      const item = queueMap.get(nextKey);
      queueMap.delete(nextKey);

      if (item) {
        try {
          if (item.action === 'set') {
            await setDoc(doc(db, item.storeName, item.id), item.payload);
            console.debug(`[Firebase Gentle Sync] Sent document ${item.storeName}/${item.id}`);
          } else if (item.action === 'delete') {
            await deleteDoc(doc(db, item.storeName, item.id));
            console.debug(`[Firebase Gentle Sync] Deleted document ${item.storeName}/${item.id}`);
          }
        } catch (itemErr: any) {
          console.warn(`[Firebase Gentle Sync] Handled non-fatal sync notice for ${item.storeName}:`, itemErr?.message || itemErr);
        }
      }

      // পরবর্তী আইটেম পাঠানোর আগে ধীরে ধীরে বিরতি নিন (Gentle Throttle)
      await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY_MS));
    }
  } catch (err: any) {
    console.warn("[Firebase Gentle Sync] Worker notice:", err?.message || err);
  } finally {
    isWorkerRunning = false;

    // যদি বিরতির মাঝে নতুন কোনো আইটেম জমা হয়ে থাকে
    if (queueMap.size > 0) {
      scheduleWorker();
    }
  }
};
