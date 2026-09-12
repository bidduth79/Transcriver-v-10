
import { GoogleGenAI } from "@google/genai";
import { getApiUrl } from './api.ts';
import { getAllFromStore, addToStore, deleteFromStore, STORES } from './db.ts';

const ACTIVE_KEY_ID_STORAGE = 'manual_active_key_id';
const ACTIVE_MODEL_STORAGE = 'manual_active_model';
const DEFAULT_MODEL = 'gemini-3.8-flash';

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', badge: 'Default' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', badge: 'Fastest' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview', badge: 'Accurate' },
  { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
  { id: 'gemini-pro', label: 'Gemini Pro Latest' },
  { id: 'gemini-flash', label: 'Gemini Flash Latest' },
  { id: 'gemini-flash-lite', label: 'Gemini Flash-Lite Latest' }
];

export const setActiveModel = (modelId: string) => {
  localStorage.setItem(ACTIVE_MODEL_STORAGE, modelId);
};

export const getActiveModel = () => {
  return localStorage.getItem(ACTIVE_MODEL_STORAGE) || DEFAULT_MODEL;
};

export interface UserApiKey {
  id: string;
  key: string;
  label: string;
  addedAt: string;
}

export interface ApiCallLog {
  id: string;
  timestamp: string;
  source: string;
  model: string;
  status: 'success' | 'error';
  latency?: number;
}

export const getActiveProvider = async () => {
  const activeId = localStorage.getItem(ACTIVE_KEY_ID_STORAGE);
  const currentModel = getActiveModel();

  if (activeId) {
    try {
      const allKeys = await getAllFromStore(STORES.API_KEYS);
      if (Array.isArray(allKeys)) {
          const selectedKey = allKeys.find((k: UserApiKey) => k.id === activeId);
          if (selectedKey) {
            return {
              key: selectedKey.key,
              model: currentModel, 
              source: selectedKey.label || 'Manual Selection'
            };
          }
      }
    } catch (e) {
      console.error("Error fetching active key:", e);
    }
  }

  // @ts-ignore
  const env = import.meta.env;
  const envKey = env ? env.VITE_API_KEY_1 : undefined;

  if (envKey && typeof envKey === 'string' && envKey.trim() !== '') {
    return {
      key: envKey.trim(),
      model: currentModel,
      source: 'Environment (.env)'
    };
  }

  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
     // @ts-ignore
     return {
      key: process.env.API_KEY.trim(),
      model: currentModel,
      source: 'Environment (Process)'
    };
  }

  try {
      const response = await fetch(getApiUrl('get_api_key.php'));
      if (response.ok) {
          const data = await response.json();
          if (data && data.key) {
              return {
                  key: data.key,
                  model: currentModel,
                  source: 'Server Master Key'
              };
          }
      }
  } catch (e) {
      // Ignore
  }

  return null;
};

export const addUserApiKey = async (key: string, label: string) => {
  const newKey: UserApiKey = {
    id: Date.now().toString(),
    key: key.trim(),
    label: label.trim() || `Key ${new Date().toLocaleTimeString()}`,
    addedAt: new Date().toISOString()
  };
  
  await addToStore(STORES.API_KEYS, newKey);
  
  const allKeys = await getAllFromStore(STORES.API_KEYS);
  if (Array.isArray(allKeys) && allKeys.length === 1) {
      localStorage.setItem(ACTIVE_KEY_ID_STORAGE, newKey.id);
      window.dispatchEvent(new CustomEvent('active-api-key-changed'));
  }
  
  return newKey;
};

export const getAllApiKeys = async (): Promise<UserApiKey[]> => {
  try {
      const keys = await getAllFromStore(STORES.API_KEYS);
      if (!Array.isArray(keys)) return [];
      return keys.sort((a: UserApiKey, b: UserApiKey) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  } catch (e) {
      console.error("Error getting API keys:", e);
      return [];
  }
};

export const setActiveApiKey = (id: string) => {
  localStorage.setItem(ACTIVE_KEY_ID_STORAGE, id);
  window.dispatchEvent(new CustomEvent('active-api-key-changed'));
};

export const deleteApiKey = async (id: string) => {
  await deleteFromStore(STORES.API_KEYS, id);
  if (localStorage.getItem(ACTIVE_KEY_ID_STORAGE) === id) {
    localStorage.removeItem(ACTIVE_KEY_ID_STORAGE);
    window.dispatchEvent(new CustomEvent('active-api-key-changed'));
  }
};

export const getActiveKeyId = () => {
  return localStorage.getItem(ACTIVE_KEY_ID_STORAGE);
};

export const incrementTotalCalls = async (source = 'Unknown', model = 'Unknown', keySource = 'Unknown') => {
  let count = parseInt(localStorage.getItem('simple_api_count') || '0');
  count++;
  localStorage.setItem('simple_api_count', count.toString());
  logApiCall('success', model);

  try {
      const getRes = await fetch(getApiUrl('api.php?action=get&store=global_stats'));
      if (getRes.ok) {
          const data = await getRes.json();
          // Safety check for array response
          if (Array.isArray(data)) {
              const serverRow = data.find((d: any) => d.id === 'global_stats_counter');
              let serverCount = serverRow ? parseInt(serverRow.total_api_calls) : 0;
              
              serverCount++;
              
              await fetch(getApiUrl('api.php?action=save&store=global_stats'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      id: 'global_stats_counter',
                      total_api_calls: serverCount
                  })
              });
              
              return serverCount;
          }
      }
  } catch (e) {
      // Suppress connection errors as server might be offline
      // console.warn("Stats sync skipped: Server unreachable"); 
  }

  return count;
};

export const getTotalCalls = async () => {
  try {
      const response = await fetch(getApiUrl('api.php?action=get&store=global_stats'));
      if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
              const serverRow = data.find((d: any) => d.id === 'global_stats_counter');
              if (serverRow) {
                  const count = parseInt(serverRow.total_api_calls);
                  localStorage.setItem('simple_api_count', count.toString());
                  return count;
              }
          }
      }
  } catch (e) {
      // Fallback
  }
  return parseInt(localStorage.getItem('simple_api_count') || '0');
};

export const markProviderAsLimited = async (key?: string, model?: string) => {};

export const logApiCall = (status: 'success' | 'error', model: string = 'unknown') => {
  try {
    const logsStr = localStorage.getItem('api_call_logs');
    const logs = logsStr ? JSON.parse(logsStr) : [];
    logs.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      model,
      status
    });
    // keep only last 2000
    if (logs.length > 2000) logs.shift();
    localStorage.setItem('api_call_logs', JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('api-call-logged'));
  } catch(e) {}
};

export const getApiCallLogs = async (): Promise<ApiCallLog[]> => {
  try {
    const logsStr = localStorage.getItem('api_call_logs');
    return logsStr ? JSON.parse(logsStr) : [];
  } catch(e) {
    return [];
  }
};
