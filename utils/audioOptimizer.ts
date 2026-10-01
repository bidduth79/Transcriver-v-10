import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import workerURL from '@ffmpeg/ffmpeg/worker?url';
import { detectAudioMimeType, isFormatNativelySupportedByGemini } from '../hooks/transcription/transcriptionUtils';

let ffmpegInstance: FFmpeg | null = null;
let isFfmpegLoading = false;
let isFfmpegLoaded = false;

const getFfmpeg = async (onStage?: (msg: string) => void): Promise<FFmpeg | null> => {
  if (isFfmpegLoaded && ffmpegInstance) {
    return ffmpegInstance;
  }

  if (isFfmpegLoading) {
    // Wait until existing loading completes
    while (isFfmpegLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (isFfmpegLoaded && ffmpegInstance) return ffmpegInstance;
  }

  try {
    isFfmpegLoading = true;
    onStage?.('অডিও অপ্টিমাইজেশন ইঞ্জিন প্রস্তুত হচ্ছে...');
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL,
      wasmURL,
      classWorkerURL: workerURL
    });
    ffmpegInstance = ffmpeg;
    isFfmpegLoaded = true;
    return ffmpeg;
  } catch (err) {
    console.warn("Could not initialize FFmpeg in this browser session:", err);
    return null;
  } finally {
    isFfmpegLoading = false;
  }
};

export interface OptimizationResult {
  file: Blob;
  mimeType: string;
  wasOptimized: boolean;
}

/**
 * Modern Production Speech Audio Optimizer:
 * 1. Small standard audio files (<= 14MB) pass through directly with 0ms latency.
 * 2. Large audio files (> 14MB) or video files (e.g. .mp4, .mov, .mkv) are automatically
 *    converted into speech-optimized 16kHz mono 32kbps MP3 audio.
 *    This shrinks a 50MB video/audio down to ~3MB-5MB, preventing browser crashes,
 *    eliminating Gemini 20MB payload limits, and speeding up transcription dramatically.
 */
export const optimizeMediaForSpeech = async (
  inputBlob: Blob,
  fileName: string = 'media_file',
  lang: 'bn' | 'en' = 'bn',
  onStageUpdate?: (stage: string) => void
): Promise<OptimizationResult> => {
  const sniff = await detectAudioMimeType(inputBlob, fileName);
  const lowerName = fileName.toLowerCase();
  const isVideo = sniff.mimeType.startsWith('video/') || 
    lowerName.endsWith('.mp4') || 
    lowerName.endsWith('.mkv') || 
    lowerName.endsWith('.mov') || 
    lowerName.endsWith('.avi') || 
    lowerName.endsWith('.wmv');

  const MAX_SAFE_INLINE_SIZE = 14 * 1024 * 1024; // 14 MB

  // If it's already an audio file and within the safe 14MB limit, pass through instantly!
  if (!isVideo && isFormatNativelySupportedByGemini(sniff.mimeType) && inputBlob.size <= MAX_SAFE_INLINE_SIZE) {
    return {
      file: inputBlob,
      mimeType: sniff.mimeType,
      wasOptimized: false
    };
  }

  // CRITICAL BROWSER MEMORY PROTECTION:
  // If the file is larger than 20MB, do NOT load it into browser WebAssembly memory.
  // Decoding large 20MB+ files in WebAssembly exceeds tab memory limits and crashes the Chromium renderer ("Aw, Snap" / dead face).
  // Large files are uploaded directly to Gemini Files API (ai.files.upload) which supports up to 2GB natively in Google Cloud.
  if (inputBlob.size > 20 * 1024 * 1024) {
    return {
      file: inputBlob,
      mimeType: sniff.mimeType,
      wasOptimized: false
    };
  }

  // If file is between 14MB and 20MB or a small video, compress and extract audio with FFmpeg
  onStageUpdate?.(
    lang === 'bn' 
      ? 'বড় ফাইলকে এআই স্পিচ ফরম্যাটে অপ্টিমাইজ ও কম্প্রেস করা হচ্ছে...' 
      : 'Optimizing and compressing media to speech audio...'
  );

  try {
    const ffmpeg = await getFfmpeg(onStageUpdate);
    if (!ffmpeg) {
      console.warn("FFmpeg unavailable, falling back to original file");
      return { file: inputBlob, mimeType: sniff.mimeType, wasOptimized: false };
    }

    const cleanInputName = `input_${Date.now()}_` + fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const cleanOutputName = `optimized_${Date.now()}.mp3`;

    // Write input into FFmpeg virtual file system
    await ffmpeg.writeFile(cleanInputName, await fetchFile(inputBlob));

    onStageUpdate?.(
      lang === 'bn' 
        ? 'স্পিচ চ্যানেল এক্সট্র্যাক্ট ও ১৬kHz মনো কম্প্রেশন চলছে...' 
        : 'Extracting speech channel & 16kHz mono compression...'
    );

    // Modern speech optimization parameters:
    // -vn: Strip all video tracks (saves 90%+ size immediately)
    // -ac 1: Downmix to mono (speech is 100% voice clarity in mono)
    // -ar 16000: Optimal speech recognition sample rate
    // -b:a 32k: 32kbps mono MP3 (1 hour of audio = only ~14.4MB!)
    await ffmpeg.exec([
      '-i', cleanInputName,
      '-vn',
      '-ac', '1',
      '-ar', '16000',
      '-b:a', '32k',
      cleanOutputName
    ]);

    const data = await ffmpeg.readFile(cleanOutputName);

    // Clean up temporary files in virtual memory
    try {
      await ffmpeg.deleteFile(cleanInputName);
      await ffmpeg.deleteFile(cleanOutputName);
    } catch (cleanupErr) {
      // Ignore cleanup error
    }

    const rawBuffer = (data as Uint8Array).buffer;
    const arrayBuffer = rawBuffer instanceof ArrayBuffer ? rawBuffer : (rawBuffer as any).slice(0);
    const optimizedBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });

    if (optimizedBlob.size > 100) {
      console.log(`Media optimized from ${(inputBlob.size / 1024 / 1024).toFixed(2)} MB to ${(optimizedBlob.size / 1024 / 1024).toFixed(2)} MB`);
      return {
        file: optimizedBlob,
        mimeType: 'audio/mp3',
        wasOptimized: true
      };
    }
  } catch (optErr) {
    console.warn("Speech optimization encountered an error, falling back to original file:", optErr);
  }

  // Graceful fallback
  return {
    file: inputBlob,
    mimeType: sniff.mimeType,
    wasOptimized: false
  };
};
