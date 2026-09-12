import { useState } from 'react';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getActiveProvider, incrementTotalCalls } from '../services/ApiKeyManager';
import { fileToBase64 } from '../utils/fileUtils';
import { addToStore, getAllFromStore, STORES } from '../services/db';
import { logSystemActivity } from '../services/SystemLogger';
import { TRANSCRIPTION_SYSTEM_INSTRUCTION, TRANSCRIPTION_PROMPT_TEXT } from '../constants/instructions';

const removeRepetitiveBlocks = (text: string): string => {
  if (!text || text.length < 500) return text;
  
  // To avoid O(N^2) CPU freezing on long streams, only check the tail
  const checkStartIndex = text.length > 4000 ? text.length - 3000 : 0;
  const prefix = text.length > 4000 ? text.substring(0, checkStartIndex) : '';
  const textToCheck = text.length > 4000 ? text.substring(checkStartIndex) : text;

  const lines = textToCheck.split('\n');
  const cleanedLines: string[] = [];
  const recentLines: string[] = [];
  const MAX_HISTORY = 30; // Look back up to 30 lines
  let loopDetected = false;
  
  for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length <= 25) {
          cleanedLines.push(lines[i]);
          continue;
      }

      // Remove timestamp and speaker name for comparison to catch pure repetition
      const contentWithoutTimeAndSpeaker = line.replace(/^\[\d{1,2}:\d{2}(:\d{2})?\]\s*(\*\*.*?\*\*\s*)?/, '').trim();
      
      if (contentWithoutTimeAndSpeaker.length > 25) {
          const occurrences = recentLines.filter(l => l === contentWithoutTimeAndSpeaker).length;
          if (occurrences >= 4) { // If it's about to be added for the 5th time
              console.warn('Hallucination loop detected. Truncating transcript tail.');
              loopDetected = true;
              break;
          }
          
          recentLines.push(contentWithoutTimeAndSpeaker);
          if (recentLines.length > MAX_HISTORY) {
              recentLines.shift();
          }
      }
      
      cleanedLines.push(lines[i]);
  }
  
  if (!loopDetected) return text; // Return original reference to preserve trailing spaces
  return prefix + cleanedLines.join('\n');
};

export const useTranscription = (
  appLang: 'en' | 'bn',
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  loadHistory: () => void,
  updateApiStats: () => void,
  playSuccessSound: () => void
) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, _setFileUrl] = useState<string | null>(null);
  const setFileUrl = (newUrl: string | null) => {
    _setFileUrl(prev => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return newUrl;
    });
  };
  const [fileMeta, setFileMeta] = useState<any>({});
  
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const processTranscription = async (inputFile = file, inputMetadata = fileMeta, isAutoProcess = false) => {
    if (!inputFile) return;

    // 70MB limit for inline data
    if (inputFile.size > 70 * 1024 * 1024) {
      addToast(appLang === 'bn' ? 'ফাইল সাইজ ৭০ এমবি এর বেশি হতে পারবে না' : 'File size cannot exceed 70MB', 'error');
      setStatus('idle');
      return;
    }

    setStatus('processing');
    setTranscript('');
    setProgress(0);
    setElapsedSeconds(0);
    
    // Better estimation logic based on audio duration if available
    let audioDurationSeconds = 0;
    if (inputMetadata && inputMetadata.duration && typeof inputMetadata.duration === 'string') {
      const parts = inputMetadata.duration.split(':').map(Number);
      if (parts.length === 2) {
        audioDurationSeconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        audioDurationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }

    // Gemini 3 Flash is fast, but there's overhead.
    // Base time: 12s-15s for overhead (API call, upload, etc.)
    // Processing time: ~8-10% of audio duration for transcription
    let estimated = 25;
    if (audioDurationSeconds > 0) {
      // For short files, minimum 20s. For long files, scale with duration.
      // 15s base + 10% of duration
      estimated = Math.max(20, Math.floor(15 + audioDurationSeconds * 0.10));
    } else {
      // Fallback to size-based estimation if duration is missing
      const sizeMB = inputFile.size / (1024 * 1024);
      estimated = Math.max(25, Math.floor(sizeMB * 10));
    }

    console.log(`Estimating transcription time: ${estimated}s for ${audioDurationSeconds}s audio`);
    setEstimatedSeconds(estimated);
    setCurrentStage(appLang === 'bn' ? 'অডিও সিগন্যাল ডিকোড করা হচ্ছে...' : 'Decoding audio signals...');
    
    const startTime = Date.now();
    
    const timer = setInterval(() => {
      setElapsedSeconds(s => s + 1);
      setProgress(p => {
        const newP = Math.min(p + (100 / estimated), 98);
        
        // Dynamic Technical Stages based on progress
        if (newP < 15) {
          setCurrentStage(appLang === 'bn' ? 'অডিও সিগন্যাল ডিকোড করা হচ্ছে...' : 'Decoding audio signals...');
        } else if (newP < 30) {
          setCurrentStage(appLang === 'bn' ? 'ভয়েস অ্যাক্টিভিটি ডিটেকশন (VAD) চলছে...' : 'Running Voice Activity Detection (VAD)...');
        } else if (newP < 45) {
          setCurrentStage(appLang === 'bn' ? 'নিউরাল স্পিচ রিকগনিশন মডেল ইনিশিয়ালাইজ হচ্ছে...' : 'Initializing neural speech recognition models...');
        } else if (newP < 60) {
          setCurrentStage(appLang === 'bn' ? 'অডিও ফিচার এক্সট্রাকশন এবং টোকেনাইজেশন চলছে...' : 'Audio feature extraction and tokenization...');
        } else if (newP < 75) {
          setCurrentStage(appLang === 'bn' ? 'এআই ইনফারেন্স এবং টেক্সট জেনারেশন চলছে...' : 'AI inference and text generation in progress...');
        } else if (newP < 90) {
          setCurrentStage(appLang === 'bn' ? 'ন্যাচারাল ল্যাঙ্গুয়েজ প্রসেসিং (NLP) প্রয়োগ করা হচ্ছে...' : 'Applying Natural Language Processing (NLP)...');
        } else {
          setCurrentStage(appLang === 'bn' ? 'ফাইনাল আউটপুট অপ্টিমাইজ ও ফরম্যাটিং করা হচ্ছে...' : 'Optimizing and formatting final output...');
        }
        
        return newP;
      });
    }, 1000);

    try {
      const base64Data = await fileToBase64(inputFile);
      const checkProvider = await getActiveProvider();
      
      if (!checkProvider) {
        throw new Error("No API Key configured. Please add one in Settings.");
      }

      const ai = new GoogleGenAI({ apiKey: checkProvider.key });
      const mimeType = inputFile.type || 'audio/mp3';
      
      const systemInstruction = TRANSCRIPTION_SYSTEM_INSTRUCTION;

      // Check audio duration to determine if we should stream or not
      let durationInMinutes = 0;
      if (inputMetadata?.duration) {
          const parts = inputMetadata.duration.split(':').map(Number);
          if (parts.length === 2) {
              durationInMinutes = parts[0] + parts[1] / 60;
          } else if (parts.length === 3) {
              durationInMinutes = parts[0] * 60 + parts[1] + parts[2] / 60;
          }
      }
      const isLongAudio = durationInMinutes > 20;

      const modelName = checkProvider.model || 'gemini-3-flash-preview';
      let promptText = TRANSCRIPTION_PROMPT_TEXT;

      if (modelName === 'gemini-3.1-flash-lite-preview') {
          promptText += "\n\nCRITICAL FOR THIS MODEL: Ensure every timestamp like [MM:SS] starts on a NEW LINE. Do NOT put timestamps in the middle of text. Each speaker's dialogue MUST be on a separate line. Example:\n[00:00] **Speaker 1:** Hello.\n[00:05] **Speaker 2:** Hi there.";
      }

      const requestOptions = {
          model: modelName, 
          contents: { 
              role: 'user',
              parts: [
                  { inlineData: { mimeType: mimeType, data: base64Data as string } },
                  { text: promptText }
              ] 
          },
          config: {
              systemInstruction: systemInstruction,
              temperature: 0.1, 
              safetySettings: [
                  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              ]
          }
      };

      let fullText = '';

      if (isLongAudio) {
          // For long audio (>20 mins), disable live streaming to prevent timeout/cutoff issues
          const response = await ai.models.generateContent(requestOptions);
          fullText = removeRepetitiveBlocks(response.text || '');
          setTranscript(fullText);
      } else {
          // For shorter audio, use live streaming
          const responseStream = await ai.models.generateContentStream(requestOptions);
          for await (const chunk of responseStream) {
              if (chunk.text) {
                  fullText += chunk.text;
                  const cleanedText = removeRepetitiveBlocks(fullText);
                  if (cleanedText.length < fullText.length) {
                      // We detected and truncated a loop!
                      fullText = cleanedText;
                      setTranscript(fullText);
                      break; // Stop the stream
                  }
                  setTranscript(fullText); // Update UI in real-time
              }
          }
      }

      await incrementTotalCalls('Transcription', checkProvider.model || 'gemini-3-flash-preview', checkProvider.source);
      updateApiStats();

      if (!fullText) throw new Error("Empty response from AI");

      setStatus('completed');
      playSuccessSound(); // Always play success tone
      if (!isAutoProcess) {
        setShowSuccessModal(true); // Trigger Success Modal only if not auto processing
      }
      
      const fileName = (inputFile as File).name || inputMetadata.name || "audio_file";
      const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'mp3';

      // Check if history item already exists to prevent double history
      const existingHistory = await getAllFromStore(STORES.HISTORY) || [];
      const existingItem = (existingHistory as any[]).find((item: any) => item.fileName === fileName);
      const historyId = existingItem ? existingItem.id : Date.now().toString();

      const actualElapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      setElapsedSeconds(actualElapsedSeconds);

      // Analyze for BGB if enabled
      let bgbRemark = null;
      const isBgbAnalysisEnabled = localStorage.getItem('bgbAnalysisEnabled') === 'true';
      if (isBgbAnalysisEnabled) {
          const { getSensitiveKeywords } = await import('../utils/sensitiveKeywords');
          const { analyzeTranscriptForBgb } = await import('../services/bgbAnalysisService');
          
          const keywords = getSensitiveKeywords();
          const lower = fullText.toLowerCase();
          const matches = keywords.filter(kw => lower.includes(kw.toLowerCase()));
          
          if (matches.length > 0) {
              const result = await analyzeTranscriptForBgb(fullText, matches);
              if (result) {
                  bgbRemark = result.remark;
              }
          }
      }

      const historyItem = {
        id: historyId,
        fileName: fileName,
        date: new Date().toISOString(),
        publishedDate: inputMetadata.date,
        duration: inputMetadata.duration || '00:00',
        transcript: fullText,
        extension: fileExtension,
        timeTaken: `${actualElapsedSeconds}s`,
        channelName: inputMetadata.channelName,
        size: inputMetadata.size || `${(inputFile.size / (1024 * 1024)).toFixed(2)} MB`,
        bgbRemark: bgbRemark
      };
      await addToStore(STORES.HISTORY, historyItem);
      loadHistory();
      logSystemActivity('TRANSCRIPTION', 'SUCCESS', 'File Transcribed', `File: ${fileName}`);

      return { success: true, text: fullText };
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      const rawMsg = error.message || "Unknown error occurred";
      const safeMsg = rawMsg.length > 300 ? rawMsg.substring(0, 300) + '...' : rawMsg;
      setErrorMessage(safeMsg);
      logSystemActivity('TRANSCRIPTION', 'ERROR', 'Failed', safeMsg);
      return { success: false, error: safeMsg };
    } finally {
      clearInterval(timer);
      setProgress(100);
    }
  };

  const resetAll = () => {
    setFile(null);
    setFileUrl(null);
    setFileMeta({});
    setTranscript('');
    setStatus('idle');
  };

  return {
    status, setStatus,
    transcript, setTranscript,
    errorMessage, setErrorMessage,
    progress, setProgress,
    currentStage, setCurrentStage,
    elapsedSeconds, setElapsedSeconds,
    estimatedSeconds, setEstimatedSeconds,
    file, setFile,
    fileUrl, setFileUrl,
    fileMeta, setFileMeta,
    showSuccessModal, setShowSuccessModal,
    processTranscription,
    resetAll
  };
};
