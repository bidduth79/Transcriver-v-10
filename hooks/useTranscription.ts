import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getActiveProvider, incrementTotalCalls } from '../services/ApiKeyManager';

import { addToStore, STORES } from '../services/db';
import { logSystemActivity } from '../services/SystemLogger';
import { TRANSCRIPTION_SYSTEM_INSTRUCTION, TRANSCRIPTION_PROMPT_TEXT, TRANSCRIPTION_SYSTEM_INSTRUCTION_NORMAL, TRANSCRIPTION_PROMPT_TEXT_NORMAL } from '../constants/instructions';
import { useTranscriptionState } from './transcription/useTranscriptionState';
import { 
  removeRepetitiveBlocks, 
  calculateEstimatedSeconds, 
  parseDurationToSeconds,
  detectAudioMimeType,
  convertAudioToWav,
  blobToBase64,
  isFormatNativelySupportedByGemini
} from './transcription/transcriptionUtils';

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

      const currentFileName = inputMetadata?.name || (inputFile as File).name || 'audio_file';
      // Bypass strict MIME type checking for better Opus support (fallback to audio/webm)
      const effectiveMimeType = inputFile.type || 'audio/webm';
      const effectiveFile: Blob = inputFile;

      let audioPart: any;
      let uploadedFile: any = null;

      const isOpusFile = currentFileName.toLowerCase().endsWith('.opus') || effectiveMimeType.includes('ogg') || effectiveMimeType.includes('opus');

      // Completely bypass Files API and always use Base64 inlineData as per legacy app
      setCurrentStage(appLang === 'bn' ? 'অডিও ডেটা প্রস্তুত করা হচ্ছে...' : 'Preparing audio for AI...');
      const base64Data = await blobToBase64(effectiveFile);
      audioPart = {
        inlineData: {
          mimeType: effectiveMimeType,
          data: base64Data
        }
      };
      
      const systemInstruction = transcriptionMode === 'normal' 
        ? TRANSCRIPTION_SYSTEM_INSTRUCTION_NORMAL 
        : TRANSCRIPTION_SYSTEM_INSTRUCTION;

      let durationInMinutes = audioDurationSeconds / 60;
      // Removed isLongFile reference since Files API is completely bypassed
      const isLongAudio = durationInMinutes > 15 || inputFile.size > 15 * 1024 * 1024;

      const modelName = checkProvider.model || 'gemini-3-flash-preview';
      let promptText = transcriptionMode === 'normal' 
        ? TRANSCRIPTION_PROMPT_TEXT_NORMAL 
        : TRANSCRIPTION_PROMPT_TEXT;

      if (modelName === 'gemini-3.1-flash-lite-preview') {
          promptText += "\n\nCRITICAL FOR THIS MODEL: Ensure every timestamp like [MM:SS] starts on a NEW LINE. Do NOT put timestamps in the middle of text. Each speaker's dialogue MUST be on a separate line. Example:\n[00:00] **Speaker 1:** Hello.\n[00:05] **Speaker 2:** Hi there.";
      }

      // Reverting to sending system instruction properly in config for better adherence
      const requestOptions = {
          model: modelName, 
          contents: [
              {
                  role: 'user',
                  parts: [
                      audioPart,
                      { text: promptText }
                  ]
              }
          ],
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

      const extractText = (resp: any): string => {
        if (!resp) return '';
        if (typeof resp.text === 'string' && resp.text.trim()) {
          return resp.text;
        }
        if (Array.isArray(resp.candidates) && resp.candidates.length > 0) {
          const candidate = resp.candidates[0];
          if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
            let extracted = '';
            for (const part of candidate.content.parts) {
              if (part?.text && !part.thought) {
                extracted += part.text;
              }
            }
            if (extracted.trim()) return extracted;
            for (const part of candidate.content.parts) {
              if (part?.text) {
                extracted += part.text;
              }
            }
            if (extracted.trim()) return extracted;
          }
        }
        return '';
      };

      let fullText = '';
      let lastResultObj: any = null;

      setCurrentStage(appLang === 'bn' ? 'এআই সার্ভারে সম্পূর্ণ অডিও বিশ্লেষণ ও ট্রান্সক্রাইব করা হচ্ছে...' : 'Transcribing media on AI server...');
      
      try {
          const response = await ai.models.generateContent(requestOptions);
          lastResultObj = response;
          fullText = extractText(response);
      } catch (err) {
          console.error("Transcription generation failed:", err);
          throw err;
      } finally {
          // CRITICAL: Release the massive base64 audio data from memory immediately
          // A 10MB opus file creates ~13MB of base64 string that stays in RAM
          // until this function ends. Without this cleanup, post-transcription 
          // processing (history save, BGB analysis, loadHistory) causes OOM crash.
          if (audioPart?.inlineData) {
              audioPart.inlineData.data = '';
              audioPart.inlineData = null;
          }
          audioPart = null;
          requestOptions.contents = [];
      }

      const finalCleanedText = removeRepetitiveBlocks(fullText);
      if (finalCleanedText.length < fullText.length) {
          fullText = finalCleanedText;
      }
      
      setTranscript(fullText);
      
      // Clean up uploaded file if large file upload path was used
      if (uploadedFile?.name) {
        try {
          await ai.files.delete({ name: uploadedFile.name });
        } catch (err) {
          console.warn("Could not delete file from Gemini server:", err);
        }
      }

      // Note: Extra audio WAV conversion recovery was removed as per user request
      // because it does not work correctly for this user's specific .opus files.


      await incrementTotalCalls('Transcription', modelName, checkProvider.source);
      updateApiStats();

      if (!fullText.trim()) {
        const candidate = lastResultObj?.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (finishReason === 'SAFETY') {
          throw new Error(appLang === 'bn' 
            ? 'এআই নিরাপত্তা নীতিমালার কারণে এই অডিওটির ট্রান্সক্রিপশন সম্পন্ন করা সম্ভব হয়নি।' 
            : 'Transcription was blocked by AI safety policy.');
        } else if (finishReason === 'RECITATION') {
          throw new Error(appLang === 'bn'
            ? 'কপিরাইট/রিসিটেশন বিধিনিষেধের কারণে ট্রান্সক্রিপশন ফিল্টার করা হয়েছে।'
            : 'Transcription was blocked due to copyright or recitation policies.');
        } else if (finishReason === 'MAX_TOKENS') {
          throw new Error(appLang === 'bn'
            ? 'টোকেন লিমিট পূর্ণ হয়ে গেছে। অনুগ্রহ করে অডিও ফাইলটি ছোট করে পুনরায় চেষ্টা করুন।'
            : 'Token limit reached. Please use a shorter audio clip.');
        } else {
          // If no speech was spoken in the audio file
          fullText = appLang === 'bn' 
            ? '[কোনো কথা বা কণ্ঠস্বর সনাক্ত করা যায়নি / No audible speech detected]' 
            : '[No audible speech detected in audio file]';
          setTranscript(fullText);
        }
      }

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
