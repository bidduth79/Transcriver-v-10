export const STORES = {
  HISTORY: 'studio_history',
  REPORTS: 'studio_reports',
  SEARCH_ANALYSIS: 'studio_analysis',
  API_KEYS: 'user_api_keys',
  MASTER_KEYS: 'system_master_keys',
  SYSTEM_ACTIVITY_LOGS: 'activity_logs',
  API_CALL_LOGS: 'gemini_call_logs',
  STATS: 'global_stats',
  CHAT_HISTORY: 'assistant_chat_history',
  YOUTUBE_CHANNELS: 'youtube_channels',
  YOUTUBE_API_KEYS: 'youtube_api_keys',
  YOUTUBE_QUEUE: 'youtube_queue',
  YOUTUBE_LINKS: 'youtube_links',
  TRANSCRIPTS: 'youtube_transcripts',
  YOUTUBE_AUDIO: 'youtube_audio'
};

export const FIREBASE_SYNCED_STORES = [
  STORES.HISTORY,
  STORES.REPORTS,
  STORES.SEARCH_ANALYSIS,
  STORES.API_KEYS,
  STORES.MASTER_KEYS,
  STORES.STATS,
  STORES.API_CALL_LOGS,
  STORES.SYSTEM_ACTIVITY_LOGS,
  STORES.CHAT_HISTORY,
  STORES.YOUTUBE_CHANNELS,
  STORES.YOUTUBE_API_KEYS,
  STORES.YOUTUBE_QUEUE,
  STORES.YOUTUBE_LINKS,
  STORES.TRANSCRIPTS
];

export const ALL_STORES = Object.values(STORES);
