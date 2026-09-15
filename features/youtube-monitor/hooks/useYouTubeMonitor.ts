import { useYouTubeChannels } from './useYouTubeChannels';
import { useYouTubeApiKeys } from './useYouTubeApiKeys';
import { useYouTubeQueue } from './useYouTubeQueue';
import { useYouTubeSelection } from './useYouTubeSelection';

export const useYouTubeMonitor = () => {
  const channelData = useYouTubeChannels();
  const apiKeyData = useYouTubeApiKeys();
  const queueData = useYouTubeQueue();
  const selectionData = useYouTubeSelection(
    queueData.queueState, 
    queueData.setQueueState, 
    queueData.bulkDelete, 
    queueData.bulkUpdateStatus
  );

  return {
    ...channelData,
    ...apiKeyData,
    ...queueData,
    ...selectionData
  };
};
