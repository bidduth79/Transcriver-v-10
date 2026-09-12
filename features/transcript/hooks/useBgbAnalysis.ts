import { useState, useEffect } from 'react';
import { analyzeTranscriptForBgb } from '../../../services/bgbAnalysisService';
import { BgbAnalysisResult, BgbRemarkType } from '../../../types/bgb';

export const useBgbAnalysis = (transcript: string, sensitiveMatches: string[]) => {
  const [isBgbAnalysisEnabled, setIsBgbAnalysisEnabled] = useState(() => {
    const saved = localStorage.getItem('bgbAnalysisEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [bgbAnalysisResult, setBgbAnalysisResult] = useState<BgbAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    localStorage.setItem('bgbAnalysisEnabled', JSON.stringify(isBgbAnalysisEnabled));
    if (!isBgbAnalysisEnabled) {
      setBgbAnalysisResult(null);
    }
  }, [isBgbAnalysisEnabled]);

  useEffect(() => {
    setBgbAnalysisResult(null);
  }, [transcript]);

  const triggerAnalysis = async () => {
    if (!isBgbAnalysisEnabled || !transcript || sensitiveMatches.length === 0) {
      setBgbAnalysisResult(null);
      return;
    }

    setIsAnalyzing(true);
    setBgbAnalysisResult(null);

    const result = await analyzeTranscriptForBgb(transcript, sensitiveMatches);
    setBgbAnalysisResult(result);
    setIsAnalyzing(false);
  };

  return {
    isBgbAnalysisEnabled,
    setIsBgbAnalysisEnabled,
    bgbAnalysisResult,
    isAnalyzing,
    triggerAnalysis
  };
};
