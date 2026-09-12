import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { getActiveProvider, incrementTotalCalls } from '../services/ApiKeyManager';

export const useTransformTranscript = (
  transcript: string,
  setTranscript: (t: string) => void,
  appLang: 'bn' | 'en',
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  updateApiStats: () => void
) => {
  const [transformingType, setTransformingType] = useState<'translate' | 'encoding' | null>(null);

  const handleTransformTranscript = async (type: 'translate' | 'encoding') => {
    if (!transcript) return;
    setTransformingType(type);
    
    try {
        const provider = await getActiveProvider();
        if (!provider) throw new Error("No API Key");
        
        const ai = new GoogleGenAI({ apiKey: provider.key });
        let prompt = "";
        
        if (type === 'translate') {
            const targetLang = appLang === 'bn' ? 'English' : 'Bengali';
            prompt = `You are a professional translator. Translate the following transcript to ${targetLang}.
RULES:
1. KEEP TIMESTAMP FORMAT EXACTLY AS IS: [MM:SS]
2. Do NOT translate speaker labels if they are generic like "Speaker 1", but DO translate if they are descriptive.
3. Translate the spoken text accurately.
4. Maintain the exact same number of lines.
5. Do not add any introductory or concluding text.
6. Output ONLY the translated transcript.

STRICT FORMATTING RULE: Every timestamp MUST be placed at the very beginning of a new line. NEVER place a timestamp in the middle of a sentence or paragraph. Example:
[00:00] **Speaker 1:** Hello.
[00:05] **Speaker 2:** Hi there.

Input Text:
${transcript}`;
        } else {
            prompt = `Convert the following text to Bijoy encoding if it is Unicode, or Unicode if it is Bijoy. Maintain timestamps.\n\n${transcript}`;
        }

        const response = await ai.models.generateContent({
            model: provider.model,
            contents: prompt
        });
        
        await incrementTotalCalls('Transformation', provider.model, provider.source);
        updateApiStats();
        
        if (response.text) {
            setTranscript(response.text);
            addToast("Transformation Complete", "success");
        }
    } catch (e: any) {
        addToast(e.message || "Transformation Failed", "error");
    } finally {
        setTransformingType(null);
    }
  };

  return {
    transformingType,
    handleTransformTranscript
  };
};
