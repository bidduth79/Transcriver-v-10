import { useState, useRef, useEffect } from 'react';
import { useFFmpeg } from '../../../../hooks/useFFmpeg';
import { fetchFile } from '@ffmpeg/util';

export const useCutMediaTool = ({ addToast, appLang, onFileSelect, setIsMinimized }: any) => {
    const [cutMode, setCutMode] = useState<'manual' | 'split'>('manual');
    const [splitCount, setSplitCount] = useState<number>(2);
    const [splitResults, setSplitResults] = useState<{name: string, blob: Blob}[]>([]);
    const [cutFile, setCutFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [startTime, setStartTime] = useState('00:00:00');
    const [endTime, setEndTime] = useState('00:00:10');
    const [mediaDuration, setMediaDuration] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const cutFileInputRef = useRef<HTMLInputElement>(null);
    const mediaRef = useRef<HTMLMediaElement>(null);

    const { ffmpeg, isLoaded, loadProgress, loadError, load } = useFFmpeg();

    useEffect(() => {
        load();
    }, [load]);

    const handleCutFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCutFile(file);
            setSplitResults([]);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearCutFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCutFile(null);
        setSplitResults([]);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (cutFileInputRef.current) cutFileInputRef.current.value = '';
    };

    const handleResetTime = () => {
        setStartTime('00:00:00');
        setEndTime('00:00:10');
        addToast(appLang === 'bn' ? "সময় রিসেট হয়েছে" : "Time Reset", "info");
    };

    const timeToSeconds = (timeStr: string) => {
        const parts = timeStr.split(':').map(Number);
        if (parts.length !== 3) return 0;
        return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    };

    const secondsToTimestamp = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        const ss = Math.floor(s).toString().padStart(2, '0');
        const ms = Math.round((s - Math.floor(s)) * 1000).toString().padStart(3, '0');
        return `${hh}:${mm}:${ss}.${ms}`;
    };

    useEffect(() => {
        if (mediaRef.current && startTime && cutMode === 'manual') {
            mediaRef.current.currentTime = timeToSeconds(startTime);
        }
    }, [startTime, cutMode]);

    useEffect(() => {
        if (mediaRef.current && endTime && cutMode === 'manual') {
            mediaRef.current.currentTime = timeToSeconds(endTime);
        }
    }, [endTime, cutMode]);

    const handleMetadataLoaded = () => {
        if (mediaRef.current) {
            setMediaDuration(mediaRef.current.duration);
        }
    };

    const handleDownloadSuccess = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(appLang === 'bn' ? "ডাউনলোড শুরু হয়েছে (ব্রাউজার ফোল্ডার চেক করুন)" : "Download Started (Check browser downloads)", "success");
    };

    const handleTranscribePart = (part: {name: string, blob: Blob}) => {
        if (onFileSelect) {
            const file = new File([part.blob], part.name, { type: part.blob.type });
            onFileSelect(file);
            setIsMinimized(true);
            addToast(appLang === 'bn' ? "ট্রান্সক্রিপশন শুরু হচ্ছে... (টুলস মিনিমাইজড)" : "Starting transcription... (Tools Minimized)", 'info');
        }
    };

    const processCut = async () => {
        if (!cutFile) {
            addToast(appLang === 'bn' ? "ফাইল সিলেক্ট করুন" : "Select a file", 'error');
            return;
        }
        if (!isLoaded) {
            addToast(appLang === 'bn' ? "FFmpeg লোড হচ্ছে, দয়া করে অপেক্ষা করুন" : "FFmpeg is loading, please wait", 'warning');
            return;
        }

        setIsProcessing(true);
        setSplitResults([]);

        try {
            const inputName = cutFile.name.replace(/\s+/g, '_');
            await ffmpeg.writeFile(inputName, await fetchFile(cutFile));

            if (cutMode === 'manual') {
                if (!startTime.match(/^\d{2}:\d{2}:\d{2}$/) || !endTime.match(/^\d{2}:\d{2}:\d{2}$/)) {
                    addToast(appLang === 'bn' ? "সঠিক সময় দিন (HH:MM:SS)" : "Invalid time format", 'error');
                    setIsProcessing(false);
                    return;
                }

                setProcessingStatus(appLang === 'bn' ? 'কাট করা হচ্ছে...' : 'Cutting...');
                const outputName = `Cut_${inputName}`;
                
                await ffmpeg.exec([
                    '-i', inputName,
                    '-ss', startTime,
                    '-to', endTime,
                    '-c', 'copy',
                    outputName
                ]);

                const data = await ffmpeg.readFile(outputName);
                const blob = new Blob([(data as Uint8Array).buffer], { type: cutFile.type });
                handleDownloadSuccess(blob, outputName);
                
            } else {
                if (!mediaDuration || mediaDuration <= 0) {
                    throw new Error("Invalid media duration");
                }

                const segmentDuration = mediaDuration / splitCount;
                const generatedFiles = [];

                for (let i = 0; i < splitCount; i++) {
                    setProcessingStatus(appLang === 'bn' ? `প্রসেসিং পার্ট ${i+1}/${splitCount}...` : `Processing Part ${i+1}/${splitCount}...`);
                    
                    const startSec = i * segmentDuration;
                    const endSec = (i + 1) * segmentDuration;
                    const startStr = secondsToTimestamp(startSec);
                    const endStr = secondsToTimestamp(endSec);
                    
                    const outputName = `Part_${i+1}_of_${splitCount}_${inputName}`;

                    await ffmpeg.exec([
                        '-i', inputName,
                        '-ss', startStr,
                        '-to', endStr,
                        '-c', 'copy',
                        outputName
                    ]);

                    const data = await ffmpeg.readFile(outputName);
                    const blob = new Blob([(data as Uint8Array).buffer], { type: cutFile.type });
                    
                    generatedFiles.push({
                        name: outputName,
                        blob: blob
                    });
                }
                setSplitResults(generatedFiles);
                addToast(appLang === 'bn' ? "স্প্লিট সম্পন্ন হয়েছে" : "Split completed", 'success');
            }
        } catch (e: any) {
            console.error(e);
            addToast(appLang === 'bn' ? `ব্যর্থ: ${e.message}` : `Failed: ${e.message}`, 'error');
        } finally {
            setIsProcessing(false);
            setProcessingStatus('');
        }
    };

    return {
        cutMode, setCutMode,
        splitCount, setSplitCount,
        splitResults,
        cutFile,
        previewUrl,
        startTime, setStartTime,
        endTime, setEndTime,
        isProcessing, processingStatus,
        cutFileInputRef, mediaRef,
        isLoaded, loadProgress, loadError, load,
        handleCutFileChange, clearCutFile, handleResetTime,
        handleMetadataLoaded, handleDownloadSuccess, handleTranscribePart,
        processCut
    };
};
