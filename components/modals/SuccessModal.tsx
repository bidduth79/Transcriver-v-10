import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  elapsedSeconds: number;
  appLang: 'bn' | 'en';
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, elapsedSeconds, appLang }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for exit animation
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
          >
            
            {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none"></div>

        {/* Checkmark Icon */}
        <div className="w-20 h-20 bg-emerald-900/30 rounded-[1.5rem] flex items-center justify-center mb-6 relative border border-emerald-500/20">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
              className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </motion.div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-white mb-8 font-stylish-bn tracking-tight">
            {appLang === 'bn' ? 'ট্রান্সক্রিপশন সফল!' : 'Transcription Successful!'}
        </h2>

        {/* Time Box */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full mb-8 shadow-inner">
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
                {appLang === 'bn' ? 'মোট সময় লেগেছে:' : 'Total Time Taken:'}
            </p>
            <p className="text-4xl font-black text-white tabular-nums tracking-wider">
                {formatTime(elapsedSeconds)}
            </p>
        </div>

        {/* Button */}
        <button 
            onClick={handleClose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 text-sm uppercase tracking-widest cursor-pointer"
        >
            {appLang === 'bn' ? 'ঠিক আছে' : 'OKAY'}
        </button>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
