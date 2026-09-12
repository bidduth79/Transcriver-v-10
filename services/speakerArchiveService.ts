import { fetchDataDual } from './api';
import { SpeakerBgbMention, SpeakerDatabaseStats, SpeakerCustomNote } from '../types/speaker';

const BGB_KEYWORDS = [
  'বিজিবি', 'বর্ডার গার্ড', 'বর্ডার গার্ড বাংলাদেশ', 'bgb', 'border guard',
  'সীমান্ত', 'সীমান্তে', 'সীমান্তবর্তী', 'সীমান্ত হত্যা', 'ফেলানী',
  'বিডিআর', 'পিলখানা', 'বিএসএফ', 'bsf', 'চোরাচালান', 'অনুপ্রবেশ'
];

const CUSTOM_NOTES_STORE_KEY = 'speaker_custom_dossier_notes';

export const getCustomNote = (speakerName: string): SpeakerCustomNote | null => {
  try {
    const allNotes = JSON.parse(localStorage.getItem(CUSTOM_NOTES_STORE_KEY) || '{}');
    return allNotes[speakerName.trim().toLowerCase()] || null;
  } catch (e) {
    return null;
  }
};

export const saveCustomNote = (note: SpeakerCustomNote) => {
  try {
    const allNotes = JSON.parse(localStorage.getItem(CUSTOM_NOTES_STORE_KEY) || '{}');
    allNotes[note.speakerName.trim().toLowerCase()] = note;
    localStorage.setItem(CUSTOM_NOTES_STORE_KEY, JSON.stringify(allNotes));
  } catch (e) {
    console.error('Failed to save custom note', e);
  }
};

export const scanDatabaseForSpeaker = async (
  speakerName: string,
  currentTranscript: string = ''
): Promise<SpeakerDatabaseStats> => {
  const normTarget = speakerName.trim().toLowerCase();
  
  // 1. Fetch all items from studio_history
  let historyItems: any[] = [];
  try {
    historyItems = await fetchDataDual('studio_history');
  } catch (e) {
    console.warn('Could not load history items for speaker scan:', e);
  }

  // Also include the current transcript if not already in history
  const allTranscriptsToScan: { id: string; fileName: string; date: string; transcript: string }[] = [];
  
  if (currentTranscript && currentTranscript.trim().length > 0) {
    allTranscriptsToScan.push({
      id: 'current_session',
      fileName: 'বর্তমান অডিও/ভিডিও ফাইল',
      date: new Date().toLocaleDateString('bn-BD'),
      transcript: currentTranscript
    });
  }

  if (Array.isArray(historyItems)) {
    historyItems.forEach((item) => {
      if (item && item.transcript) {
        allTranscriptsToScan.push({
          id: String(item.id || item.timestamp || Math.random()),
          fileName: item.fileName || item.title || 'নামবিহীন রেকর্ড',
          date: item.date || (item.timestamp ? new Date(item.timestamp).toLocaleDateString('bn-BD') : 'অজানা তারিখ'),
          transcript: item.transcript
        });
      }
    });
  }

  let totalAppearances = 0;
  const filesAppeared = new Set<string>();
  const coSpeakerMap = new Map<string, number>();
  const mentions: SpeakerBgbMention[] = [];

  allTranscriptsToScan.forEach((rec) => {
    const lines = rec.transcript.split('\n');
    let speakerFoundInThisFile = false;
    const speakersInThisFile = new Set<string>();

    lines.forEach((line) => {
      // Regex to capture timestamp and speaker: [00:15] **Speaker Name:** or **Speaker Name:** or Speaker Name:
      const speakerMatch = line.match(/^(\[\d{1,2}:\d{2}(?::\d{2})?\])?\s*\*\*([^*]+)\*\*:\s*(.*)$/) ||
                           line.match(/^(\[\d{1,2}:\d{2}(?::\d{2})?\])?\s*([A-Za-z0-9\u0980-\u09FF\s._-]+):\s*(.*)$/);

      if (speakerMatch) {
        const timestamp = speakerMatch[1] ? speakerMatch[1].replace(/[\[\]]/g, '') : '';
        const detectedSpeaker = speakerMatch[2].trim();
        const speechText = speakerMatch[3] ? speakerMatch[3].trim() : '';

        const normDetected = detectedSpeaker.toLowerCase();
        speakersInThisFile.add(detectedSpeaker);

        // Check if this dialogue belongs to the target speaker
        if (normDetected === normTarget || normDetected.includes(normTarget) || normTarget.includes(normDetected)) {
          speakerFoundInThisFile = true;

          // Check if speechText contains BGB keywords
          const lowerSpeech = speechText.toLowerCase();
          const hasBgbKeyword = BGB_KEYWORDS.some(kw => lowerSpeech.includes(kw.toLowerCase()));

          if (hasBgbKeyword && speechText.length > 5) {
            // Sentiment estimation
            let sentiment: 'supportive' | 'neutral' | 'critical' = 'neutral';
            const positiveWords = ['সাহসী', 'বীরত্ব', 'ধন্যবাদ', 'প্রশংসা', 'পাহারায়', 'নিরাপত্তা', 'সতর্ক', 'শক্তিশালী', 'গর্ব'];
            const criticalWords = ['ব্যর্থ', 'অসহায়', 'হত্যা', 'গুলি', 'দুর্নীতি', 'নিষ্ক্রিয়', 'দায়িত্বজ্ঞানহীন', 'অভিযোগ', 'বর্বরোচিত', 'অন্যায়'];

            const hasPos = positiveWords.some(w => speechText.includes(w));
            const hasCrit = criticalWords.some(w => speechText.includes(w));

            if (hasCrit && !hasPos) sentiment = 'critical';
            else if (hasPos && !hasCrit) sentiment = 'supportive';

            mentions.push({
              historyId: rec.id,
              fileName: rec.fileName,
              date: rec.date,
              timestamp: timestamp || undefined,
              quote: speechText,
              context: line,
              sentiment
            });
          }
        }
      } else {
        // Line without direct speaker header, but if target speaker was found or transcript is raw
        const lowerLine = line.toLowerCase();
        if ((lowerLine.includes(normTarget)) && BGB_KEYWORDS.some(kw => lowerLine.includes(kw.toLowerCase()))) {
          mentions.push({
            historyId: rec.id,
            fileName: rec.fileName,
            date: rec.date,
            quote: line.trim(),
            context: line.trim(),
            sentiment: 'neutral'
          });
        }
      }
    });

    if (speakerFoundInThisFile) {
      totalAppearances++;
      filesAppeared.add(rec.fileName);

      // Track co-speakers
      speakersInThisFile.forEach(s => {
        const sNorm = s.trim().toLowerCase();
        if (sNorm !== normTarget && !sNorm.includes(normTarget) && !normTarget.includes(sNorm)) {
          coSpeakerMap.set(s, (coSpeakerMap.get(s) || 0) + 1);
        }
      });
    }
  });

  // Calculate overall stance
  let supportiveCount = 0;
  let criticalCount = 0;
  mentions.forEach(m => {
    if (m.sentiment === 'supportive') supportiveCount++;
    if (m.sentiment === 'critical') criticalCount++;
  });

  let overallStance: 'supportive' | 'neutral' | 'critical' | 'none' = 'none';
  if (mentions.length > 0) {
    if (supportiveCount > criticalCount) overallStance = 'supportive';
    else if (criticalCount > supportiveCount) overallStance = 'critical';
    else overallStance = 'neutral';
  }

  // Format co-speakers list sorted by count
  const coSpeakers = Array.from(coSpeakerMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalAppearances,
    bgbMentionCount: mentions.length,
    filesAppeared: Array.from(filesAppeared),
    coSpeakers,
    mentions: mentions.slice(0, 20), // Top 20 quotes
    overallStance
  };
};
