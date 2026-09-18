import { useEffect } from 'react';
import { useTranscriptionStore } from './useTranscriptionStore';

export const useTranscriptionState = () => {
    const status = useTranscriptionStore(state => state.status);
    const setStatus = useTranscriptionStore(state => state.setStatus);
    const transcript = useTranscriptionStore(state => state.transcript);
    const setTranscript = useTranscriptionStore(state => state.setTranscript);
    const errorMessage = useTranscriptionStore(state => state.errorMessage);
    const setErrorMessage = useTranscriptionStore(state => state.setErrorMessage);
    
    const file = useTranscriptionStore(state => state.file);
    const setFile = useTranscriptionStore(state => state.setFile);
    const fileUrl = useTranscriptionStore(state => state.fileUrl);
    const setFileUrl = useTranscriptionStore(state => state.setFileUrl);
    const fileMeta = useTranscriptionStore(state => state.fileMeta);
    const setFileMeta = useTranscriptionStore(state => state.setFileMeta);
    
    const progress = useTranscriptionStore(state => state.progress);
    const setProgress = useTranscriptionStore(state => state.setProgress);
    const currentStage = useTranscriptionStore(state => state.currentStage);
    const setCurrentStage = useTranscriptionStore(state => state.setCurrentStage);
    const elapsedSeconds = useTranscriptionStore(state => state.elapsedSeconds);
    const setElapsedSeconds = useTranscriptionStore(state => state.setElapsedSeconds);
    const estimatedSeconds = useTranscriptionStore(state => state.estimatedSeconds);
    const setEstimatedSeconds = useTranscriptionStore(state => state.setEstimatedSeconds);
    
    const showSuccessModal = useTranscriptionStore(state => state.showSuccessModal);
    const setShowSuccessModal = useTranscriptionStore(state => state.setShowSuccessModal);
  
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
