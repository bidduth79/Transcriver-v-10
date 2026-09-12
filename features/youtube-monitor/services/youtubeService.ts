import { YouTubeApiKey } from '../../../types/youtube';

export const fetchYouTubeVideos = async (channelId: string, apiKey: string) => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=5&type=video`
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    const message = errorData.error?.message || 'Failed to fetch videos';
    if (message.toLowerCase().includes('quota') || errorData.error?.code === 403) {
      throw new Error(`QUOTA_EXCEEDED: ${message}`);
    }
    throw new Error(message);
  }
  
  const searchData = await response.json();

  if (!searchData.items || searchData.items.length === 0) {
    return searchData;
  }

  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  
  try {
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=contentDetails`
    );
    
    if (videosResponse.ok) {
      const videosData = await videosResponse.json();
      const durationMap: Record<string, string> = {};
      videosData.items.forEach((v: any) => {
        durationMap[v.id] = v.contentDetails.duration;
      });
      
      searchData.items = searchData.items.map((item: any) => ({
        ...item,
        duration: durationMap[item.id.videoId]
      }));
    }
  } catch (e) {
    console.error('Failed to fetch video durations:', e);
  }
  
  return searchData;
};

export const rotateApiKey = (keys: YouTubeApiKey[]): YouTubeApiKey | null => {
  const activeKeys = keys.filter(k => k.isActive && !k.isExhausted);
  if (activeKeys.length === 0) return null;
  
  const primaryKey = activeKeys.find(k => k.isPrimary);
  if (primaryKey) return primaryKey;

  // Simple round-robin or random selection
  return activeKeys[Math.floor(Math.random() * activeKeys.length)];
};
