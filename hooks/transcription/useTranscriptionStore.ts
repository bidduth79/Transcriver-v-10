import { create } from 'zustand';

interface TranscriptionState {
  status: 'idle' | 'processing' | 'completed' | 'error';
  setStatus: (status: 'idle' | 'processing' | 'completed' | 'error' | ((prev: 'idle' | 'processing' | 'completed' | 'error') => 'idle' | 'processing' | 'completed' | 'error')) => void;
  
  transcript: string;
  setTranscript: (transcript: string | ((prev: string) => string)) => void;
  
  errorMessage: string;
  setErrorMessage: (msg: string | ((prev: string) => string)) => void;
  
  file: File | null;
  setFile: (file: File | null | ((prev: File | null) => File | null)) => void;
  
  fileUrl: string | null;
  setFileUrl: (url: string | null | ((prev: string | null) => string | null)) => void;
  
  fileMeta: any;
  setFileMeta: (meta: any | ((prev: any) => any)) => void;
  
  progress: number;
  setProgress: (progress: number | ((prev: number) => number)) => void;
  
  currentStage: string;
  setCurrentStage: (stage: string | ((prev: string) => string)) => void;
  
  elapsedSeconds: number;
  setElapsedSeconds: (seconds: number | ((prev: number) => number)) => void;
  
  estimatedSeconds: number;
  setEstimatedSeconds: (seconds: number | ((prev: number) => number)) => void;
  
  showSuccessModal: boolean;
  setShowSuccessModal: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
  status: 'idle',
  setStatus: (status) => set((state) => ({ 
    status: typeof status === 'function' ? status(state.status) : status 
  })),
  
  transcript: '',
  setTranscript: (transcript) => set((state) => ({ 
    transcript: typeof transcript === 'function' ? transcript(state.transcript) : transcript 
  })),
  
  errorMessage: '',
  setErrorMessage: (msg) => set((state) => ({ 
    errorMessage: typeof msg === 'function' ? msg(state.errorMessage) : msg 
  })),
  
  file: null,
  setFile: (file) => set((state) => ({ 
    file: typeof file === 'function' ? file(state.file) : file 
  })),
  
  fileUrl: null,
  setFileUrl: (url) => set((state) => {
    const newUrl = typeof url === 'function' ? url(state.fileUrl) : url;
    if (state.fileUrl && state.fileUrl.startsWith('blob:') && state.fileUrl !== newUrl) {
      URL.revokeObjectURL(state.fileUrl);
    }
    return { fileUrl: newUrl };
  }),
  
  fileMeta: {},
  setFileMeta: (meta) => set((state) => ({ 
    fileMeta: typeof meta === 'function' ? meta(state.fileMeta) : meta 
  })),
  
  progress: 0,
  setProgress: (progress) => set((state) => ({ 
    progress: typeof progress === 'function' ? progress(state.progress) : progress 
  })),
  
  currentStage: '',
  setCurrentStage: (stage) => set((state) => ({ 
    currentStage: typeof stage === 'function' ? stage(state.currentStage) : stage 
  })),
  
  elapsedSeconds: 0,
  setElapsedSeconds: (seconds) => set((state) => ({ 
    elapsedSeconds: typeof seconds === 'function' ? seconds(state.elapsedSeconds) : seconds 
  })),
  
  estimatedSeconds: 0,
  setEstimatedSeconds: (seconds) => set((state) => ({ 
    estimatedSeconds: typeof seconds === 'function' ? seconds(state.estimatedSeconds) : seconds 
  })),
  
  showSuccessModal: false,
  setShowSuccessModal: (show) => set((state) => ({ 
    showSuccessModal: typeof show === 'function' ? show(state.showSuccessModal) : show 
  }))
}));
