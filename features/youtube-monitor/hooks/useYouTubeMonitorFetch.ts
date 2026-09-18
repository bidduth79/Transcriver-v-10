import { useState } from 'react';
import { YouTubeApiKey } from '../../../types/youtube';

export function useYouTubeMonitorFetch(
  appLang: 'en' | 'bn',
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  channels: any[],
  apiKeys: YouTubeApiKey[],
  queueState: any,
  fetchYouTubeVideos: any,
  rotateApiKey: any,
  addVideoToQueue: any,
  markAllAsRead: any,
  updateApiKey: any,
  parseISO8601Duration: any
) {
  const [isFetching, setIsFetching] = useState(false);

  const fetchVideos = async () => {
    if (channels.length === 0) {
      addToast('No channels added to monitor', 'warning');
      return;
    }
    
    setIsFetching(true);
    try {
      let currentApiKeys = [...apiKeys];
      let activeKey = rotateApiKey(currentApiKeys);
      
      if (!activeKey) {
        addToast('No active API keys found', 'error');
        setIsFetching(false);
        return;
      }

      await markAllAsRead();
      const today = new Date().toDateString();

      for (const channel of channels) {
        let success = false;
        let retries = 0;
        
        while (!success && retries < apiKeys.length) {
          if (!activeKey) break;
          
          try {
            const data = await fetchYouTubeVideos(channel.channelId, activeKey.key);
            
            if (data.items) {
              for (const item of data.items) {
                const publishedDate = new Date(item.snippet.publishedAt).toDateString();
                if (publishedDate !== today) continue;

                const defaultKeywords = 'টকশো, সীমান্ত, বিজিবি, বিজিবি মহাপরিচালক, ডিজি বিজিবি, বিএসএফ, বর্ডার, পুশইন, সীমান্ত হত্যা';
                const keywordsStr = localStorage.getItem('yt_monitor_keywords') ?? defaultKeywords;
                const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0) : [];
                
                if (keywords.length > 0) {
                  const titleLower = item.snippet.title?.toLowerCase() || '';
                  const descriptionLower = item.snippet.description?.toLowerCase() || '';
                  const hasKeywordMatched = keywords.some(kw => titleLower.includes(kw) || descriptionLower.includes(kw));
                  if (!hasKeywordMatched) continue; 
                }

                const exists = queueState.queue.some((v: any) => v.videoId === item.id.videoId) || 
                               queueState.history.some((v: any) => v.videoId === item.id.videoId);
                
                const isBlacklisted = queueState.deletedVideoIds.includes(item.id.videoId);
                
                if (!exists && !isBlacklisted) {
                  const defaultDownloadType = (localStorage.getItem('yt_default_download_type') as 'video' | 'audio') || 'audio';
                  const defaultVideoFormat = localStorage.getItem('yt_default_video_format') || '720p';
                  const defaultAudioFormat = localStorage.getItem('yt_default_audio_format') || '16k';
                  
                  const getFormatLabel = (type: 'video' | 'audio', quality: string) => {
                    if (type === 'video') return quality;
                    if (quality === 'audio_best') return 'Best';
                    if (quality === 'mp3') return 'MP3 128k';
                    if (quality === '64k') return 'MP3 64k';
                    if (quality === '32k') return 'MP3 32k';
                    if (quality === '16k') return 'MP3 16k';
                    if (quality === 'm4a') return 'M4A';
                    if (quality === 'wav') return 'WAV';
                    if (quality === 'opus') return 'Opus HQ';
                    if (quality === 'audio') return 'Opus 16kHz (16 bit, 1 channel)';
                    return quality;
                  };

                  const formatToUse = { 
                    type: defaultDownloadType, 
                    quality: defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat, 
                    label: getFormatLabel(defaultDownloadType, defaultDownloadType === 'video' ? defaultVideoFormat : defaultAudioFormat) 
                  };

                  const video = {
                    id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
                    videoId: item.id.videoId,
                    channelId: channel.channelId,
                    channelTitle: channel.title,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnailUrl: item.snippet.thumbnails.high.url,
                    publishedAt: item.snippet.publishedAt,
                    duration: parseISO8601Duration(item.duration),
                    isLive: item.snippet.liveBroadcastContent === 'live',
                    status: 'pending',
                    format: formatToUse
                  };
                  await addVideoToQueue(video);
                }
              }
            }
            success = true;
          } catch (e: any) {
            console.error('Error fetching videos:', e);
            const errorMsg = e.message || String(e);
            
            if (errorMsg.includes('QUOTA_EXCEEDED')) {
              addToast(appLang === 'bn' ? `কোটা শেষ: ${activeKey.label}. পরিবর্তন করা হচ্ছে...` : `Quota exceeded: ${activeKey.label}. Rotating...`, 'warning');
              await updateApiKey(activeKey.id, { isExhausted: true, exhaustedAt: Date.now() });
              currentApiKeys = currentApiKeys.filter(k => k.id !== activeKey!.id);
              activeKey = rotateApiKey(currentApiKeys);
              if (!activeKey) {
                addToast(appLang === 'bn' ? 'সব এপিআই কি কোটা শেষ' : 'All API keys exhausted', 'error');
                return;
              }
              retries++;
            } else {
              addToast(`Error fetching ${channel.title}: ${errorMsg}`, 'error');
              break;
            }
          }
          if (channels.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
          }
        }
      }
    } finally {
      setIsFetching(false);
    }
  };

  return { isFetching, setIsFetching, fetchVideos };
}
