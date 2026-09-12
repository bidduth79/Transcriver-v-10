import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';

// Import local assets using Vite's ?url query
// @ts-ignore
import coreURL from '@ffmpeg/core?url';
// @ts-ignore
import wasmURL from '@ffmpeg/core/wasm?url';
// @ts-ignore
import workerURL from '@ffmpeg/ffmpeg/worker?url';

export const useFFmpeg = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const isLoadingRef = useRef(false);

  const load = useCallback(async () => {
    if (isLoaded || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoadProgress(0);
    setLoadError(null);
    const ffmpeg = ffmpegRef.current;

    try {
      // Listen to progress events directly from ffmpeg if possible
      ffmpeg.on('progress', ({ progress }) => {
        // progress is a ratio from 0 to 1
        setLoadProgress(Math.min(99, Math.round(progress * 100)));
      });

      // Since we are loading local assets, it will be very fast.
      // We set an initial progress to show it's working.
      setLoadProgress(50);

      if (typeof SharedArrayBuffer === 'undefined') {
        console.warn("SharedArrayBuffer is not available. FFmpeg may run slower or fail on large files. Ensure COOP/COEP headers are set.");
      }

      await ffmpeg.load({
        coreURL,
        wasmURL,
        classWorkerURL: workerURL
      });
      
      setLoadProgress(100);
      setIsLoaded(true);
    } catch (error: any) {
      console.error("Failed to load FFmpeg:", error);
      setLoadError(error.message || "Failed to load engine");
    } finally {
      isLoadingRef.current = false;
    }
  }, [isLoaded]);

  return { ffmpeg: ffmpegRef.current, isLoaded, loadProgress, loadError, load };
};
