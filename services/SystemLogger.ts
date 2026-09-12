import { addToStore, STORES } from './db.ts';

export interface SystemLogItem {
  id: string;
  timestamp: string;
  category: string;
  status: string;
  message: string;
  details?: string;
}

export const logSystemActivity = async (
  category: string,
  status: string,
  message: string,
  details = ''
) => {
  const logEntry: SystemLogItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    category,
    status,
    message,
    details
  };

  try {
    await addToStore(STORES.SYSTEM_ACTIVITY_LOGS, logEntry);
    console.log(`[SystemLog] ${category}: ${message}`);
  } catch (error) {
    console.error("Failed to save system log:", error);
  }
};
