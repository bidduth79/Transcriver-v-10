export interface SpeakerBgbMention {
  historyId: string;
  fileName: string;
  date: string;
  timestamp?: string;
  quote: string;
  context: string;
  sentiment?: 'supportive' | 'neutral' | 'critical';
}

export interface SpeakerDatabaseStats {
  totalAppearances: number;
  bgbMentionCount: number;
  filesAppeared: string[];
  coSpeakers: { name: string; count: number }[];
  mentions: SpeakerBgbMention[];
  overallStance: 'supportive' | 'neutral' | 'critical' | 'none';
}

export interface SpeakerCustomNote {
  speakerName: string;
  tags: string[];
  notes: string;
  roleOrDesignation?: string;
  updatedAt: string;
}

export interface SpeakerProfile {
  name: string;
  imageUrl?: string;
  wikipediaLang?: string;
  wikipediaTitle?: string;
  description: string;
  career: string;
  bgbViews: string;
  sourceUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  wikiSummaryEn?: string;
  wikiSummaryBn?: string;
  databaseStats?: SpeakerDatabaseStats;
  customNote?: SpeakerCustomNote;
}
