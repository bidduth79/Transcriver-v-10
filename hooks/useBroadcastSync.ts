import { useEffect } from 'react';

const BROADCAST_CHANNEL_NAME = 'transcriver_sync_channel';
const CLIENT_ID = Math.random().toString(36).substring(2, 9);

export const useBroadcastSync = (onHistoryUpdate: () => void) => {
  useEffect(() => {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    
    channel.onmessage = (event) => {
      // Only process updates from OTHER browser tabs/windows
      if (event.data?.type === 'HISTORY_UPDATED' && event.data?.clientId !== CLIENT_ID) {
        onHistoryUpdate();
      }
    };

    return () => {
      channel.close();
    };
  }, [onHistoryUpdate]);
};

export const broadcastHistoryUpdate = () => {
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.postMessage({ type: 'HISTORY_UPDATED', clientId: CLIENT_ID, timestamp: Date.now() });
    channel.close();
  } catch (e) {
    // Ignore BroadcastChannel errors in restrictive contexts
  }
};
