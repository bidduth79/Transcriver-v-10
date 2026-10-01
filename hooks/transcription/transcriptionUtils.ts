export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    let reader: FileReader | null = new FileReader();
    reader.onloadend = () => {
      if (!reader) {
        reject(new Error("Reader was null"));
        return;
      }
      const result = reader.result as string;
      if (!result) {
        reject(new Error("Failed to convert audio blob to base64"));
        reader = null;
        return;
      }
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      
      // Aggressive cleanup
      reader.onloadend = null;
      reader.onerror = null;
      reader = null;
      
      resolve(base64);
    };
    reader.onerror = (e) => {
      if (reader) {
        reader.onloadend = null;
        reader.onerror = null;
        reader = null;
      }
      reject(e);
    };
    reader.readAsDataURL(blob);
  });
};

export const removeRepetitiveBlocks = (text: string): string => {
    if (!text || text.length < 500) return text;
    
    const checkStartIndex = text.length > 4000 ? text.length - 3000 : 0;
    const prefix = text.length > 4000 ? text.substring(0, checkStartIndex) : '';
    const textToCheck = text.length > 4000 ? text.substring(checkStartIndex) : text;
  
    const lines = textToCheck.split('\n');
    const cleanedLines: string[] = [];
    const recentLines: string[] = [];
    const MAX_HISTORY = 30;
    let loopDetected = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.length <= 25) {
            cleanedLines.push(lines[i]);
            continue;
        }
  
        const contentWithoutTimeAndSpeaker = line.replace(/^\[\d{1,2}:\d{2}(:\d{2})?\]\s*(\*\*.*?\*\*\s*)?/, '').trim();
        
        if (contentWithoutTimeAndSpeaker.length > 25) {
            const occurrences = recentLines.filter(l => l === contentWithoutTimeAndSpeaker).length;
            if (occurrences >= 4) {
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
    
    if (!loopDetected) return text;
    return prefix + cleanedLines.join('\n');
  };
  
export const isFormatNativelySupportedByGemini = (mimeType: string): boolean => {
  if (!mimeType) return false;
  const lower = mimeType.toLowerCase();
  const supported = [
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/m4a',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/flac'
  ];
  return supported.some(s => lower.startsWith(s));
};

export const calculateEstimatedSeconds = (audioDurationSeconds: number, inputFileSize: number) => {
    let estimated = 12;
    if (audioDurationSeconds > 0) {
        estimated = Math.max(8, Math.floor(6 + audioDurationSeconds * 0.06));
    } else {
        const sizeMB = inputFileSize / (1024 * 1024);
        estimated = Math.max(10, Math.floor(sizeMB * 3));
    }
    return estimated;
};

export const parseDurationToSeconds = (durationStr: string | undefined): number => {
    let audioDurationSeconds = 0;
    if (durationStr && typeof durationStr === 'string') {
        const parts = durationStr.split(':').map(Number);
        if (parts.length === 2) {
            audioDurationSeconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            audioDurationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
    }
    return audioDurationSeconds;
};

export interface AudioSniffResult {
  mimeType: string;
  isOggOpus: boolean;
  isWhatsApp: boolean;
}

/**
 * Sniffs the real MIME type from file header magic bytes, extension, and common app patterns (e.g. WhatsApp).
 */
export const detectAudioMimeType = async (file: Blob, fileName: string = ''): Promise<AudioSniffResult> => {
  let isOggOpus = false;
  let isWhatsApp = false;
  const lowerName = fileName.toLowerCase();

  if (
    lowerName.includes('whatsapp') || 
    lowerName.includes('ptt-') || 
    lowerName.includes('audio 202') ||
    lowerName.includes('voice')
  ) {
    isWhatsApp = true;
  }

  try {
    const slice = file.slice(0, 64);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Ogg container: "OggS" (0x4F, 0x67, 0x67, 0x53) - used by WhatsApp Opus voice notes
    if (bytes.length >= 4 && bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
      isOggOpus = true;
      return { mimeType: 'audio/ogg', isOggOpus: true, isWhatsApp };
    }

    // MP3 with ID3: "ID3" (0x49, 0x44, 0x33)
    if (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      return { mimeType: 'audio/mp3', isOggOpus: false, isWhatsApp };
    }

    // MP3 without ID3 header: MPEG frame sync (0xFF followed by 0xFB, 0xF3, 0xF2)
    if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
      return { mimeType: 'audio/mp3', isOggOpus: false, isWhatsApp };
    }

    // RIFF WAV: "RIFF" .... "WAVE"
    if (
      bytes.length >= 12 && 
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45
    ) {
      return { mimeType: 'audio/wav', isOggOpus: false, isWhatsApp };
    }

    // MP4 / M4A: "ftyp" at offset 4
    if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      if (lowerName.endsWith('.mp4') || lowerName.endsWith('.mkv') || lowerName.endsWith('.mov') || lowerName.endsWith('.avi') || (file.type && file.type.startsWith('video/'))) {
        return { mimeType: 'video/mp4', isOggOpus: false, isWhatsApp: false };
      }
      return { mimeType: 'audio/mp4', isOggOpus: false, isWhatsApp: false };
    }

    // WebM / Matroska: 0x1A, 0x45, 0xDF, 0xA3
    if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
      const isVideo = lowerName.endsWith('.webm') && (file.type?.startsWith('video/') || !lowerName.includes('audio'));
      return { mimeType: isVideo ? 'video/webm' : 'audio/webm', isOggOpus: false, isWhatsApp: false };
    }

    // FLAC: "fLaC" (0x66, 0x4C, 0x61, 0x43)
    if (bytes.length >= 4 && bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
      return { mimeType: 'audio/flac', isOggOpus: false, isWhatsApp: false };
    }

    // AAC (ADTS frame sync: 0xFFF)
    if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] === 0xf1 || bytes[1] === 0xf9)) {
      return { mimeType: 'audio/aac', isOggOpus: false, isWhatsApp: false };
    }
  } catch (e) {
    console.warn("MIME sniffing failed:", e);
  }

  // Fallback to filename extensions
  if (lowerName.endsWith('.opus')) return { mimeType: 'audio/ogg', isOggOpus: true, isWhatsApp: false };
  if (lowerName.endsWith('.ogg')) return { mimeType: 'audio/ogg', isOggOpus: true, isWhatsApp: false };
  if (lowerName.endsWith('.m4a')) return { mimeType: 'audio/mp4', isOggOpus: false, isWhatsApp: false };
  if (lowerName.endsWith('.mp4')) return { mimeType: 'video/mp4', isOggOpus: false, isWhatsApp: false };
  if (lowerName.endsWith('.mov')) return { mimeType: 'video/quicktime', isOggOpus: false, isWhatsApp: false };
  if (lowerName.endsWith('.mkv')) return { mimeType: 'video/x-matroska', isOggOpus: false, isWhatsApp: false };
  if (lowerName.endsWith('.avi')) return { mimeType: 'video/x-msvideo', isOggOpus: false, isWhatsApp: false };
  if (lowerName.endsWith('.aac')) return { mimeType: 'audio/aac', isOggOpus: false, isWhatsApp: false };
  if (lowerName.endsWith('.wav')) return { mimeType: 'audio/wav', isOggOpus: false, isWhatsApp: false };
  if (lowerName.endsWith('.mp3')) return { mimeType: 'audio/mp3', isOggOpus: false, isWhatsApp: false };
  if (lowerName.endsWith('.flac')) return { mimeType: 'audio/flac', isOggOpus: false, isWhatsApp: false };
  if (lowerName.endsWith('.webm')) {
    const isVideo = file.type?.startsWith('video/') || lowerName.includes('video');
    return { mimeType: isVideo ? 'video/webm' : 'audio/webm', isOggOpus: false, isWhatsApp: false };
  }

  // Fallback to file.type if provided and not generic
  if (file.type && file.type !== 'application/octet-stream') {
    const isOpus = file.type.includes('ogg') || file.type.includes('opus');
    return { mimeType: file.type, isOggOpus: isOpus, isWhatsApp };
  }

  // If filename indicates WhatsApp voice note without extension, it is Ogg Opus
  if (isWhatsApp) {
    return { mimeType: 'audio/ogg', isOggOpus: true, isWhatsApp: true };
  }

  return { mimeType: 'audio/mp3', isOggOpus: false, isWhatsApp: false };
};

/**
 * Calculates the Root Mean Square (RMS) volume level of an AudioBuffer to detect if audible speech is present.
 */
export const calculateAudioRMS = (audioBuffer: AudioBuffer): number => {
  let totalSquare = 0;
  let totalSamples = 0;
  const step = Math.max(1, Math.floor(audioBuffer.length / 80000));
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    const data = audioBuffer.getChannelData(c);
    for (let i = 0; i < data.length; i += step) {
      totalSquare += data[i] * data[i];
      totalSamples++;
    }
  }
  return totalSamples > 0 ? Math.sqrt(totalSquare / totalSamples) : 0;
};

/**
 * Encodes an AudioBuffer into standard 16kHz mono 16-bit PCM WAV with dynamic speech normalization/gain.
 * This format is universally decoded by Google Speech & Gemini AI models without demuxing issues.
 */
export const audioBufferToWavBlob = (audioBuffer: AudioBuffer, targetSampleRate: number = 16000): Blob => {
  const sampleRate = targetSampleRate;
  const numChannels = 1;
  const sourceSampleRate = audioBuffer.sampleRate;
  const sourceData = audioBuffer.getChannelData(0);

  // Downmix stereo/multichannel to mono for speech transcription
  let monoData: Float32Array;
  if (audioBuffer.numberOfChannels > 1) {
    monoData = new Float32Array(audioBuffer.length);
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const channel = audioBuffer.getChannelData(c);
      for (let i = 0; i < audioBuffer.length; i++) {
        monoData[i] += channel[i] / audioBuffer.numberOfChannels;
      }
    }
  } else {
    monoData = sourceData;
  }

  // Resample if sourceSampleRate differs from target sampleRate
  let samples: Float32Array;
  if (sourceSampleRate === sampleRate) {
    samples = new Float32Array(monoData);
  } else {
    const ratio = sourceSampleRate / sampleRate;
    const newLength = Math.max(1, Math.round(monoData.length / ratio));
    samples = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const pos = i * ratio;
      const index = Math.floor(pos);
      const frac = pos - index;
      const nextIndex = Math.min(index + 1, monoData.length - 1);
      samples[i] = monoData[index] * (1 - frac) + monoData[nextIndex] * frac;
    }
  }

  // Speech peak normalization: boost quiet recordings, WhatsApp voice notes, and phone audio
  let maxAbs = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAbs) maxAbs = abs;
  }

  // If the audio is quiet, apply intelligent gain up to 10x (targeting ~0.85 peak) without clipping
  let gain = 1.0;
  if (maxAbs > 0.0001 && maxAbs < 0.75) {
    gain = Math.min(10.0, 0.85 / maxAbs);
  }

  // 16-bit PCM WAV file header (44 bytes)
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (v: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // Mono (1)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples with gain applied
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] * gain));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * Safely decodes audio format and resamples to 16kHz mono 16-bit PCM WAV.
 * Strictly guarded against browser memory overflow and renderer crashes.
 */
export const convertAudioToWav = async (
  file: Blob,
  targetSampleRate: number = 16000
): Promise<{ wavBlob: Blob; rms: number; duration: number } | null> => {
  // Prevent in-browser decode on large files (>1MB) to protect against Chrome "Aw, Snap!" OOM crashes
  // A 54-minute Opus file is only 7MB, but decoding it allocates 1.25GB of uncompressed PCM in RAM!
  if (file.size > 1 * 1024 * 1024) {
    console.warn("File too large for client-side WAV conversion (>1MB), sending in native format");
    return null;
  }

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const duration = audioBuffer.duration;

    // Prevent rendering audio longer than 3 minutes in browser memory
    if (duration > 180) {
      console.warn("Audio duration too long for client-side conversion (>3m), sending in native format");
      return null;
    }

    const rms = calculateAudioRMS(audioBuffer);
    // Direct, lightweight software resampling without native OfflineAudioContext crashes
    const wavBlob = audioBufferToWavBlob(audioBuffer, targetSampleRate);
    return { wavBlob, rms, duration };
  } catch (err) {
    console.warn("In-browser audio decoding to WAV was not possible:", err);
    return null;
  } finally {
    if (ctx && ctx.state !== 'closed') {
      try {
        await ctx.close();
      } catch (e) {
        // Ignore context close error
      }
    }
  }
};

