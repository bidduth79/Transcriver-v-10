export const useTranscriptToolbar = (setTranscript: any, setStatus: any, setActiveHistoryId: any) => {
  const handleDelete = () => {
    setTranscript('');
    setStatus('idle');
    if (setActiveHistoryId) setActiveHistoryId(null);
  };

  return { handleDelete };
};
