import React from 'react';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

export const showAlreadyDownloadedAlert = (
  appLang: 'en' | 'bn',
  onConfirm: () => void
) => {
  toast.custom((t) => (
    <div className="flex flex-col gap-3 p-4 bg-blue-600 text-white rounded-lg shadow-xl border border-blue-500 max-w-sm w-full">
      <div className="flex items-center gap-3 w-full">
        <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
          <Info size={22} className="text-white" />
        </div>
        <div className="flex flex-col flex-grow text-left">
          <span className="font-semibold text-white text-base leading-tight">
            {appLang === 'bn' ? 'ইতিমধ্যেই ডাউনলোড করা হয়েছে!' : 'Already Downloaded!'}
          </span>
          <span className="text-white/90 text-sm mt-1 leading-snug">
            {appLang === 'bn' ? 'আপনি কি এটি পুনরায় ডাউনলোড করতে চান?' : 'Do you want to download it again?'}
          </span>
        </div>
      </div>
      <div className="flex gap-2 w-full mt-1">
        <button 
          onClick={() => { toast.dismiss(t); onConfirm(); }}
          className="flex-1 bg-white text-blue-600 border-none py-2 px-4 rounded-lg font-semibold text-sm cursor-pointer hover:bg-blue-50 transition-colors"
        >
          {appLang === 'bn' ? 'হ্যাঁ, শুরু করুন' : 'Yes, start'}
        </button>
        <button 
          onClick={() => { toast.dismiss(t); }}
          className="flex-1 bg-transparent text-white border border-white/40 py-2 px-4 rounded-lg font-semibold text-sm cursor-pointer hover:bg-white/10 transition-colors"
        >
          {appLang === 'bn' ? 'না, বাতিল' : 'No, cancel'}
        </button>
      </div>
    </div>
  ), { duration: Number.POSITIVE_INFINITY });
};
