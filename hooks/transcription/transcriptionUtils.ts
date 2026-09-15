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
  
export const calculateEstimatedSeconds = (audioDurationSeconds: number, inputFileSize: number) => {
    let estimated = 25;
    if (audioDurationSeconds > 0) {
        estimated = Math.max(20, Math.floor(15 + audioDurationSeconds * 0.10));
    } else {
        const sizeMB = inputFileSize / (1024 * 1024);
        estimated = Math.max(25, Math.floor(sizeMB * 10));
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
