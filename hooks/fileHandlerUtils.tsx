import React from 'react';
import { toast } from 'sonner';
import { FileMeta, HistoryItem, TranscriptMeta } from '../types';
import { CheckCircle, XCircle, Info, FolderUp } from 'lucide-react';

export const showFolderUploadModal = (
    appLang: string, 
    supportedFilesCount: number,
    onConfirm: () => void,
    onCancel: () => void
) => {
    toast.custom((t) => (
      <div className="flex flex-col gap-3 p-4 bg-emerald-800 text-white rounded-lg shadow-xl border border-emerald-700 max-w-sm w-full">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-inner">
            <FolderUp size={20} className="text-white" />
          </div>
          <div className="flex flex-col flex-grow text-left">
            <span className="font-semibold text-white text-sm leading-tight">
              {appLang === 'bn' ? 'ফোল্ডার আপলোড' : 'Folder Upload'}
            </span>
            <span className="text-emerald-100 text-xs mt-1 leading-snug">
              {appLang === 'bn' ? `মোট ${supportedFilesCount} টি ফাইল পাওয়া গেছে। আপনি কি ব্যাচ প্রসেসিং শুরু করতে চান?` : `Found ${supportedFilesCount} files. Do you want to start batch processing?`}
            </span>
          </div>
        </div>
        <div className="flex gap-2 w-full mt-1">
          <button 
            onClick={() => { toast.dismiss(t); onConfirm(); }}
            className="flex-1 bg-white text-emerald-900 border-none py-1.5 px-3 rounded-full font-semibold text-xs cursor-pointer hover:bg-emerald-50 transition-colors"
          >
            {appLang === 'bn' ? 'শুরু করুন' : 'Start'}
          </button>
          <button 
            onClick={() => { toast.dismiss(t); onCancel(); }}
            className="flex-1 bg-transparent text-white border border-emerald-400/50 py-1.5 px-3 rounded-full font-semibold text-xs cursor-pointer hover:bg-white/10 transition-colors"
          >
            {appLang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
        </div>
      </div>
    ), { duration: Number.POSITIVE_INFINITY });
};

export const showNoFilesFoundModal = (appLang: string) => {
    toast.custom((t) => (
      <div className="flex items-center gap-3 p-4 bg-red-900 text-white rounded-lg shadow-xl border border-red-800 max-w-sm w-full">
        <div className="flex-shrink-0 w-10 h-10 bg-red-700 rounded-full flex items-center justify-center shadow-inner">
          <XCircle size={20} className="text-white" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-semibold text-white text-sm leading-tight">
            {appLang === 'bn' ? 'কোনো অডিও/ভিডিও ফাইল পাওয়া যায়নি' : 'No Audio/Video Files Found'}
          </span>
        </div>
      </div>
    ), { duration: 3000 });
};

export const showFileAlreadyTranscribedModal = (
    appLang: string,
    onConfirm: () => void,
    onCancel: () => void
) => {
    toast.custom((t) => (
      <div className="flex flex-col gap-3 p-4 bg-blue-900 text-white rounded-lg shadow-xl border border-blue-800 max-w-sm w-full">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center shadow-inner">
            <Info size={20} className="text-white" />
          </div>
          <div className="flex flex-col flex-grow text-left">
            <span className="font-semibold text-white text-sm leading-tight">
              {appLang === 'bn' ? 'ফাইলটি ইতিমধ্যে ট্রান্সক্রাইব করা হয়েছে!' : 'File Already Transcribed!'}
            </span>
            <span className="text-blue-100 text-xs mt-1 leading-snug">
              {appLang === 'bn' ? 'আপনি কি নতুন করে আবার ট্রান্সক্রাইব করতে চান, নাকি আগের রেজাল্ট দেখতে চান?' : 'Do you want to transcribe it again, or view the previous result?'}
            </span>
          </div>
        </div>
        <div className="flex gap-2 w-full mt-1">
          <button 
            onClick={() => { toast.dismiss(t); onConfirm(); }}
            className="flex-1 bg-white text-blue-900 border-none py-1.5 px-3 rounded-full font-semibold text-xs cursor-pointer hover:bg-blue-50 transition-colors"
          >
            {appLang === 'bn' ? 'নতুন করে করুন' : 'Transcribe Again'}
          </button>
          <button 
            onClick={() => { toast.dismiss(t); onCancel(); }}
            className="flex-1 bg-transparent text-white border border-blue-400/50 py-1.5 px-3 rounded-full font-semibold text-xs cursor-pointer hover:bg-white/10 transition-colors"
          >
            {appLang === 'bn' ? 'আগেরটি দেখুন' : 'View Existing'}
          </button>
        </div>
      </div>
    ), { duration: Number.POSITIVE_INFINITY });
};
