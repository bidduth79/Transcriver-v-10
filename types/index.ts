export interface FileMeta {
  name: string;
  size: string;
  duration: string;
  type: string;
  date: string;
}

export interface TranscriptMeta {
  name: string;
  duration: string;
  channelName: string;
  date: string;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  duration: string;
  channelName: string;
  publishedDate: string;
  date: string;
  transcript: string;
  isFavorite?: boolean;
  bgbRemark?: string;
  summary?: string;
  title?: string;
  // allow other dynamic fields if necessary
  [key: string]: any;
}

export interface AudioData {
  id: string;
  base64?: string; 
  format?: string;
  data?: string;
}
