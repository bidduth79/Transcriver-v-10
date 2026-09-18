import { useEffect } from 'react';

const BROADCAST_CHANNEL_NAME = 'transcriver_sync_channel';

export const useBroadcastSync = (onHistoryUpdate: () => void) => {
  useEffect(() => {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    
    channel.onmessage = (event) => {
      if (event.data.type === 'HISTORY_UPDATED') {
        onHistoryUpdate();
      }
    };

    return () => {
      channel.close();
    };
  }, [onHistoryUpdate]);
};

export const broadcastHistoryUpdate = () => {
  const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  channel.postMessage({ type: 'HISTORY_UPDATED', timestamp: Date.now() });
  channel.close();
};
