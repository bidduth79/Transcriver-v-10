
import { GoogleGenAI } from "@google/genai";
import { BANGLADESHI_SYSTEM_INSTRUCTION, BANGLADESHI_PROMPT_TEXT } from '../constants/instructions';

export async function transcribeAudio(base64Data, mimeType) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: BANGLADESHI_PROMPT_TEXT
            }
          ]
        }
      ],
      config: {
        systemInstruction: BANGLADESHI_SYSTEM_INSTRUCTION,
        temperature: 0.0, // Absolute minimum for maximum factual reproduction
      }
    });

    const transcription = response.text;
    if (!transcription) {
      throw new Error("No transcription generated.");
    }

    return transcription;
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw error;
  }
}
