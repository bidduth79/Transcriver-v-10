export interface YouTubeChannel {
  id: string;
  channelId: string;
  title: string;
  thumbnailUrl?: string;
  addedAt: number;
}

export interface YouTubeApiKey {
  id: string;
  key: string;
  label: string;
  isActive: boolean;
  isExhausted: boolean;
  exhaustedAt?: number;
  isPrimary?: boolean;
  addedAt: number;
}

export interface YouTubeVideoFormat {
  type: 'video' | 'audio';
  quality: string;
  label: string;
}

export interface YouTubeVideo {
  id: string;
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration?: string;
  status: 'pending' | 'waiting' | 'downloading' | 'downloaded' | 'transcribing' | 'completed' | 'error' | 'failed' | 'duplicate';
  progress?: number;
  retryCount?: number;
  error?: string;
  localPath?: string;
  downloaded?: boolean;
  linkCopied?: boolean;
  isRead?: boolean;
  isLive?: boolean;
  isDeleted?: boolean;
  markedAt?: number;
  format?: YouTubeVideoFormat;
}

export interface QueueState {
  isAutoProcess: boolean;
  isAutoDownload: boolean;
  isPaused: boolean;
  activeVideoId: string | null;
  queue: YouTubeVideo[];
  history: YouTubeVideo[];
  deletedVideoIds: string[];
}
