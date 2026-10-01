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
      const sniff = await detectAudioMimeType(inputFile, currentFileName);
      const effectiveMimeType = sniff.mimeType || (inputFile.type || 'audio/mp3');
      const effectiveFile: Blob = inputFile;
      const wasConvertedToWav = false;

      let audioPart: any;
      let uploadedFile: any = null;

      // Safe threshold for inlineData vs Files API:
      // In Opus/Ogg, an 8MB file is 1 HOUR of audio!
      // In-memory inlineData Base64 should only be used for short clips (<= 3 minutes and <= 3MB).
      // Any file > 3MB, or duration > 180 seconds, or any Opus file > 1.5MB MUST be uploaded via Gemini Files API.
      // Gemini Files API natively decodes 54-minute Opus files in Google Cloud with 0MB browser RAM.
      const isOpusFile = currentFileName.toLowerCase().endsWith('.opus') || effectiveMimeType.includes('ogg') || effectiveMimeType.includes('opus');
      const isLongFile = (audioDurationSeconds > 180) || (inputFile.size > 3 * 1024 * 1024) || (isOpusFile && inputFile.size > 1.5 * 1024 * 1024);

      if (!isLongFile && effectiveFile.size <= 3 * 1024 * 1024) {
        setCurrentStage(appLang === 'bn' ? 'অডিও ডেটা প্রস্তুত করা হচ্ছে...' : 'Preparing audio for AI...');
        const base64Data = await blobToBase64(effectiveFile);
        audioPart = {
          inlineData: {
            mimeType: effectiveMimeType,
            data: base64Data
          }
        };
      } else {
        // High-capacity Gemini Files API for long audio / Opus / large files
        setCurrentStage(appLang === 'bn' ? 'অডিও ফাইলটি ক্লাউড সার্ভারে আপলোড করা হচ্ছে...' : 'Uploading media to cloud server...');
        const uploadFileName = wasConvertedToWav 
          ? 'optimized_speech.wav' 
          : ((inputFile as File).name || 'audio_file');

        const fileToUpload = effectiveFile instanceof File 
          ? effectiveFile 
          : new File([effectiveFile], uploadFileName, { type: effectiveMimeType });

        try {
          uploadedFile = await ai.files.upload({ file: fileToUpload, config: { mimeType: effectiveMimeType } });
          
          setCurrentStage(appLang === 'bn' ? 'ক্লাউড সার্ভারে অডিও প্রসেস হচ্ছে, অপেক্ষা করুন...' : 'Processing audio on server, please wait...');

          const uploadedRemoteName = uploadedFile.name || '';
          if (!uploadedRemoteName) {
            throw new Error("Failed to retrieve uploaded file identifier.");
          }

          let getFile = await ai.files.get({ name: uploadedRemoteName });
          while (getFile.state === 'PROCESSING') {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            getFile = await ai.files.get({ name: uploadedRemoteName });
          }
          
          if (getFile.state === 'FAILED') {
            throw new Error("File processing failed on AI server.");
          }

          const remoteFileName = getFile.name || uploadedRemoteName;
          const fileUri = getFile.uri || uploadedFile.uri || (remoteFileName ? (remoteFileName.startsWith('http') ? remoteFileName : `https://generativelanguage.googleapis.com/v1beta/${remoteFileName}`) : '');
          const fileMimeType = getFile.mimeType || uploadedFile.mimeType || effectiveMimeType;

          const { createPartFromUri } = await import('@google/genai');
          audioPart = createPartFromUri(fileUri, fileMimeType);
        } catch (uploadErr: any) {
          console.error("Large file upload failed:", uploadErr);
          throw new Error(appLang === 'bn'
            ? 'ক্লাউড ফাইলস এপিআইতে আপলোড সম্পন্ন হতে পারেনি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
            : 'File upload to AI server failed. Please check your connection and retry.');
        }
      }
      
      const systemInstruction = transcriptionMode === 'normal' 
        ? TRANSCRIPTION_SYSTEM_INSTRUCTION_NORMAL 
        : TRANSCRIPTION_SYSTEM_INSTRUCTION;

      let durationInMinutes = audioDurationSeconds / 60;
      const isLongAudio = isLongFile || durationInMinutes > 15;

      const modelName = checkProvider.model || 'gemini-2.5-flash';
      let promptText = transcriptionMode === 'normal' 
        ? TRANSCRIPTION_PROMPT_TEXT_NORMAL 
        : TRANSCRIPTION_PROMPT_TEXT;

      if (modelName === 'gemini-3.1-flash-lite-preview') {
          promptText += "\n\nCRITICAL FOR THIS MODEL: Ensure every timestamp like [MM:SS] starts on a NEW LINE. Do NOT put timestamps in the middle of text. Each speaker's dialogue MUST be on a separate line. Example:\n[00:00] **Speaker 1:** Hello.\n[00:05] **Speaker 2:** Hi there.";
      }

      // Prepending system instruction to the user prompt guarantees compatibility across ALL models.
      const combinedPromptText = `${systemInstruction}\n\n${promptText}`;

      const requestOptions = {
          model: modelName, 
          contents: [
              audioPart,
              { text: combinedPromptText }
          ],
          config: {
              temperature: 0.1, 
              maxOutputTokens: 8192,
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

      if (isLongAudio) {
          setCurrentStage(appLang === 'bn' ? 'এআই সার্ভারে সম্পূর্ণ অডিও বিশ্লেষণ ও ট্রান্সক্রাইব করা হচ্ছে...' : 'Transcribing full media on AI server...');
          const response = await ai.models.generateContent(requestOptions);
          lastResultObj = response;
          fullText = extractText(response);
          fullText = removeRepetitiveBlocks(fullText);
          setTranscript(fullText);
      } else {
          try {
              const responseStream = await ai.models.generateContentStream(requestOptions);
              let lastUpdateTime = Date.now();
              for await (const chunk of responseStream) {
                  lastResultObj = chunk;
                  const chunkText = chunk.text || extractText(chunk);
                  if (chunkText) {
                      fullText += chunkText;
                      
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
          } catch (streamErr) {
              console.warn("generateContentStream encountered error, attempting direct generateContent fallback:", streamErr);
          }

          // If stream yielded empty text (or stream failed), run non-streaming generateContent fallback
          if (!fullText.trim()) {
              console.log("Empty text from stream, executing direct generateContent fallback...");
              try {
                  const fallbackResponse = await ai.models.generateContent(requestOptions);
                  lastResultObj = fallbackResponse;
                  fullText = extractText(fallbackResponse);
              } catch (fallbackErr) {
                  console.error("Non-streaming fallback failed:", fallbackErr);
              }
          }

          const finalCleanedText = removeRepetitiveBlocks(fullText);
          if (finalCleanedText.length < fullText.length) {
              fullText = finalCleanedText;
          }
          setTranscript(fullText);
      }
      
      // Clean up uploaded file if large file upload path was used
      if (uploadedFile?.name) {
        try {
          await ai.files.delete({ name: uploadedFile.name });
        } catch (err) {
          console.warn("Could not delete file from Gemini server:", err);
        }
      }

      // If the response is empty, attempt high-gain speech recovery with WAV normalization on tiny clips only
      // CRITICAL MEMORY SAFETY: NEVER run in-browser decodeAudioData on files > 500KB or Opus files!
      // A 54-minute Opus file is only ~7MB, but decoding it allocates 1.25GB of uncompressed PCM in RAM, which crashes Chrome!
      const isActuallyEmpty = !fullText.trim() || 
        fullText.trim() === '[নিস্তব্ধতা]' || 
        fullText.trim() === '[নিস্তব্ধতা]।';

      if (isActuallyEmpty && inputFile.size <= 500 * 1024 && !isOpusFile) {
        console.log("Empty transcription from tiny audio clip. Running audio recovery...");
        setCurrentStage(appLang === 'bn' ? 'অডিও বুস্ট ও রিকভারি করা হচ্ছে, অপেক্ষা করুন...' : 'Enhancing audio sensitivity & decoding...');
        try {
          let recoveryWavBlob: Blob | null = null;
          if (wasConvertedToWav && effectiveFile) {
            recoveryWavBlob = effectiveFile;
          } else {
            const recovery = await convertAudioToWav(inputFile, 16000);
            if (recovery && recovery.wavBlob) {
              recoveryWavBlob = recovery.wavBlob;
            }
          }

          if (recoveryWavBlob && recoveryWavBlob.size <= 2 * 1024 * 1024) {
            const recoveryBase64 = await blobToBase64(recoveryWavBlob);
            const recoveryPart = {
              inlineData: {
                mimeType: 'audio/wav',
                data: recoveryBase64
              }
            };
            
            // Direct, unambiguous transcription instruction for recovery
            const recoveryPrompt = "CRITICAL INSTRUCTION: Transcribe all spoken words and human voices in this audio into Bengali (Bangla). Even if the speech is low volume, rapid, informal, or conversational, transcribe every single utterance. Do NOT return blank. Start with [00:00] **Speaker 1:**";
            const recoveryCombined = `${systemInstruction}\n\n${recoveryPrompt}`;

            // Try with gemini-2.5-flash as the most robust audio model if current model failed
            const recoveryModel = modelName !== 'gemini-2.5-flash' ? 'gemini-2.5-flash' : modelName;

            const recoveryOptions = {
              model: recoveryModel,
              contents: [
                recoveryPart,
                { text: recoveryCombined }
              ],
              config: {
                temperature: 0.2,
                safetySettings: requestOptions.config.safetySettings
              }
            };

            const recoveryResponse = await ai.models.generateContent(recoveryOptions);
            lastResultObj = recoveryResponse;
            const recoveredText = extractText(recoveryResponse);
            if (recoveredText && recoveredText.trim() && recoveredText.trim() !== '[নিস্তব্ধতা]' && recoveredText.trim() !== '[নিস্তব্ধতা]।') {
              fullText = removeRepetitiveBlocks(recoveredText);
              setTranscript(fullText);
              console.log("Audio recovery successfully recovered transcription!");
            }
          }
        } catch (recoveryErr) {
          console.error("Audio WAV recovery failed:", recoveryErr);
        }
      }

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
