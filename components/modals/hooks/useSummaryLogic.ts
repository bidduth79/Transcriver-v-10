import { useState, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getActiveProvider, incrementTotalCalls } from '../../../services/ApiKeyManager';
import { logSystemActivity } from '../../../services/SystemLogger';

export function useSummaryAnalysis(
  searchTerm: string, 
  transcript: string, 
  appLang: 'en' | 'bn', 
  addToast: (msg: string, type: any) => void,
  setIsAiLoading?: (loading: boolean) => void,
  onModelUpdate?: (models?: any) => void
) {
  const [aiAnalysis, setAiAnalysis] = useState<{ sentiment: 'positive' | 'negative' | 'neutral', remark: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const performAIAnalysis = async () => {
    if (!searchTerm || !transcript || isAnalyzing) return;
    setIsAnalyzing(true);
    if (setIsAiLoading) setIsAiLoading(true);
    setAiAnalysis(null);

    const executeAnalysis = async (): Promise<string | undefined> => {
      const provider = await getActiveProvider();
      if (!provider) {
          throw new Error("No Active API Key Selected. Please select one in Settings.");
      }

      const ai = new GoogleGenAI({ apiKey: provider.key });
      const prompt = `Analyze the context of the word/phrase "${searchTerm}" in this transcript.
      Task:
      1. Determine if the discussion about "${searchTerm}" is Positive, Negative, or Neutral.
      2. Write a short 1-sentence explanation in Bengali.
      
      Format your response EXACTLY like this:
      SENTIMENT: [Positive/Negative/Neutral]
      REMARK: [Explanation in Bengali]
      
      Transcript segment: ${transcript.substring(0, 10000)}`;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: provider.model,
        contents: prompt
      });
      await incrementTotalCalls('সার্চ এনালাইসিস', provider.model, provider.source);
      if (onModelUpdate) onModelUpdate();
      return response.text;
    };

    try {
      const text = await executeAnalysis() || "";
      const sentimentMatch = text.match(/SENTIMENT:\s*(Positive|Negative|Neutral|ইতিবাচক|নেতিবাচক|নিউট্রাল)/i);
      const remarkMatch = text.match(/REMARK:\s*(.*)/i);
      
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (sentimentMatch) {
        const s = sentimentMatch[1].toLowerCase();
        if (s.includes('positive') || s.includes('ইতিবাচক')) sentiment = 'positive';
        else if (s.includes('negative') || s.includes('নেতিবাচক')) sentiment = 'negative';
      }

      const remark = remarkMatch ? remarkMatch[1].trim() : (appLang === 'bn' ? 'বিশ্লেষণ সম্পন্ন হয়েছে।' : 'Analysis complete.');
      setAiAnalysis({ sentiment, remark });
      
      // Log Success
      logSystemActivity('ANALYSIS', 'SUCCESS', 'Sentiment Analysis Completed', `Term: ${searchTerm}, Sentiment: ${sentiment}`);
      
      addToast(appLang === 'bn' ? "এআই বিশ্লেষণ সফল হয়েছে" : "AI analysis successful", 'success');
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      
      // Log Error
      logSystemActivity('ANALYSIS', 'ERROR', 'Analysis Failed', `Error: ${error.message}`);
      
      const quotaMsg = appLang === 'bn' 
        ? "API Key সমস্যা বা কোটা শেষ। দয়া করে সেটিংসে গিয়ে কি পরিবর্তন করুন।" 
        : "API Key Error or Quota exceeded. Please change Key in Settings.";
      
      const errorMsg = error.message?.includes('429') || error.message?.includes('403') ? quotaMsg : (appLang === 'bn' ? 'এআই বিশ্লেষণ ব্যর্থ হয়েছে' : 'AI analysis failed');
      addToast(errorMsg, 'error');
    } finally {
      setIsAnalyzing(false);
      if (setIsAiLoading) setIsAiLoading(false);
    }
  };

  return { aiAnalysis, setAiAnalysis, isAnalyzing, performAIAnalysis };
}

export function useSummaryStats(searchTerm: string, transcript: string, fileMeta: any) {
  const currentStats = useMemo(() => {
    if (!searchTerm || !transcript) return null;
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (lowerSearch === "") return null;

    const lines = transcript.split('\n');
    const turns: { startTime: string, text: string }[] = [];
    let currentTurnText = "";
    let lastKnownTime = "00:00";

    lines.forEach((line) => {
      const timeMatch = line.match(/\[(\d{1,2}:\d{2})\]/);
      if (timeMatch) {
        if (currentTurnText.trim()) turns.push({ startTime: lastKnownTime, text: currentTurnText });
        lastKnownTime = timeMatch[1];
        currentTurnText = line; 
      } else {
        currentTurnText += " " + line;
      }
    });
    if (currentTurnText.trim()) turns.push({ startTime: lastKnownTime, text: currentTurnText });

    const ranges: string[] = [];
    const snippets: string[] = [];
    
    turns.forEach((turn, index) => {
      const cleanText = turn.text
        .replace(/\*\*.*?\*\*/g, '')
        .replace(/\[\d{1,2}:\d{2}\]/g, '')
        .replace(/Speaker \d+\s*:/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
        
      const turnContent = cleanText.toLowerCase();
      const startTime = turn.startTime;
      const endTime = turns[index + 1]?.startTime || fileMeta?.duration || "...";
      
      let pos = turnContent.indexOf(lowerSearch);
      while (pos !== -1) {
        ranges.push(`${startTime} - ${endTime}`);
        
        const beforeMatch = cleanText.substring(0, pos);
        const lastPunc = Math.max(
            beforeMatch.lastIndexOf('।'),
            beforeMatch.lastIndexOf('.'),
            beforeMatch.lastIndexOf('?'),
            beforeMatch.lastIndexOf('!'),
            beforeMatch.lastIndexOf('|')
        );
        const idealStartSnip = lastPunc === -1 ? 0 : lastPunc + 1;

        const afterMatch = cleanText.substring(pos + lowerSearch.length);
        const puncs = ['।', '.', '?', '!', '|'];
        let firstPunc = -1;
        for (const p of puncs) {
            const idx = afterMatch.indexOf(p);
            if (idx !== -1) {
                if (firstPunc === -1 || idx < firstPunc) {
                    firstPunc = idx;
                }
            }
        }
        const idealEndSnip = firstPunc === -1 ? cleanText.length : pos + lowerSearch.length + firstPunc + 1;
        const startSnip = Math.max(idealStartSnip, pos - 150);
        const endSnip = Math.min(idealEndSnip, pos + lowerSearch.length + 150);
        
        let snip = cleanText.substring(startSnip, endSnip).trim();
        if (startSnip > idealStartSnip) snip = "..." + snip;
        if (endSnip < idealEndSnip) snip = snip + "...";
        snippets.push(snip);
        pos = turnContent.indexOf(lowerSearch, pos + lowerSearch.length);
      }
    });

    return {
      searchTerm,
      fileName: fileMeta?.name || 'Unknown',
      duration: fileMeta?.duration || '00:00',
      matchCount: ranges.length,
      matchTimestamps: ranges,
      matchSentences: snippets
    };
  }, [transcript, searchTerm, fileMeta]);

  return currentStats;
}
