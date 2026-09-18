import { useState, useEffect } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { STORES, getAllFromStore, addToStore, deleteFromStore } from '../../../services/db';
import { YouTubeChannel } from '../../../types/youtube';

export const useYouTubeChannels = () => {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);

  const loadChannels = async () => {
    const loadedChannels = (await getAllFromStore(STORES.YOUTUBE_CHANNELS)) as YouTubeChannel[];
    setChannels(loadedChannels || []);
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const channelUpdates = useAppStore(state => state.storeUpdates[STORES.YOUTUBE_CHANNELS]);
  useEffect(() => {
    loadChannels();
  }, [channelUpdates]);

  const addChannel = async (channel: YouTubeChannel) => {
    await addToStore(STORES.YOUTUBE_CHANNELS, channel);
    setChannels(prev => [...prev, channel]);
  };

  const updateChannel = async (id: string, updatedChannel: Partial<YouTubeChannel>) => {
    const channel = channels.find(c => c.id === id);
    if (!channel) return;
    const newChannel = { ...channel, ...updatedChannel };
    await addToStore(STORES.YOUTUBE_CHANNELS, newChannel);
    setChannels(prev => prev.map(c => c.id === id ? newChannel : c));
  };

  const removeChannel = async (id: string) => {
    await deleteFromStore(STORES.YOUTUBE_CHANNELS, id);
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  return {
    channels,
    addChannel,
    updateChannel,
    removeChannel
  };
};
