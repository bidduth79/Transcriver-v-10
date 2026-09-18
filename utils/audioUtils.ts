import { HistoryItem, FileMeta, TranscriptMeta, AudioData } from '../types';

export const loadAudioFromStore = async (
  item: Partial<HistoryItem> & { videoId?: string },
  setFile: (file: File) => void,
  setFileMeta: (meta: FileMeta) => void,
  setFileUrl: (url: string) => void,
  setTranscriptMeta: (meta: TranscriptMeta | null) => void,
  fileUrlRef?: string // Pass current fileUrl to revoke
) => {
  try {
    const { getFromStore, addToStore } = await import('../services/db');
    
    // Update history opened state if needed
    if (!item.hasBeenOpened && item.transcript) { // only for history items, youtube items might not have hasBeenOpened
      const updatedItem = { ...item, hasBeenOpened: true };
      await addToStore('studio_history', updatedItem);
    }
    
    // Use item.id for history, or item.videoId for youtube monitor
    const idToFetch = item.videoId || item.id;
    if (!idToFetch) return;

    const audioData: AudioData = await getFromStore('youtube_audio', idToFetch) as AudioData;
    
    if (audioData && audioData.base64) {
      let mimeType = 'audio/mp3';
      const ext = (audioData.format || 'mp3').toLowerCase();
      if (ext === 'm4a') mimeType = 'audio/mp4';
      else if (ext === 'wav') mimeType = 'audio/wav';
      else if (ext === 'opus' || ext === 'ogg') mimeType = 'audio/ogg';
      else if (ext === 'webm') mimeType = 'video/webm';
      else if (ext === 'mp4') mimeType = 'video/mp4';
      else if (ext === 'aac') mimeType = 'audio/aac';

      const dataUrl = `data:${mimeType};base64,${audioData.base64}`;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      // Free memory early
      audioData.base64 = undefined;
      
      const fileName = item.fileName || item.title || 'audio';
      const fileObj = new File([blob], fileName, { type: mimeType });
      
      setFile(fileObj);
      setFileMeta({ 
        name: fileName, 
        duration: item.duration || '0:00', 
        type: mimeType, 
        size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB', 
        date: new Date().toISOString() 
      });
      
      if (fileUrlRef) {
        URL.revokeObjectURL(fileUrlRef);
      }
      setFileUrl(URL.createObjectURL(fileObj));
      
      // Clear transcript meta so it falls back to fileMeta and isSynced becomes true
      setTranscriptMeta(null); 
    }
  } catch (e) {
    console.error("Failed to load audio for item", e);
  }
};

export const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = now + (i * 0.08);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
        osc.start(startTime);
        osc.stop(startTime + 0.8);
    });
  } catch (e) {
    console.error("Failed to play notification sound:", e);
  }
};
