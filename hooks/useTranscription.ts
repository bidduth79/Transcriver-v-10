import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getActiveProvider, incrementTotalCalls } from '../services/ApiKeyManager';

import { addToStore, STORES } from '../services/db';
import { logSystemActivity } from '../services/SystemLogger';
import { TRANSCRIPTION_SYSTEM_INSTRUCTION, TRANSCRIPTION_PROMPT_TEXT, TRANSCRIPTION_SYSTEM_INSTRUCTION_NORMAL, TRANSCRIPTION_PROMPT_TEXT_NORMAL } from '../constants/instructions';
import { useTranscriptionState } from './transcription/useTranscriptionState';
import { removeRepetitiveBlocks, calculateEstimatedSeconds, parseDurationToSeconds } from './transcription/transcriptionUtils';

const formatErrorMessage = (rawError: any, lang: 'bn' | 'en'): string => {
  let rawMsg = typeof rawError === 'string' ? rawError : (rawError?.message || "Unknown error occurred");
  
  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed?.error?.message) {
        try {
            const innerParsed = JSON.parse(parsed.error.message);
            if (innerParsed?.error?.message) {
                rawMsg = innerParsed.error.message;
            } else {
                rawMsg = parsed.error.message;
            }
        } catch(e) {
            rawMsg = parsed.error.message;
        }
    }
  } catch (e) {
    // Not a JSON string
  }

  const lowerMsg = rawMsg.toLowerCase();
  
  if (lowerMsg.includes('503') || lowerMsg.includes('unavailable') || lowerMsg.includes('high demand') || lowerMsg.includes('overloaded')) {
      return lang === 'bn' 
        ? "সার্ভারে এখন অনেক চাপ রয়েছে (High Demand)। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
        : "The server is currently experiencing high demand. Please try again later.";
  }
  
  if (lowerMsg.includes('429') || lowerMsg.includes('quota') || lowerMsg.includes('rate limit')) {
      return lang === 'bn' 
        ? "আপনার এপিআই কোটা শেষ হয়ে গেছে অথবা লিমিট অতিক্রম করেছে।"
        : "Your API quota has been exceeded or rate limit reached.";
  }
  
  if (lowerMsg.includes('400') || lowerMsg.includes('invalid argument') || lowerMsg.includes('bad request')) {
      return lang === 'bn' 
        ? "ভুল রিকোয়েস্ট বা ফাইল সাইজ/ফরম্যাট সাপোর্ট করছে না।"
        : "Bad request. The file size or format might not be supported.";
  }

  if (lowerMsg.includes('fetch') || lowerMsg.includes('network') || lowerMsg.includes('failed to fetch')) {
      return lang === 'bn'
        ? "নেটওয়ার্ক কানেকশন সমস্যা। দয়া করে আপনার ইন্টারনেট কানেকশন চেক করুন।"
        : "Network connection issue. Please check your internet connection.";
  }

  return rawMsg.length > 300 ? rawMsg.substring(0, 300) + '...' : rawMsg;
};

export const useTranscription = (
  appLang: 'en' | 'bn',
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  loadHistory: () => void,
  updateApiStats: () => void,
  playSuccessSound: () => void,
  transcriptionMode: 'normal' | 'pro'
) => {
  const state = useTranscriptionState();
  const {
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
    resetAll
  } = state;

  const processTranscription = async (providedFile?: any, providedMetadata?: any, providedAutoProcess?: any) => {
    const inputFile = (providedFile instanceof Blob) ? providedFile : file;
    const inputMetadata = (providedMetadata && !(providedMetadata instanceof Event) && typeof providedMetadata === 'object') ? providedMetadata : fileMeta;
    const isAutoProcess = typeof providedAutoProcess === 'boolean' ? providedAutoProcess : (typeof providedFile === 'boolean' ? providedFile : false);

    if (!inputFile) return;

    if (inputFile.size > 500 * 1024 * 1024) {
      addToast(appLang === 'bn' 
        ? 'ফাইল সাইজ ৫০০ এমবি এর বেশি হতে পারবে না। অনুগ্রহ করে Tools থেকে ফাইলটি Compress করে নিন।' 
        : 'File size cannot exceed 500MB. Please compress the file from Tools.', 'error');
      setStatus('idle');
      return;
    }

    setStatus('processing');
    setTranscript('');
    setProgress(0);
    setElapsedSeconds(0);
    
    const audioDurationSeconds = parseDurationToSeconds(inputMetadata?.duration);
    const estimated = calculateEstimatedSeconds(audioDurationSeconds, inputFile.size);

    console.debug(`Estimating transcription time: ${estimated}s for ${audioDurationSeconds}s audio`);
    setEstimatedSeconds(estimated);
    setCurrentStage(appLang === 'bn' ? 'অডিও সিগন্যাল ডিকোড করা হচ্ছে...' : 'Decoding audio signals...');
    
    const startTime = Date.now();
    
    const timer = setInterval(() => {
      setElapsedSeconds(s => s + 1);
      setProgress(p => {
        const newP = Math.min(p + (100 / estimated), 98);
        
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
      const checkProvider = await getActiveProvider();
      
      if (!checkProvider) {
        throw new Error("No API Key configured. Please add one in Settings.");
      }

      const ai = new GoogleGenAI({ apiKey: checkProvider.key });
      const mimeType = inputFile.type || 'audio/mp3';
      
      setCurrentStage(appLang === 'bn' ? 'ফাইল এআই সার্ভারে আপলোড করা হচ্ছে...' : 'Uploading file to AI server...');
      
      // Upload file using Gemini File API
      const uploadedFile = await ai.files.upload({ file: inputFile, config: { mimeType: mimeType } });
      
      setCurrentStage(appLang === 'bn' ? 'ফাইল প্রসেস হচ্ছে, অপেক্ষা করুন...' : 'Processing file on server, please wait...');

      // Poll until file is ready
      let getFile = await ai.files.get({ name: uploadedFile.name });
      while (getFile.state === 'PROCESSING') {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        getFile = await ai.files.get({ name: uploadedFile.name });
      }
      
      if (getFile.state === 'FAILED') {
        throw new Error("File processing failed on AI server.");
      }
      
      const systemInstruction = transcriptionMode === 'normal' 
        ? TRANSCRIPTION_SYSTEM_INSTRUCTION_NORMAL 
        : TRANSCRIPTION_SYSTEM_INSTRUCTION;

      let durationInMinutes = audioDurationSeconds / 60;
      const isLongAudio = durationInMinutes > 20;

      const modelName = checkProvider.model || 'gemini-3-flash-preview';
      let promptText = transcriptionMode === 'normal' 
        ? TRANSCRIPTION_PROMPT_TEXT_NORMAL 
        : TRANSCRIPTION_PROMPT_TEXT;

      if (modelName === 'gemini-3.1-flash-lite-preview') {
          promptText += "\n\nCRITICAL FOR THIS MODEL: Ensure every timestamp like [MM:SS] starts on a NEW LINE. Do NOT put timestamps in the middle of text. Each speaker's dialogue MUST be on a separate line. Example:\n[00:00] **Speaker 1:** Hello.\n[00:05] **Speaker 2:** Hi there.";
      }

      const { createPartFromUri } = await import('@google/genai');
      const filePart = createPartFromUri(getFile.uri, getFile.mimeType || mimeType);

      const requestOptions = {
          model: modelName, 
          contents: { 
              role: 'user',
              parts: [
                  filePart,
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
          const response = await ai.models.generateContent(requestOptions);
          fullText = removeRepetitiveBlocks(response.text || '');
          setTranscript(fullText);
      } else {
          const responseStream = await ai.models.generateContentStream(requestOptions);
          let lastUpdateTime = Date.now();
          for await (const chunk of responseStream) {
              if (chunk.text) {
                  fullText += chunk.text;
                  
                  const now = Date.now();
                  if (now - lastUpdateTime > 500) {
                      const cleanedText = removeRepetitiveBlocks(fullText);
                      if (cleanedText.length < fullText.length) {
                          fullText = cleanedText;
                          setTranscript(fullText);
                          break; 
                      }
                      setTranscript(fullText); 
                      lastUpdateTime = now;
                  }
              }
          }
          const finalCleanedText = removeRepetitiveBlocks(fullText);
          if (finalCleanedText.length < fullText.length) {
              fullText = finalCleanedText;
          }
          setTranscript(fullText);
      }
      
      // Attempt to clean up the uploaded file to save user's cloud space
      try {
        await ai.files.delete({ name: uploadedFile.name });
      } catch (err) {
        console.warn("Could not delete file from Gemini server:", err);
      }

      await incrementTotalCalls('Transcription', checkProvider.model || 'gemini-3-flash-preview', checkProvider.source);
      updateApiStats();

      if (!fullText) throw new Error("Empty response from AI");

      setStatus('completed');
      playSuccessSound(); 
      if (!isAutoProcess) {
        setShowSuccessModal(true); 
      }
      
      const fileName = (inputFile as File).name || inputMetadata.name || "audio_file";
      const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'mp3';

      const historyId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const actualElapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      setElapsedSeconds(actualElapsedSeconds);

      let bgbRemark = null;
      const isBgbAnalysisEnabled = localStorage.getItem('bgbAnalysisEnabled') === 'true';
      if (isBgbAnalysisEnabled) {
          const { getSensitiveKeywords } = await import('../utils/sensitiveKeywords');
          const { analyzeTranscriptForBgb } = await import('../services/bgbAnalysisService');
          
          const keywords = getSensitiveKeywords();
          const lower = fullText.toLowerCase();
          const matches = keywords.filter((kw: string) => lower.includes(kw.toLowerCase()));
          
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
      
      const { broadcastHistoryUpdate } = await import('./useBroadcastSync');
      broadcastHistoryUpdate();
      
      loadHistory();
      logSystemActivity('TRANSCRIPTION', 'SUCCESS', 'File Transcribed', `File: ${fileName}`);

      return { success: true, text: fullText };
    } catch (error: any) {
      console.error("Transcription Error:", error);
      setStatus('error');
      const safeMsg = formatErrorMessage(error, appLang);
      setErrorMessage(safeMsg);
      logSystemActivity('TRANSCRIPTION', 'ERROR', 'Failed', safeMsg);
      return { success: false, error: safeMsg };
    } finally {
      clearInterval(timer);
      setProgress(100);
    }
  };

  return {
    ...state,
    processTranscription
  };
};
