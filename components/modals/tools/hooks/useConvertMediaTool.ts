import { useState, useEffect, useRef } from 'react';
import { useFFmpeg } from '../../../../hooks/useFFmpeg';
import { fetchFile } from '@ffmpeg/util';

export const useConvertMediaTool = (appLang: string, addToast: any) => {
    const [convertFile, setConvertFile] = useState<File | null>(null);
    const [targetFormat, setTargetFormat] = useState(() => {
        return localStorage.getItem('convertTargetFormat') || 'mp3';
    });
    const [audioBitrate, setAudioBitrate] = useState(() => {
        return localStorage.getItem('convertAudioBitrate') || '128k';
    });
    const [videoQuality, setVideoQuality] = useState(() => {
        return localStorage.getItem('convertVideoQuality') || '720p';
    });
    const [convertedResult, setConvertedResult] = useState<{blob: Blob, name: string} | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const convertFileInputRef = useRef<HTMLInputElement>(null);

    const { ffmpeg, isLoaded, loadProgress, loadError, load } = useFFmpeg();

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        localStorage.setItem('convertTargetFormat', targetFormat);
    }, [targetFormat]);

    useEffect(() => {
        localStorage.setItem('convertAudioBitrate', audioBitrate);
    }, [audioBitrate]);

    useEffect(() => {
        localStorage.setItem('convertVideoQuality', videoQuality);
    }, [videoQuality]);

    const handleConverterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setConvertFile(e.target.files[0]);
            setConvertedResult(null);
        }
    };

    const clearConverterFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConvertFile(null);
        setConvertedResult(null);
        if (convertFileInputRef.current) convertFileInputRef.current.value = '';
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

    const processConvert = async () => {
        if (!convertFile) {
            addToast(appLang === 'bn' ? "ফাইল সিলেক্ট করুন" : "Select a file", 'error');
            return;
        }
        if (!isLoaded) {
            addToast(appLang === 'bn' ? "FFmpeg লোড হচ্ছে, দয়া করে অপেক্ষা করুন" : "FFmpeg is loading, please wait", 'warning');
            return;
        }

        setIsProcessing(true);
        setConvertedResult(null);

        try {
            const inputName = convertFile.name.replace(/\s+/g, '_');
            await ffmpeg.writeFile(inputName, await fetchFile(convertFile));

            const outputName = `Converted_${Date.now()}.${targetFormat}`;
            
            const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'opus'].includes(targetFormat);
            
            const args = ['-i', inputName];
            
            if (isAudio) {
                args.push('-b:a', audioBitrate);
            } else {
                if (videoQuality === '1080p') {
                    args.push('-vf', 'scale=-2:1080');
                } else if (videoQuality === '720p') {
                    args.push('-vf', 'scale=-2:720');
                } else if (videoQuality === '480p') {
                    args.push('-vf', 'scale=-2:480');
                }
            }

            args.push(outputName);

            await ffmpeg.exec(args);

            const data = await ffmpeg.readFile(outputName);
            
            let mime = 'application/octet-stream';
            if (isAudio) mime = `audio/${targetFormat}`;
            else if (['mp4', 'webm', 'mkv', 'avi'].includes(targetFormat)) mime = `video/${targetFormat}`;

            const blob = new Blob([(data as Uint8Array).buffer], { type: mime });
            
            setConvertedResult({blob, name: outputName});
            handleDownloadSuccess(blob, outputName);
            addToast(appLang === 'bn' ? "কনভার্ট সফল হয়েছে" : "Conversion successful", 'success');
        } catch (e: any) {
            console.error(e);
            addToast(appLang === 'bn' ? `কনভার্ট ব্যর্থ: ${e.message}` : `Conversion failed: ${e.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        convertFile, setConvertFile,
        targetFormat, setTargetFormat,
        audioBitrate, setAudioBitrate,
        videoQuality, setVideoQuality,
        convertedResult, setConvertedResult,
        isProcessing, setIsProcessing,
        convertFileInputRef,
        isLoaded, loadProgress, loadError, load,
        handleConverterFileChange,
        clearConverterFile,
        handleDownloadSuccess,
        processConvert
    };
};
