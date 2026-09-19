
import { GoogleGenAI } from "@google/genai";
import { getApiUrl } from './api.ts';
import { getAllFromStore, addToStore, deleteFromStore } from './db.ts';
import { STORES } from '../constants/storeNames.ts';
import { useAppStore } from '../hooks/useAppStore';

const ACTIVE_KEY_ID_STORAGE = 'manual_active_key_id';
const ACTIVE_MODEL_STORAGE = 'manual_active_model';
const DEFAULT_MODEL = 'gemini-3.5-transcribe';

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-transcribe', label: 'Gemini 3.5 Transcribe', badge: 'Default & Accurate' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', badge: 'Fast' },
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
  tokens?: number;
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
          } else {
            // Key not found in DB, clean up localStorage
            localStorage.removeItem(ACTIVE_KEY_ID_STORAGE);
            useAppStore.getState().triggerActiveApiKeyChanged();
          }
      }
    } catch (e) {
      console.error("Error fetching active key:", e);
    }
  }

  const env = import.meta.env;
  const envKey = env ? env.VITE_API_KEY_1 : undefined;

  if (envKey && typeof envKey === 'string' && envKey.trim() !== '') {
    return {
      key: envKey.trim(),
      model: currentModel,
      source: 'Environment (.env)'
    };
  }

  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
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
      useAppStore.getState().triggerActiveApiKeyChanged();
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
  useAppStore.getState().triggerActiveApiKeyChanged();
};

export const deleteApiKey = async (id: string) => {
  await deleteFromStore(STORES.API_KEYS, id);
  if (localStorage.getItem(ACTIVE_KEY_ID_STORAGE) === id) {
    localStorage.removeItem(ACTIVE_KEY_ID_STORAGE);
    useAppStore.getState().triggerActiveApiKeyChanged();
  }
};

export const getActiveKeyId = () => {
  return localStorage.getItem(ACTIVE_KEY_ID_STORAGE);
};

export const incrementTotalCalls = async (source = 'Unknown', model = 'Unknown', keySource = 'Unknown', tokens = 0) => {
  let count = parseInt(localStorage.getItem('simple_api_count') || '0');
  count++;
  localStorage.setItem('simple_api_count', count.toString());
  logApiCall('success', model, tokens);
  return count;
};

export const getTotalCalls = async () => {
  return parseInt(localStorage.getItem('simple_api_count') || '0');
};



export const logApiCall = (status: 'success' | 'error', model: string = 'unknown', tokens: number = 0) => {
  try {
    const logsStr = localStorage.getItem('api_call_logs');
    const logs = logsStr ? JSON.parse(logsStr) : [];
    logs.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      model,
      status,
      tokens
    });
    // keep only last 2000
    if (logs.length > 2000) logs.shift();
    localStorage.setItem('api_call_logs', JSON.stringify(logs));
    useAppStore.getState().triggerApiCallLogged();
  } catch (e) {
    console.error("Failed to log API call:", e);
  }
};

export const getApiCallLogs = async (): Promise<ApiCallLog[]> => {
  try {
    const logsStr = localStorage.getItem('api_call_logs');
    return logsStr ? JSON.parse(logsStr) : [];
  } catch(e) {
    return [];
  }
};
