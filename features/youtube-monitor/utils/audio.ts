let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

function playTone(frequency: number, type: OscillatorType, duration: number, startTimeOffset: number) {
  try {
    const ctx = getAudioContext();
    const startTime = ctx.currentTime + startTimeOffset;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    
    // Envelope to avoid clicks and make it sound pleasant
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  } catch (e) {
    console.error("Audio play error:", e);
  }
}

export const playSuccessSound = () => {
  playTone(523.25, 'sine', 0.15, 0); // C5
  playTone(659.25, 'sine', 0.3, 0.15); // E5
};

export const playErrorSound = () => {
  playTone(300, 'sawtooth', 0.2, 0);
  playTone(250, 'sawtooth', 0.3, 0.2);
};

export const playCompletionSound = () => {
  playTone(440, 'sine', 0.15, 0); // A4
  playTone(554.37, 'sine', 0.15, 0.15); // C#5
  playTone(659.25, 'sine', 0.15, 0.3); // E5
  playTone(880, 'sine', 0.4, 0.45); // A5
};
