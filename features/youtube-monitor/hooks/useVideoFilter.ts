import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { YouTubeVideo } from '../../../types/youtube';
import { formatDate } from '../utils/formatters';

export const useVideoFilter = (queueState: any) => {
  const [monitorFilter, setMonitorFilter] = useState<'all' | 'unread' | 'archive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [selectedDurationFilter, setSelectedDurationFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [settingsUpdateTrigger, setSettingsUpdateTrigger] = useState(0);

  const ytSettingsChanged = useAppStore(state => state.ytSettingsChanged);

  // Listen for settings change to re-evaluate keywords filter
  useEffect(() => {
    setSettingsUpdateTrigger(prev => prev + 1);
  }, [ytSettingsChanged]);

  const filterVideos = (videos: YouTubeVideo[]) => {
    const defaultKeywords = 'টকশো, সীমান্ত, বিজিবি, বিজিবি মহাপরিচালক, ডিজি বিজিবি, বিএসএফ, বর্ডার, পুশইন, সীমান্ত হত্যা';
    const keywordsStr = localStorage.getItem('yt_monitor_keywords') ?? defaultKeywords;
    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0) : [];

    return videos.filter(v => {
      // Check keyword settings first
      if (keywords.length > 0) {
        const titleLower = v.title?.toLowerCase() || '';
        const descriptionLower = v.description?.toLowerCase() || '';
        const hasKeywordMatched = keywords.some(kw => titleLower.includes(kw) || descriptionLower.includes(kw));
        if (!hasKeywordMatched) {
          return false;
        }
      }

      const matchesSearch = v.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            v.channelTitle?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = monitorFilter === 'all' ? true : 
                            monitorFilter === 'unread' ? !v.isRead : 
                            v.isRead;
                            
      const matchesChannel = selectedChannelFilter === 'all' || v.channelId === selectedChannelFilter;
      
      let matchesDate = true;
      if (selectedDateFilter !== 'all') {
        const pubDate = new Date(v.publishedAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDateFilter === 'today') {
          matchesDate = pubDate >= today;
        } else if (selectedDateFilter === 'yesterday') {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          matchesDate = pubDate >= yesterday && pubDate < today;
        } else if (selectedDateFilter === 'this_week') {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          matchesDate = pubDate >= startOfWeek;
        }
      }

      let matchesTime = true;
      if (selectedTimeFilter !== 'all') {
        const hours = new Date(v.publishedAt).getHours();
        if (selectedTimeFilter === 'morning') matchesTime = hours >= 5 && hours < 12;
        else if (selectedTimeFilter === 'afternoon') matchesTime = hours >= 12 && hours < 17;
        else if (selectedTimeFilter === 'evening') matchesTime = hours >= 17 && hours < 21;
        else if (selectedTimeFilter === 'night') matchesTime = hours >= 21 || hours < 5;
      }

      let matchesDuration = true;
      if (selectedDurationFilter !== 'all' && v.duration) {
        const parts = v.duration.split(':').map(Number);
        let minutes = 0;
        if (parts.length === 3) {
          minutes = parts[0] * 60 + parts[1] + (parts[2] || 0) / 60;
        } else if (parts.length === 2) {
          minutes = parts[0] + (parts[1] || 0) / 60;
        }
        
        if (selectedDurationFilter === 'short') matchesDuration = minutes < 5;
        else if (selectedDurationFilter === 'medium') matchesDuration = minutes >= 5 && minutes <= 20;
        else if (selectedDurationFilter === 'long') matchesDuration = minutes > 20;
      }

      let matchesVideoStatus = true;
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'downloaded') matchesVideoStatus = v.status === 'downloaded' || v.status === 'completed' || !!v.downloaded;
        else if (selectedStatusFilter === 'error') matchesVideoStatus = v.status === 'error' || v.status === 'failed';
        else if (selectedStatusFilter === 'visited') matchesVideoStatus = !!v.isRead;
        else if (selectedStatusFilter === 'link_copied') matchesVideoStatus = !!v.linkCopied;
        else if (selectedStatusFilter === 'live') matchesVideoStatus = !!v.isLive;
      }

      return matchesSearch && matchesStatus && matchesChannel && matchesDate && matchesTime && matchesDuration && matchesVideoStatus;
    });
  };

  const recentVideos = useMemo(() => {
    return filterVideos(queueState.queue).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueState.queue, searchQuery, monitorFilter, selectedChannelFilter, selectedDateFilter, selectedTimeFilter, selectedDurationFilter, selectedStatusFilter, settingsUpdateTrigger]);

  const oldVideos = useMemo(() => {
    return filterVideos(queueState.history).sort((a, b) => (b.markedAt || 0) - (a.markedAt || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueState.history, searchQuery, monitorFilter, selectedChannelFilter, selectedDateFilter, selectedTimeFilter, selectedDurationFilter, selectedStatusFilter, settingsUpdateTrigger]);

  const groupVideosByDate = (videos: YouTubeVideo[], dateExtractor: (v: YouTubeVideo) => string) => {
    return videos.reduce((acc, video) => {
      const dateStr = formatDate(dateExtractor(video));
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(video);
      return acc;
    }, {} as Record<string, YouTubeVideo[]>);
  };

  const groupedRecent = useMemo(() => groupVideosByDate(recentVideos, v => v.publishedAt), [recentVideos]);
  const groupedOld = useMemo(() => groupVideosByDate(oldVideos, v => v.markedAt ? new Date(v.markedAt).toISOString() : v.publishedAt), [oldVideos]);

  return {
    monitorFilter, setMonitorFilter,
    searchQuery, setSearchQuery,
    selectedChannelFilter, setSelectedChannelFilter,
    selectedDurationFilter, setSelectedDurationFilter,
    selectedDateFilter, setSelectedDateFilter,
    selectedTimeFilter, setSelectedTimeFilter,
    selectedStatusFilter, setSelectedStatusFilter,
    recentVideos, oldVideos,
    groupedRecent, groupedOld
  };
};
