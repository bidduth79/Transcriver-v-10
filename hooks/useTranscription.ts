import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getActiveProvider, incrementTotalCalls } from '../services/ApiKeyManager';
import { fileToBase64 } from '../utils/fileUtils';
import { addToStore, STORES } from '../services/db';
import { logSystemActivity } from '../services/SystemLogger';
import { TRANSCRIPTION_SYSTEM_INSTRUCTION, TRANSCRIPTION_PROMPT_TEXT, TRANSCRIPTION_SYSTEM_INSTRUCTION_NORMAL, TRANSCRIPTION_PROMPT_TEXT_NORMAL } from '../constants/instructions';
import { useTranscriptionState } from './transcription/useTranscriptionState';
import { removeRepetitiveBlocks, calculateEstimatedSeconds, parseDurationToSeconds } from './transcription/transcriptionUtils';

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

  const processTranscription = async (inputFile = file, inputMetadata = fileMeta, isAutoProcess = false) => {
    if (!inputFile) return;

    if (inputFile.size > 70 * 1024 * 1024) {
      addToast(appLang === 'bn' 
        ? 'ফাইল সাইজ ৭০ এমবি এর বেশি হতে পারবে না। মেমোরি ক্র্যাশ এড়াতে অনুগ্রহ করে Tools থেকে ফাইলটি Compress করে নিন।' 
        : 'File size cannot exceed 70MB to prevent memory crash. Please compress the file from Tools.', 'error');
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
      const base64Data = await fileToBase64(inputFile);
      const checkProvider = await getActiveProvider();
      
      if (!checkProvider) {
        throw new Error("No API Key configured. Please add one in Settings.");
      }

      const ai = new GoogleGenAI({ apiKey: checkProvider.key });
      const mimeType = inputFile.type || 'audio/mp3';
      
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

  return {
    ...state,
    processTranscription
  };
};
