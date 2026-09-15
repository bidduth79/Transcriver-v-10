import { useState, useEffect } from 'react';

export const useTranscriptionState = () => {
    const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
    const [transcript, setTranscript] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, _setFileUrl] = useState<string | null>(null);
    const setFileUrl = (newUrl: string | null) => {
      _setFileUrl(prev => {
        if (prev && prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }
        return newUrl;
      });
    };
    const [fileMeta, setFileMeta] = useState<any>({});
    
    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [estimatedSeconds, setEstimatedSeconds] = useState(0);
    
    const [showSuccessModal, setShowSuccessModal] = useState(false);
  
    useEffect(() => {
      return () => {
        if (fileUrl && fileUrl.startsWith('blob:')) {
          URL.revokeObjectURL(fileUrl);
        }
      };
    }, [fileUrl]);
  
    const resetAll = () => {
      setFile(null);
      setFileUrl(null);
      setFileMeta({});
      setTranscript('');
      setStatus('idle');
    };

    return {
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
    };
};
